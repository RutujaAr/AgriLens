import os
import io
import shutil
import uuid
import json
import logging
from pathlib import Path
from typing import Optional, List, Dict, Tuple
import pandas as pd

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session
import traceback

from .config import (
    UPLOAD_DIR, SAMPLE_DIR, MAX_UPLOAD_SIZE_BYTES, ALLOWED_EXTENSIONS,
    ENVIRONMENT, ALLOWED_ORIGINS, ENABLE_DEMO_USERS
)
from .database import engine, Base, SessionLocal, get_db, get_engine, get_engine_type, is_db_connected
from .models import User, DatasetRecord
from .schemas import (
    UserRegister, UserLogin, UserResponse, TokenResponse,
    DatasetProfile, CleaningOptions, CleaningReport,
    EDAResponse, CorrelationResponse, RainfallYieldResponse,
    StateAnalysisResponse, InsightsResponse, DataSourceInfo
)
from .auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, get_optional_user, get_current_officer
)
from .demo_data import (
    SAMPLE_CSV_PATH, OFFICIAL_SOURCE_METADATA,
    generate_official_sample_dataset, save_official_sample_if_needed
)
from .dataset_service import (
    load_dataset_file, profile_dataset, clean_and_preprocess_dataset
)
from .analytics_service import (
    compute_eda, compute_correlation_matrix, analyze_rainfall_vs_crop_yield,
    analyze_states, generate_automatic_visualizations, generate_agricultural_insights
)

# Logger setup
logger = logging.getLogger("agrilens")
logging.basicConfig(level=logging.INFO)

# Safe Database tables initialization
def init_db():
    try:
        active_eng = get_engine()
        Base.metadata.create_all(bind=active_eng)
        logger.info(f"[DB] Database tables initialized successfully on {get_engine_type()}")
    except Exception as e:
        logger.error(f"[DB] Warning: could not initialize database tables immediately: {e}")

init_db()

app = FastAPI(
    title="AgriLens API",
    description="Automated Agricultural Dataset Analysis & Visualization Backend",
    version="1.0.0"
)

# Response Compression Middleware for optimal network performance
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS Middleware with strict origin control and wildcard Vercel support
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handlers ensuring CORS headers are ALWAYS returned even on internal failures
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"[Unhandled Exception] {request.method} {request.url.path}: {exc}\n{traceback.format_exc()}")
    origin = request.headers.get("origin")
    allow_origin = origin if origin else "*"
    response = JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )
    response.headers["Access-Control-Allow-Origin"] = allow_origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    origin = request.headers.get("origin")
    allow_origin = origin if origin else "*"
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
    response.headers["Access-Control-Allow-Origin"] = allow_origin
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# Seed demo users for local development / demonstration if enabled
def seed_demo_users():
    if not ENABLE_DEMO_USERS:
        return
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.username == "officer").first():
            officer = User(
                username="officer",
                email="officer@agrilens.gov.in",
                hashed_password=hash_password("officer123"),
                role="officer"
            )
            db.add(officer)
        if not db.query(User).filter(User.username == "farmer").first():
            farmer = User(
                username="farmer",
                email="farmer@kisan.gov.in",
                hashed_password=hash_password("farmer123"),
                role="farmer"
            )
            db.add(farmer)
        db.commit()
        logger.info("[Seed] Demo accounts initialized (officer, farmer)")
    except Exception as e:
        db.rollback()
        logger.warning(f"[Seed] Note: {e}")
    finally:
        db.close()

seed_demo_users()


# ---------------- SYSTEM HEALTH ----------------

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "healthy" if "unhealthy" not in db_status else "degraded",
        "app": "AgriLens - Agricultural Data Analysis & Visualization",
        "environment": ENVIRONMENT,
        "database": get_engine_type(),
        "database_status": db_status,
        "version": "1.0.0"
    }


# ---------------- AUTHENTICATION ENDPOINTS ----------------

@app.post("/api/auth/register", response_model=TokenResponse)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        role=user_in.role if user_in.role in ["farmer", "officer"] else "farmer"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.id, "role": new_user.role, "name": new_user.username})
    return {"access_token": token, "token_type": "bearer", "user": new_user}

@app.post("/api/auth/login", response_model=TokenResponse)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.username == login_in.username_or_email) | (User.email == login_in.username_or_email)
    ).first()

    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token({"sub": user.id, "role": user.role, "name": user.username})
    return {"access_token": token, "token_type": "bearer", "user": user}

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ---------------- DATASET MANAGEMENT ENDPOINTS ----------------

@app.post("/api/datasets/upload", response_model=DatasetProfile)
async def upload_dataset(
    file: UploadFile = File(...),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Upload and profile an agricultural dataset (CSV, XLSX, JSON).
    Implements security sanitization, extension validation, size checks,
    and persistent database storage for cloud container portability.
    """
    raw_filename = Path(file.filename or "dataset.csv").name
    file_ext = Path(raw_filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{file_ext}'. Please upload a CSV, XLSX, or JSON file."
        )

    # Sanitize file stem for safe storage
    clean_stem = "".join(c for c in Path(raw_filename).stem if c.isalnum() or c in ("-", "_"))[:30] or "dataset"
    safe_filename = f"{uuid.uuid4().hex}_{clean_stem}{file_ext}"
    raw_path = UPLOAD_DIR / safe_filename

    # Read and validate size
    contents = await file.read()
    if len(contents) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum limit of {MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB."
        )
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Write to local cache if directory is available
    try:
        with open(raw_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        logger.warning(f"Could not write to local cache disk: {e}")

    # Load dataset safely into pandas
    try:
        if file_ext == ".csv":
            try:
                df = pd.read_csv(io.BytesIO(contents), encoding="utf-8")
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(contents), encoding="latin1")
        elif file_ext in [".xlsx", ".xls"]:
            df = pd.read_excel(io.BytesIO(contents))
        elif file_ext == ".json":
            df = pd.read_json(io.BytesIO(contents))
        else:
            raise ValueError(f"Unsupported format: {file_ext}")
    except Exception as e:
        if raw_path.exists():
            try:
                os.remove(raw_path)
            except Exception:
                pass
        raise HTTPException(status_code=400, detail=f"Failed to parse dataset: {str(e)}")

    if df.empty or len(df.columns) == 0:
        if raw_path.exists():
            try:
                os.remove(raw_path)
            except Exception:
                pass
        raise HTTPException(status_code=400, detail="Dataset contains no readable records or columns.")

    # Generate persistent CSV representation for cloud storage
    csv_text = df.to_csv(index=False)

    # Create dataset record
    dataset_rec = DatasetRecord(
        user_id=current_user.id if current_user else None,
        filename=safe_filename,
        original_name=raw_filename,
        file_type=file_ext.strip("."),
        file_size_bytes=len(contents),
        row_count=len(df),
        col_count=len(df.columns),
        is_official_sample=False,
        raw_file_path=str(raw_path),
        cleaned_file_path=None,
        raw_data_content=csv_text,
        cleaned_data_content=None
    )
    db.add(dataset_rec)
    db.commit()
    db.refresh(dataset_rec)

    # Profile dataset
    profile = profile_dataset(
        df=df,
        dataset_id=dataset_rec.id,
        original_name=dataset_rec.original_name,
        file_type=dataset_rec.file_type,
        file_size_bytes=dataset_rec.file_size_bytes,
        is_official=False
    )

    dataset_rec.quality_score = profile["quality_score"]
    dataset_rec.profile_json = json.dumps(profile)
    db.commit()

    return profile

@app.post("/api/datasets/demo", response_model=DatasetProfile)
def load_demo_dataset(
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Instantly loads or reuses the verified Indian Agricultural demonstration dataset.
    Reuses existing active demo record if already loaded to avoid creating redundant duplicate records.
    """
    # 1. Deduplication check: if an official demo dataset already exists for this user / session, reuse it
    existing_demo = db.query(DatasetRecord).filter(
        DatasetRecord.is_official_sample == True,
        DatasetRecord.user_id == (current_user.id if current_user else None)
    ).order_by(DatasetRecord.uploaded_at.desc()).first()

    if existing_demo and existing_demo.profile_json:
        try:
            cached_profile = json.loads(existing_demo.profile_json)
            # Verify ID and basic keys
            if cached_profile.get("dataset_id") or cached_profile.get("id"):
                logger.info(f"[Demo] Reusing existing demo dataset id={existing_demo.id}")
                return cached_profile
        except Exception as parse_err:
            logger.warning(f"[Demo] Could not parse existing profile JSON: {parse_err}")

    save_official_sample_if_needed()

    safe_filename = f"official_sample_{uuid.uuid4().hex[:8]}.csv"
    demo_path = UPLOAD_DIR / safe_filename
    
    try:
        shutil.copy(SAMPLE_CSV_PATH, demo_path)
    except Exception:
        pass

    df = load_dataset_file(SAMPLE_CSV_PATH if SAMPLE_CSV_PATH.exists() else demo_path)
    csv_text = df.to_csv(index=False)

    dataset_rec = DatasetRecord(
        user_id=current_user.id if current_user else None,
        filename=safe_filename,
        original_name="Official_DES_IMD_All_India_Agriculture_Sample.csv",
        file_type="csv",
        file_size_bytes=len(csv_text.encode('utf-8')),
        row_count=len(df),
        col_count=len(df.columns),
        is_official_sample=True,
        raw_file_path=str(demo_path),
        cleaned_file_path=None,
        raw_data_content=csv_text,
        cleaned_data_content=None
    )
    db.add(dataset_rec)
    db.commit()
    db.refresh(dataset_rec)

    profile = profile_dataset(
        df=df,
        dataset_id=dataset_rec.id,
        original_name=dataset_rec.original_name,
        file_type=dataset_rec.file_type,
        file_size_bytes=dataset_rec.file_size_bytes,
        is_official=True
    )

    dataset_rec.quality_score = profile["quality_score"]
    dataset_rec.profile_json = json.dumps(profile)
    db.commit()

    return profile

@app.get("/api/datasets/my-datasets")
def list_my_datasets(
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    query = db.query(DatasetRecord)
    if current_user:
        query = query.filter((DatasetRecord.user_id == current_user.id) | (DatasetRecord.user_id == None))
    records = query.order_by(DatasetRecord.uploaded_at.desc()).all()
    
    return [
        {
            "id": r.id,
            "original_name": r.original_name,
            "file_type": r.file_type,
            "row_count": r.row_count,
            "col_count": r.col_count,
            "is_official_sample": r.is_official_sample,
            "is_cleaned": r.is_cleaned,
            "quality_score": r.quality_score,
            "uploaded_at": r.uploaded_at.isoformat()
        }
        for r in records
    ]

@app.get("/api/datasets/{dataset_id}", response_model=DatasetProfile)
def get_dataset_profile(dataset_id: int, db: Session = Depends(get_db)):
    rec = db.query(DatasetRecord).filter(DatasetRecord.id == dataset_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if rec.profile_json:
        return json.loads(rec.profile_json)

    # Re-profile if needed
    df, _ = get_active_df(rec)
    profile = profile_dataset(
        df=df,
        dataset_id=rec.id,
        original_name=rec.original_name,
        file_type=rec.file_type,
        file_size_bytes=rec.file_size_bytes,
        is_official=rec.is_official_sample
    )
    return profile

@app.post("/api/datasets/{dataset_id}/clean")
def clean_dataset(
    dataset_id: int,
    options: CleaningOptions,
    db: Session = Depends(get_db)
):
    """
    Executes actual data preprocessing: duplicate removal, median imputation, etc.
    Saves cleaned dataset in database and separately from raw file.
    """
    rec = db.query(DatasetRecord).filter(DatasetRecord.id == dataset_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Load raw dataframe from DB content or disk
    if rec.raw_data_content:
        raw_df = pd.read_csv(io.StringIO(rec.raw_data_content))
    elif rec.raw_file_path and Path(rec.raw_file_path).exists():
        raw_df = load_dataset_file(Path(rec.raw_file_path))
    elif rec.is_official_sample and SAMPLE_CSV_PATH.exists():
        raw_df = load_dataset_file(SAMPLE_CSV_PATH)
    else:
        raise HTTPException(status_code=404, detail="Raw dataset source content not found on server")

    # Retrieve current column mappings from profile
    col_mappings = {}
    if rec.profile_json:
        prof = json.loads(rec.profile_json)
        col_mappings = {c["name"]: c["detected_variable"] for c in prof.get("columns", []) if c.get("detected_variable")}

    cleaned_df, report = clean_and_preprocess_dataset(
        df=raw_df,
        col_mappings=col_mappings,
        remove_duplicates=options.remove_duplicates,
        impute_numerical=options.impute_numerical,
        impute_categorical=options.impute_categorical,
        standardize_column_names=options.standardize_column_names
    )

    cleaned_csv_text = cleaned_df.to_csv(index=False)

    # Save cleaned file cache if possible
    cleaned_filename = f"cleaned_{rec.filename}"
    cleaned_path = UPLOAD_DIR / cleaned_filename
    try:
        cleaned_df.to_csv(cleaned_path, index=False)
        rec.cleaned_file_path = str(cleaned_path)
    except Exception:
        rec.cleaned_file_path = None

    rec.cleaned_data_content = cleaned_csv_text
    rec.is_cleaned = True
    rec.cleaning_report_json = json.dumps(report)

    # Regenerate profile for cleaned dataset
    new_profile = profile_dataset(
        df=cleaned_df,
        dataset_id=rec.id,
        original_name=f"[Cleaned] {rec.original_name}",
        file_type="csv",
        file_size_bytes=len(cleaned_csv_text.encode('utf-8')),
        is_official=rec.is_official_sample
    )
    new_profile["is_cleaned"] = True
    rec.quality_score = new_profile["quality_score"]
    rec.profile_json = json.dumps(new_profile)
    db.commit()

    return {
        "report": report,
        "updated_profile": new_profile
    }

@app.get("/api/officer/audit-summary/{dataset_id}")
def get_officer_audit_summary(
    dataset_id: int,
    current_officer: User = Depends(get_current_officer),
    db: Session = Depends(get_db)
):
    """
    Officer-exclusive administrative endpoint providing system audit logs,
    quality score breakdown penalties, and dataset processing history.
    """
    rec = db.query(DatasetRecord).filter(DatasetRecord.id == dataset_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    return {
        "dataset_id": rec.id,
        "verified_by_officer": current_officer.username,
        "officer_role": current_officer.role,
        "quality_score": rec.quality_score,
        "is_cleaned": rec.is_cleaned,
        "is_persisted_in_db": bool(rec.raw_data_content or rec.cleaned_data_content),
        "cleaning_report": json.loads(rec.cleaning_report_json) if rec.cleaning_report_json else None,
        "profile": json.loads(rec.profile_json) if rec.profile_json else None
    }


# ---------------- ANALYTICS & VISUALIZATION ENDPOINTS ----------------

def get_active_df(rec: DatasetRecord) -> Tuple[pd.DataFrame, Dict[str, str]]:
    """
    Retrieves the active dataframe with multi-tier fallback:
    1. Cleaned data from DB
    2. Cleaned file from disk
    3. Raw data from DB
    4. Raw file from disk
    5. Official sample file
    """
    df = None

    if rec.is_cleaned and rec.cleaned_data_content:
        df = pd.read_csv(io.StringIO(rec.cleaned_data_content))
    elif rec.is_cleaned and rec.cleaned_file_path and Path(rec.cleaned_file_path).exists():
        df = load_dataset_file(Path(rec.cleaned_file_path))
    elif rec.raw_data_content:
        df = pd.read_csv(io.StringIO(rec.raw_data_content))
    elif rec.raw_file_path and Path(rec.raw_file_path).exists():
        df = load_dataset_file(Path(rec.raw_file_path))
    elif rec.is_official_sample and SAMPLE_CSV_PATH.exists():
        df = load_dataset_file(SAMPLE_CSV_PATH)
    else:
        raise HTTPException(
            status_code=404,
            detail="Dataset records could not be loaded. Please re-upload or select another dataset."
        )

    col_mappings = {}
    if rec.profile_json:
        try:
            prof = json.loads(rec.profile_json)
            col_mappings = {c["name"]: c["detected_variable"] for c in prof.get("columns", []) if c.get("detected_variable")}
        except Exception:
            pass

    return df, col_mappings

@app.get("/api/datasets/{dataset_id}/eda", response_model=EDAResponse)
def get_eda(dataset_id: int, db: Session = Depends(get_db)):
    rec = db.query(DatasetRecord).filter(DatasetRecord.id == dataset_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Dataset not found")
    df, col_mappings = get_active_df(rec)
    return compute_eda(df, col_mappings)

@app.get("/api/datasets/{dataset_id}/correlations", response_model=CorrelationResponse)
def get_correlations(dataset_id: int, db: Session = Depends(get_db)):
    rec = db.query(DatasetRecord).filter(DatasetRecord.id == dataset_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Dataset not found")
    df, _ = get_active_df(rec)
    return compute_correlation_matrix(df)

@app.get("/api/datasets/{dataset_id}/rainfall-yield", response_model=RainfallYieldResponse)
def get_rainfall_yield(dataset_id: int, db: Session = Depends(get_db)):
    rec = db.query(DatasetRecord).filter(DatasetRecord.id == dataset_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Dataset not found")
    df, col_mappings = get_active_df(rec)
    return analyze_rainfall_vs_crop_yield(df, col_mappings)

@app.get("/api/datasets/{dataset_id}/state-analysis", response_model=StateAnalysisResponse)
def get_state_analysis(dataset_id: int, db: Session = Depends(get_db)):
    rec = db.query(DatasetRecord).filter(DatasetRecord.id == dataset_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Dataset not found")
    df, col_mappings = get_active_df(rec)
    return analyze_states(df, col_mappings)

@app.get("/api/datasets/{dataset_id}/visualizations")
def get_visualizations(dataset_id: int, db: Session = Depends(get_db)):
    rec = db.query(DatasetRecord).filter(DatasetRecord.id == dataset_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Dataset not found")
    df, col_mappings = get_active_df(rec)
    return generate_automatic_visualizations(df, col_mappings)

@app.get("/api/datasets/{dataset_id}/insights", response_model=InsightsResponse)
def get_insights(dataset_id: int, db: Session = Depends(get_db)):
    rec = db.query(DatasetRecord).filter(DatasetRecord.id == dataset_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Dataset not found")
    df, col_mappings = get_active_df(rec)
    insights = generate_agricultural_insights(
        df=df,
        col_mappings=col_mappings,
        quality_score=rec.quality_score,
        dataset_name=rec.original_name
    )
    return {
        "dataset_name": rec.original_name,
        "insights": insights
    }

@app.get("/api/datasets/{dataset_id}/summary")
def get_complete_summary(dataset_id: int, db: Session = Depends(get_db)):
    """Full comprehensive report payload for printable/PDF analysis summary."""
    rec = db.query(DatasetRecord).filter(DatasetRecord.id == dataset_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Dataset not found")
    df, col_mappings = get_active_df(rec)

    eda = compute_eda(df, col_mappings)
    rf_yield = analyze_rainfall_vs_crop_yield(df, col_mappings)
    states = analyze_states(df, col_mappings)
    viz = generate_automatic_visualizations(df, col_mappings)
    insights = generate_agricultural_insights(df, col_mappings, rec.quality_score, rec.original_name)

    cleaning_report = json.loads(rec.cleaning_report_json) if rec.cleaning_report_json else None

    return {
        "dataset_info": {
            "id": rec.id,
            "name": rec.original_name,
            "file_type": rec.file_type,
            "row_count": len(df),
            "col_count": len(df.columns),
            "is_official": rec.is_official_sample,
            "is_cleaned": rec.is_cleaned,
            "quality_score": rec.quality_score,
            "uploaded_at": rec.uploaded_at.isoformat()
        },
        "cleaning_report": cleaning_report,
        "eda": eda,
        "rainfall_yield": rf_yield,
        "state_analysis": states,
        "visualizations": viz,
        "insights": insights,
        "data_source_metadata": OFFICIAL_SOURCE_METADATA if rec.is_official_sample else None
    }


# ---------------- DATA SOURCES & VERIFICATION ENDPOINTS ----------------

@app.get("/api/data-sources", response_model=List[DataSourceInfo])
def get_trusted_data_sources():
    sources = [
        OFFICIAL_SOURCE_METADATA,
        {
            "dataset_name": "Open Government Data (OGD) Platform India",
            "source_organization": "National Informatics Centre (NIC), Ministry of Electronics & IT, Govt. of India",
            "source_url": "https://data.gov.in",
            "publication": "Ministry of Agriculture & Farmers Welfare Datasets",
            "coverage_years": "2010 to Present",
            "variables": ["State", "District", "Crop", "Season", "Area", "Production", "Yield"],
            "description": "Government of India central data repository providing machine-readable datasets published by various ministries under the NDSAP policy.",
            "verification_status": "Official Govt Portal",
            "download_available": False
        },
        {
            "dataset_name": "ICAR Agricultural Research Repository",
            "source_organization": "Indian Council of Agricultural Research (ICAR)",
            "source_url": "https://icar.org.in",
            "publication": "All India Coordinated Research Project Reports",
            "coverage_years": "Annual Observational Data",
            "variables": ["Crop Varieties", "Soil NPK", "Agro-Climatic Zones", "Fertilizer Trials"],
            "description": "Apex body for coordinating, guiding and managing agricultural research and education in India.",
            "verification_status": "National Apex Research Body",
            "download_available": False
        },
        {
            "dataset_name": "IMD Pune Agro-Meteorological Database",
            "source_organization": "India Meteorological Department (IMD), Ministry of Earth Sciences",
            "source_url": "https://dsp.imdpune.gov.in",
            "publication": "National Data Centre Climate Bulletins",
            "coverage_years": "1901 to Present",
            "variables": ["Rainfall (mm)", "Minimum Temp", "Maximum Temp", "Humidity (%)", "Solar Radiation"],
            "description": "Comprehensive meteorological and precipitation records collected across nationwide observatories and automatic weather stations.",
            "verification_status": "Official National Meteorological Agency",
            "download_available": False
        }
    ]
    return sources

@app.get("/api/download/sample-csv")
def download_sample_csv():
    save_official_sample_if_needed()
    if not SAMPLE_CSV_PATH.exists():
        raise HTTPException(status_code=404, detail="Sample dataset file not found.")
    return FileResponse(
        path=SAMPLE_CSV_PATH,
        filename="All_India_Agriculture_Official_Sample_DES_IMD.csv",
        media_type="text/csv"
    )
