import os
import re
import json
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Any, Tuple, Optional
from .config import UPLOAD_DIR

AGRICULTURAL_VARIABLE_PATTERNS = {
    "yield": [
        r".*yield.*", r".*productivity.*", r"^yield(_kg_per_ha)?$", r"^crop_yield(_kg_per_ha)?$",
        r"^yield_per_hectare$", r"^yield_kg_ha$"
    ],
    "production": [
        r".*production.*", r".*output.*", r"^prod(uction)?(_tonnes)?$",
        r"^crop_production(_tonnes)?$", r"^total_production(_tonnes)?$"
    ],
    "area": [
        r".*cultivated_area.*", r".*sown_area.*", r".*cropped_area.*",
        r"^area(_ha)?$", r"^cultivated_area(_ha)?$", r"^agricultural_area(_ha)?$",
        r"^area_hectares$"
    ],
    "rainfall": [
        r".*rainfall.*", r".*precipitation.*", r"^rain(fall)?(_mm)?$",
        r"^annual_rainfall(_mm)?$", r"^monsoon_rainfall(_mm)?$", r"^rf_mm$"
    ],
    "temperature": [
        r".*temp(erature)?.*", r"^temp(erature)?(_c)?$", r"^avg_temp(erature)?(_c)?$",
        r"^mean_temp(_c)?$", r"^max_temp(_c)?$", r"^min_temp(_c)?$"
    ],
    "fertilizer": [
        r".*fertilizer.*", r".*npk.*", r"^fertilizer(_usage|_consumption)?(_kg_per_ha)?$"
    ],
    "soil": [
        r".*soil.*", r"^soil(_type)?$", r"^soil_ph$", r"^ph$", r"^nitrogen$", r"^phosphorus$", r"^potassium$"
    ],
    "district": [
        r".*district.*", r"^district(_name)?$", r"^dist$", r"^district_code$"
    ],
    "state": [
        r".*state.*", r"^state(_name)?$", r"^state_ut$", r"^province$", r"^state_code$"
    ],
    "season": [
        r".*season.*", r"^season(_name)?$", r"^crop_season$"
    ],
    "year": [
        r".*year.*", r"^year$", r"^crop_year$", r"^agri_year$", r"^financial_year$"
    ],
    "crop": [
        r"^crop(_name)?$", r"^crop_type$", r"^crop_item$", r"^commodity$", r"^crops$",
        r"^crop$"
    ]
}

FRIENDLY_VAR_NAMES = {
    "rainfall": "Rainfall (mm)",
    "temperature": "Temperature (°C)",
    "crop": "Crop Name",
    "production": "Crop Production (Tonnes)",
    "yield": "Crop Yield (kg/ha)",
    "area": "Cultivated Area (Hectares)",
    "fertilizer": "Fertilizer Usage",
    "soil": "Soil Characteristics",
    "state": "State / Province",
    "district": "District",
    "season": "Agri Season",
    "year": "Crop Year"
}

def load_dataset_file(file_path: Path) -> pd.DataFrame:
    """Reads CSV, Excel, or JSON safely with encoding fallbacks."""
    suffix = file_path.suffix.lower()
    if suffix == ".csv":
        try:
            return pd.read_csv(file_path, encoding="utf-8")
        except UnicodeDecodeError:
            try:
                return pd.read_csv(file_path, encoding="latin1")
            except Exception:
                return pd.read_csv(file_path, encoding="iso-8859-1")
    elif suffix in [".xlsx", ".xls"]:
        return pd.read_excel(file_path)
    elif suffix == ".json":
        return pd.read_json(file_path)
    else:
        raise ValueError(f"Unsupported file format: {suffix}")

def detect_column_semantic_type(col_name: str, series: pd.Series) -> Tuple[str, Optional[str], Optional[str]]:
    """
    Detects if a column is numerical, categorical, datetime, or geographic,
    and identifies agricultural variables using alias dictionaries.
    Returns (semantic_type, detected_variable, detection_label).
    """
    clean_name = str(col_name).strip().lower()
    normalized_name = re.sub(r'[^a-z0-9_]', '_', clean_name).strip('_')

    detected_var = None
    # Check agricultural variable mappings
    for var_key, patterns in AGRICULTURAL_VARIABLE_PATTERNS.items():
        for pat in patterns:
            if re.match(pat, normalized_name, re.IGNORECASE):
                detected_var = var_key
                break
        if detected_var:
            break

    # Determine general data type
    is_numeric = pd.api.types.is_numeric_dtype(series)
    is_datetime = pd.api.types.is_datetime64_any_dtype(series)

    if is_datetime or (detected_var == "year" and not is_numeric):
        semantic_type = "datetime"
    elif detected_var in ["state", "district"]:
        semantic_type = "geographic"
    elif is_numeric:
        semantic_type = "numerical"
    else:
        semantic_type = "categorical"

    detection_label = f"Detected as {FRIENDLY_VAR_NAMES.get(detected_var, detected_var.title())}" if detected_var else None

    return semantic_type, detected_var, detection_label

def detect_invalid_records(df: pd.DataFrame, col_mappings: Dict[str, str]) -> List[Dict[str, Any]]:
    """
    Detects obvious invalid or suspicious agricultural records:
    - Negative rainfall
    - Negative or zero cultivated area
    - Negative crop production
    - Extreme temperatures (< -10°C or > 60°C for India)
    """
    invalid_items = []
    
    # Invert mapping to find columns by variable
    var_to_col = {v: k for k, v in col_mappings.items()}

    if "rainfall" in var_to_col:
        rain_col = var_to_col["rainfall"]
        if pd.api.types.is_numeric_dtype(df[rain_col]):
            bad_mask = df[rain_col] < 0
            count = int(bad_mask.sum())
            if count > 0:
                invalid_items.append({
                    "column": rain_col,
                    "variable": "rainfall",
                    "issue": f"{count} record(s) contain negative rainfall (< 0 mm)",
                    "severity": "high",
                    "rows_affected": count
                })

    if "production" in var_to_col:
        prod_col = var_to_col["production"]
        if pd.api.types.is_numeric_dtype(df[prod_col]):
            bad_mask = df[prod_col] < 0
            count = int(bad_mask.sum())
            if count > 0:
                invalid_items.append({
                    "column": prod_col,
                    "variable": "production",
                    "issue": f"{count} record(s) contain negative crop production",
                    "severity": "high",
                    "rows_affected": count
                })

    if "area" in var_to_col:
        area_col = var_to_col["area"]
        if pd.api.types.is_numeric_dtype(df[area_col]):
            bad_mask = df[area_col] <= 0
            count = int(bad_mask.sum())
            if count > 0:
                invalid_items.append({
                    "column": area_col,
                    "variable": "area",
                    "issue": f"{count} record(s) have non-positive cultivated area (<= 0 ha)",
                    "severity": "medium",
                    "rows_affected": count
                })

    if "temperature" in var_to_col:
        temp_col = var_to_col["temperature"]
        if pd.api.types.is_numeric_dtype(df[temp_col]):
            bad_mask = (df[temp_col] < -10) | (df[temp_col] > 60)
            count = int(bad_mask.sum())
            if count > 0:
                invalid_items.append({
                    "column": temp_col,
                    "variable": "temperature",
                    "issue": f"{count} record(s) have implausible temperatures (< -10°C or > 60°C)",
                    "severity": "high",
                    "rows_affected": count
                })

    return invalid_items

def calculate_data_quality_score(
    row_count: int,
    col_count: int,
    missing_cells_pct: float,
    duplicate_rows_count: int,
    invalid_records_count: int,
    identified_agri_vars_count: int
) -> Tuple[float, Dict[str, Any]]:
    """
    Calculates a transparent, mathematically grounded Data Quality Score (0-100%).
    Formula:
    Base = 100
    - Missingness penalty (up to 35 points): missing_cells_pct * 0.7
    - Duplicate penalty (up to 20 points): min(20, (duplicate_rows / row_count) * 100 * 2)
    - Invalid values penalty (up to 25 points): min(25, invalid_records_count * 5)
    - Agri context completeness bonus/penalty (up to 20 points): scaled by detected agri variables
    """
    if row_count == 0 or col_count == 0:
        return 0.0, {"reason": "Dataset is empty"}

    missing_penalty = min(35.0, missing_cells_pct * 0.7)
    
    dup_ratio = (duplicate_rows_count / row_count) * 100.0 if row_count > 0 else 0
    duplicate_penalty = min(20.0, dup_ratio * 2.0)
    
    invalid_penalty = min(25.0, invalid_records_count * 5.0)

    # Agri context score (20 points max): having key columns like Crop, State, Production/Yield
    completeness_score = min(20.0, identified_agri_vars_count * 4.0)
    agri_context_penalty = 20.0 - completeness_score

    score = 100.0 - (missing_penalty + duplicate_penalty + invalid_penalty + (agri_context_penalty * 0.5))
    score = max(5.0, min(100.0, round(score, 1)))

    breakdown = {
        "score": score,
        "completeness_score": round(100 - missing_penalty, 1),
        "uniqueness_score": round(100 - duplicate_penalty, 1),
        "validity_score": round(100 - invalid_penalty, 1),
        "agri_relevance_score": round((identified_agri_vars_count / max(1, 5)) * 100, 1),
        "penalties": {
            "missing_penalty": round(missing_penalty, 1),
            "duplicate_penalty": round(duplicate_penalty, 1),
            "invalid_penalty": round(invalid_penalty, 1),
        },
        "explanation": (
            f"Quality evaluated at {score}%. "
            f"Missing cells ({round(missing_cells_pct, 2)}%), "
            f"Duplicate records ({duplicate_rows_count}), "
            f"Invalid records ({invalid_records_count}), "
            f"Identified agricultural variables: {identified_agri_vars_count}."
        )
    }
    return score, breakdown

def profile_dataset(df: pd.DataFrame, dataset_id: int, original_name: str, file_type: str, file_size_bytes: int, is_official: bool) -> Dict[str, Any]:
    """Generates a complete dataset inspection profile."""
    row_count = len(df)
    col_count = len(df.columns)

    columns_profile = []
    col_mappings = {}
    agri_vars_count = 0

    for col in df.columns:
        series = df[col]
        missing_cnt = int(series.isna().sum())
        missing_pct = round((missing_cnt / row_count) * 100.0, 2) if row_count > 0 else 0.0
        unique_cnt = int(series.nunique(dropna=True))

        semantic_type, detected_var, detection_label = detect_column_semantic_type(str(col), series)
        if detected_var:
            col_mappings[str(col)] = detected_var
            agri_vars_count += 1

        # Non-null sample values for preview
        non_nulls = series.dropna().tolist()
        sample_vals = [val if not isinstance(val, (np.integer, np.floating)) else float(val) for val in non_nulls[:4]]

        min_val = None
        max_val = None
        if pd.api.types.is_numeric_dtype(series) and not series.dropna().empty:
            min_val = float(series.min())
            max_val = float(series.max())

        columns_profile.append({
            "name": str(col),
            "data_type": str(series.dtype),
            "semantic_type": semantic_type,
            "detected_variable": detected_var,
            "detection_label": detection_label,
            "missing_count": missing_cnt,
            "missing_percentage": missing_pct,
            "unique_count": unique_cnt,
            "sample_values": sample_vals,
            "min_val": min_val,
            "max_val": max_val
        })

    duplicate_rows_count = int(df.duplicated().sum())
    total_cells = row_count * col_count if row_count > 0 and col_count > 0 else 1
    missing_cells_total = int(df.isna().sum().sum())
    missing_cells_pct = round((missing_cells_total / total_cells) * 100.0, 2)

    invalid_details = detect_invalid_records(df, col_mappings)
    invalid_records_count = sum(item["rows_affected"] for item in invalid_details)

    quality_score, quality_breakdown = calculate_data_quality_score(
        row_count=row_count,
        col_count=col_count,
        missing_cells_pct=missing_cells_pct,
        duplicate_rows_count=duplicate_rows_count,
        invalid_records_count=invalid_records_count,
        identified_agri_vars_count=agri_vars_count
    )

    # Safe JSON-serializable preview of top 20 rows
    preview_df = df.head(20).replace({np.nan: None})
    preview_rows = preview_df.to_dict(orient="records")

    return {
        "id": dataset_id,
        "original_name": original_name,
        "file_type": file_type,
        "file_size_bytes": file_size_bytes,
        "row_count": row_count,
        "col_count": col_count,
        "is_official_sample": is_official,
        "is_cleaned": False,
        "quality_score": quality_score,
        "quality_breakdown": quality_breakdown,
        "columns": columns_profile,
        "preview_rows": preview_rows,
        "duplicate_rows_count": duplicate_rows_count,
        "missing_cells_total": missing_cells_total,
        "missing_cells_percentage": missing_cells_pct,
        "invalid_records_count": invalid_records_count,
        "invalid_details": invalid_details
    }

def clean_and_preprocess_dataset(
    df: pd.DataFrame,
    col_mappings: Dict[str, str],
    remove_duplicates: bool = True,
    impute_numerical: str = "median",
    impute_categorical: str = "mode",
    standardize_column_names: bool = False
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Executes actual data preprocessing:
    1. Duplicates handling (drop exact duplicates if requested)
    2. Missing values imputation (numerical: median/mean; categorical: mode/Unknown)
    3. Records every operation applied and generates Before vs After report
    Never alters original file.
    """
    before_rows = len(df)
    before_cols = len(df.columns)
    before_missing = int(df.isna().sum().sum())

    cleaned_df = df.copy()
    operations_applied = []

    # 1. Duplicate Handling
    duplicates_removed = 0
    if remove_duplicates:
        initial_count = len(cleaned_df)
        cleaned_df = cleaned_df.drop_duplicates()
        duplicates_removed = initial_count - len(cleaned_df)
        if duplicates_removed > 0:
            operations_applied.append(f"Removed {duplicates_removed} duplicate row(s)")
        else:
            operations_applied.append("Checked for duplicate records (0 found)")

    # 2. Missing Value Imputation
    for col in cleaned_df.columns:
        missing_cnt = cleaned_df[col].isna().sum()
        if missing_cnt == 0:
            continue

        if pd.api.types.is_numeric_dtype(cleaned_df[col]):
            if impute_numerical == "median":
                med_val = cleaned_df[col].median()
                cleaned_df[col] = cleaned_df[col].fillna(med_val)
                var_hint = col_mappings.get(col, col)
                operations_applied.append(f"Imputed {missing_cnt} missing value(s) in '{col}' ({var_hint}) using median ({round(med_val, 2)})")
            elif impute_numerical == "mean":
                mean_val = cleaned_df[col].mean()
                cleaned_df[col] = cleaned_df[col].fillna(mean_val)
                operations_applied.append(f"Imputed {missing_cnt} missing value(s) in '{col}' using mean ({round(mean_val, 2)})")
            elif impute_numerical == "drop":
                cleaned_df = cleaned_df.dropna(subset=[col])
                operations_applied.append(f"Dropped {missing_cnt} row(s) with missing values in '{col}'")
        else:
            if impute_categorical == "mode":
                mode_series = cleaned_df[col].mode()
                mode_val = mode_series.iloc[0] if not mode_series.empty else "Unknown"
                cleaned_df[col] = cleaned_df[col].fillna(mode_val)
                operations_applied.append(f"Imputed {missing_cnt} missing value(s) in categorical column '{col}' using mode ('{mode_val}')")
            elif impute_categorical == "unknown":
                cleaned_df[col] = cleaned_df[col].fillna("Unknown")
                operations_applied.append(f"Imputed {missing_cnt} missing value(s) in '{col}' with 'Unknown'")
            elif impute_categorical == "drop":
                cleaned_df = cleaned_df.dropna(subset=[col])
                operations_applied.append(f"Dropped rows with missing values in '{col}'")

    # 3. Optional Column Name Standardization
    name_mapping = {}
    if standardize_column_names:
        for col in cleaned_df.columns:
            std_name = re.sub(r'[^a-zA-Z0-9_]', '_', str(col)).strip('_')
            name_mapping[col] = std_name
        cleaned_df = cleaned_df.rename(columns=name_mapping)
        operations_applied.append("Standardized column names to snake_case format")
    else:
        name_mapping = {col: col for col in cleaned_df.columns}

    after_rows = len(cleaned_df)
    after_cols = len(cleaned_df.columns)
    after_missing = int(cleaned_df.isna().sum().sum())

    report = {
        "before_rows": before_rows,
        "after_rows": after_rows,
        "before_cols": before_cols,
        "after_cols": after_cols,
        "before_missing": before_missing,
        "after_missing": after_missing,
        "duplicates_removed": duplicates_removed,
        "operations_applied": operations_applied,
        "column_mappings": col_mappings
    }

    return cleaned_df, report
