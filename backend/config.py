import os
from pathlib import Path
from typing import List

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
SAMPLE_DIR = BASE_DIR / "sample_datasets"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
SAMPLE_DIR.mkdir(parents=True, exist_ok=True)

# Environment Mode: 'development' or 'production'
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").strip().lower()

# JWT Secret & Cryptographic settings
DEFAULT_DEV_SECRET = "agrilens-dev-secret-key-cse-minor-project-2026-auth-token"
SECRET_KEY = os.getenv("SECRET_KEY", DEFAULT_DEV_SECRET)

if ENVIRONMENT == "production" and (not SECRET_KEY or SECRET_KEY == DEFAULT_DEV_SECRET):
    raise ValueError(
        "CRITICAL SECURITY CONFIGURATION ERROR: "
        "A strong, unique SECRET_KEY environment variable must be provided when running in production mode."
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24)))  # 24 hours

# Database URL with automated Postgres driver normalization (explicit psycopg2 driver)
raw_db_url = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'agrilens.db'}")
if raw_db_url.startswith("postgres://"):
    DATABASE_URL = raw_db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif raw_db_url.startswith("postgresql://"):
    DATABASE_URL = raw_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
elif raw_db_url.startswith("postgresql+psycopg://"):
    DATABASE_URL = raw_db_url.replace("postgresql+psycopg://", "postgresql+psycopg2://", 1)
else:
    DATABASE_URL = raw_db_url

# CORS Allowed Origins
DEFAULT_DEV_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
ALLOWED_ORIGINS_RAW = os.getenv("ALLOWED_ORIGINS", DEFAULT_DEV_ORIGINS)
ALLOWED_ORIGINS: List[str] = [origin.strip() for origin in ALLOWED_ORIGINS_RAW.split(",") if origin.strip()]

# Demo credentials control (enabled by default in dev, disabled in prod unless explicitly enabled)
ENABLE_DEMO_USERS_RAW = os.getenv(
    "ENABLE_DEMO_USERS",
    "true" if ENVIRONMENT == "development" else "false"
)
ENABLE_DEMO_USERS = ENABLE_DEMO_USERS_RAW.strip().lower() in ("true", "1", "yes", "y")

# Dataset upload security limits
MAX_UPLOAD_SIZE_BYTES = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", str(50 * 1024 * 1024)))  # 50 MB limit
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls", ".json"}
