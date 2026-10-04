from typing import List, Dict, Any, Optional
from pydantic import BaseModel

# Auth Schemas
class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    role: str = "farmer"  # 'farmer' or 'officer'

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Dataset Schemas
class ColumnProfile(BaseModel):
    name: str
    data_type: str
    semantic_type: str  # 'numerical', 'categorical', 'datetime', 'geographic'
    detected_variable: Optional[str] = None  # 'rainfall', 'temperature', 'crop', 'yield', etc.
    detection_label: Optional[str] = None
    missing_count: int
    missing_percentage: float
    unique_count: int
    sample_values: List[Any]
    min_val: Optional[Any] = None
    max_val: Optional[Any] = None

class DatasetProfile(BaseModel):
    id: int
    original_name: str
    file_type: str
    file_size_bytes: int
    row_count: int
    col_count: int
    is_official_sample: bool
    is_cleaned: bool
    quality_score: float
    quality_breakdown: Dict[str, Any]
    columns: List[ColumnProfile]
    preview_rows: List[Dict[str, Any]]
    duplicate_rows_count: int
    missing_cells_total: int
    missing_cells_percentage: float
    invalid_records_count: int
    invalid_details: List[Dict[str, Any]]

class CleaningOptions(BaseModel):
    remove_duplicates: bool = True
    impute_numerical: str = "median"  # 'median', 'mean', 'drop', 'none'
    impute_categorical: str = "mode"  # 'mode', 'unknown', 'drop', 'none'
    standardize_column_names: bool = True

class CleaningReport(BaseModel):
    before_rows: int
    after_rows: int
    before_cols: int
    after_cols: int
    before_missing: int
    after_missing: int
    duplicates_removed: int
    operations_applied: List[str]
    column_mappings: Dict[str, str]

class EDAResponse(BaseModel):
    numerical_stats: Dict[str, Dict[str, Any]]
    categorical_stats: Dict[str, Dict[str, Any]]
    distributions: Dict[str, List[Dict[str, Any]]]

class CorrelationResponse(BaseModel):
    columns: List[str]
    matrix: List[List[float]]
    strongest_correlations: List[Dict[str, Any]]

class RainfallYieldResponse(BaseModel):
    available: bool
    reason: Optional[str] = None
    rainfall_column: Optional[str] = None
    yield_column: Optional[str] = None
    is_derived_yield: bool = False
    derivation_formula: Optional[str] = None
    correlation_coefficient: Optional[float] = None
    relationship_strength: Optional[str] = None
    statistical_interpretation: Optional[str] = None
    scatter_data: List[Dict[str, Any]] = []
    regression_line: Optional[Dict[str, Any]] = None
    summary_stats: Optional[Dict[str, Any]] = None

class StateAnalysisResponse(BaseModel):
    available: bool
    reason: Optional[str] = None
    state_column: Optional[str] = None
    states: List[str] = []
    crops: List[str] = []
    years: List[Any] = []
    top_producing_states: List[Dict[str, Any]] = []
    lowest_producing_states: List[Dict[str, Any]] = []
    state_summaries: List[Dict[str, Any]] = []

class GeoVisualizationResponse(BaseModel):
    available: bool
    reason: Optional[str] = None
    state_column: Optional[str] = None
    available_metrics: List[str] = []
    state_data: Dict[str, Dict[str, Any]] = {}

class InsightItem(BaseModel):
    id: str
    category: str  # 'production', 'rainfall', 'correlation', 'quality', 'geography', 'season'
    title: str
    title_mr: str
    description: str
    description_mr: str
    metric_label: str
    metric_value: str
    importance: str  # 'high', 'medium', 'info'

class InsightsResponse(BaseModel):
    dataset_name: str
    insights: List[InsightItem]

class DataSourceInfo(BaseModel):
    dataset_name: str
    source_organization: str
    source_url: str
    publication: str
    coverage_years: str
    variables: List[str]
    description: str
    verification_status: str
    download_available: bool
