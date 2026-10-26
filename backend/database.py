import re
import logging
from pathlib import Path
from typing import Tuple, Optional, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import DATABASE_URL, BASE_DIR, ENVIRONMENT

logger = logging.getLogger("agrilens.database")

Base = declarative_base()

# Local SQLite fallback path
SQLITE_FALLBACK_PATH = BASE_DIR / "agrilens.db"
SQLITE_FALLBACK_URL = f"sqlite:///{SQLITE_FALLBACK_PATH}"

def sanitize_db_credentials(text_msg: str) -> str:
    """Removes sensitive credentials, passwords, or connection URIs from error messages."""
    if not text_msg:
        return ""
    # Strip user:password in URLs: :password@ -> :***@
    msg = re.sub(r':([^@/\s:]+)@', ':***@', str(text_msg))
    # Strip password=... in query strings
    msg = re.sub(r'password=[^\s;]+', 'password=***', msg, flags=re.IGNORECASE)
    # Strip secret keys if any
    msg = re.sub(r'secret[_-]?key=[^\s;]+', 'secret_key=***', msg, flags=re.IGNORECASE)
    return msg

def _create_sqlite_engine():
    return create_engine(
        SQLITE_FALLBACK_URL,
        connect_args={"check_same_thread": False}
    )

def _test_engine_connection(eng) -> Tuple[bool, Optional[str]]:
    try:
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True, None
    except Exception as e:
        sanitized = sanitize_db_credentials(str(e))
        logger.warning(f"[DB] Engine connection check failed: {sanitized}")
        return False, sanitized

# Determine configured engine type from connection string
is_sqlite = DATABASE_URL.startswith("sqlite")
configured_engine_type = "sqlite" if is_sqlite else "postgresql"
active_engine_type = configured_engine_type
db_connection_error: Optional[str] = None

# Initialize database engine
if is_sqlite:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    active_engine_type = "sqlite"
    logger.info("[DB] Using configured SQLite database for local development.")
else:
    # Attempt connecting to primary PostgreSQL (e.g., Supabase / RDS)
    try:
        connect_args: Dict[str, Any] = {"connect_timeout": 10}
        # For remote Postgres connections (like Supabase), ensure sslmode is required if not in URL
        if "sslmode=" not in DATABASE_URL and "localhost" not in DATABASE_URL and "127.0.0.1" not in DATABASE_URL:
            connect_args["sslmode"] = "require"

        primary_engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
            pool_recycle=1800,
            connect_args=connect_args
        )
        is_ok, err_msg = _test_engine_connection(primary_engine)
        if is_ok:
            engine = primary_engine
            active_engine_type = "postgresql"
            db_connection_error = None
            logger.info("[DB] Successfully connected to primary PostgreSQL database.")
        else:
            db_connection_error = err_msg or "Failed to connect to primary PostgreSQL."
            logger.error(
                f"[DB] Primary PostgreSQL is unreachable ({db_connection_error}). "
                f"Falling back to local SQLite to maintain service availability while reporting degraded status."
            )
            engine = _create_sqlite_engine()
            active_engine_type = "sqlite_fallback"
    except Exception as e:
        db_connection_error = sanitize_db_credentials(str(e))
        logger.error(f"[DB] Error initializing primary PostgreSQL engine: {db_connection_error}. Falling back to SQLite.")
        engine = _create_sqlite_engine()
        active_engine_type = "sqlite_fallback"

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_engine():
    return engine

def get_engine_type() -> str:
    """Returns the currently active engine type ('postgresql', 'sqlite', 'sqlite_fallback')."""
    return active_engine_type

def get_configured_engine_type() -> str:
    """Returns the configured engine type ('postgresql' or 'sqlite')."""
    return configured_engine_type

def get_db_connection_error() -> Optional[str]:
    """Returns the sanitized error message if PostgreSQL connection failed."""
    return db_connection_error

def is_db_connected() -> bool:
    is_ok, _ = _test_engine_connection(engine)
    return is_ok

def get_db_health_info() -> Dict[str, Any]:
    """
    Returns transparent diagnostic information about database status,
    configured database, active database, and safe troubleshooting details.
    Never exposes passwords, tokens, or raw credentials.
    """
    is_connected, active_err = _test_engine_connection(engine)
    
    # If postgresql was configured but sqlite_fallback is active, system is degraded
    if configured_engine_type == "postgresql" and active_engine_type != "postgresql":
        status_str = "degraded"
        detail_msg = f"Configured PostgreSQL is unreachable ({db_connection_error or 'connection failed'}). Using local SQLite fallback."
        diagnostic = (
            "Action required: Check Supabase project status (confirm project is active and not paused). "
            "Verify DATABASE_URL in Render environment variables uses the transaction/session pooler "
            "(e.g., aws-0-region.pooler.supabase.com:6543) with valid password and ?sslmode=require."
        )
    elif not is_connected:
        status_str = "unhealthy"
        detail_msg = f"Database query check failed ({active_err or 'unknown error'})."
        diagnostic = "Check database connectivity and server permissions."
    else:
        status_str = "healthy"
        detail_msg = f"Connected to {active_engine_type} database."
        diagnostic = "Database operational."

    return {
        "status": status_str,
        "configured_database": configured_engine_type,
        "active_database": active_engine_type,
        "is_connected": is_connected,
        "detail": detail_msg,
        "diagnostic": diagnostic
    }

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
