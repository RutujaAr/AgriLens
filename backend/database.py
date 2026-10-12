import logging
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import DATABASE_URL, BASE_DIR

logger = logging.getLogger("agrilens.database")

Base = declarative_base()

# Configure SQLite fallback path
SQLITE_FALLBACK_PATH = BASE_DIR / "agrilens.db"
SQLITE_FALLBACK_URL = f"sqlite:///{SQLITE_FALLBACK_PATH}"

is_sqlite = DATABASE_URL.startswith("sqlite")

def _create_sqlite_engine():
    return create_engine(
        SQLITE_FALLBACK_URL,
        connect_args={"check_same_thread": False}
    )

def _test_engine_connection(eng, timeout_sec: int = 4) -> bool:
    try:
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.warning(f"[DB] Engine connection check failed ({e})")
        return False

# Initialize primary engine
if is_sqlite:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    engine_type = "sqlite"
else:
    # Attempt connecting to primary PostgreSQL / remote database with a bounded timeout
    try:
        primary_engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
            pool_recycle=1800,
            connect_args={"connect_timeout": 4}
        )
        if _test_engine_connection(primary_engine, timeout_sec=4):
            engine = primary_engine
            engine_type = "postgresql"
            logger.info("[DB] Successfully connected to primary PostgreSQL database")
        else:
            logger.warning("[DB] Primary PostgreSQL is unreachable (Supabase may be paused). Falling back to local SQLite.")
            engine = _create_sqlite_engine()
            engine_type = "sqlite_fallback"
    except Exception as e:
        logger.error(f"[DB] Error initializing primary database engine: {e}. Falling back to SQLite.")
        engine = _create_sqlite_engine()
        engine_type = "sqlite_fallback"

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_engine():
    return engine

def get_engine_type() -> str:
    return engine_type

def is_db_connected() -> bool:
    return _test_engine_connection(engine)

def switch_to_sqlite_fallback():
    global engine, engine_type, SessionLocal
    if engine_type != "sqlite_fallback" and engine_type != "sqlite":
        logger.warning("[DB] Explicitly activating resilient SQLite fallback database")
        engine = _create_sqlite_engine()
        engine_type = "sqlite_fallback"
        Base.metadata.create_all(bind=engine)
        SessionLocal.configure(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as exc:
        # Detect connection failure during active query and trigger fallback if using PostgreSQL
        if engine_type == "postgresql":
            logger.error(f"[DB] Database query failed with PostgreSQL error: {exc}. Switching to SQLite fallback.")
            try:
                switch_to_sqlite_fallback()
            except Exception:
                pass
        raise
    finally:
        db.close()

