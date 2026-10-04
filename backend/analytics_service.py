import json
import numpy as np
import pandas as pd
from scipy import stats
from typing import Dict, List, Any, Optional, Tuple
from .india_geojson import normalize_state_name, STATE_COORDINATES

def compute_eda(df: pd.DataFrame, col_mappings: Dict[str, str]) -> Dict[str, Any]:
    """Generates comprehensive Exploratory Data Analysis (EDA)."""
    numerical_stats = {}
    categorical_stats = {}
    distributions = {}

    for col in df.columns:
        series = df[col]
        col_str = str(col)
        var_role = col_mappings.get(col_str)

        if pd.api.types.is_numeric_dtype(series):
            clean_s = series.dropna()
            if len(clean_s) == 0:
                continue

            q25 = float(clean_s.quantile(0.25))
            q50 = float(clean_s.median())
            q75 = float(clean_s.quantile(0.75))
            iqr = q75 - q25
            lower_bound = q25 - 1.5 * iqr
            upper_bound = q75 + 1.5 * iqr
            outlier_count = int(((clean_s < lower_bound) | (clean_s > upper_bound)).sum())

            # Distribution histogram (8 bins)
            hist_counts, bin_edges = np.histogram(clean_s, bins=8)
            bin_data = []
            for i in range(len(hist_counts)):
                label = f"{round(bin_edges[i], 1)} - {round(bin_edges[i+1], 1)}"
                bin_data.append({
                    "range": label,
                    "count": int(hist_counts[i]),
                    "min": float(bin_edges[i]),
                    "max": float(bin_edges[i+1])
                })
            distributions[col_str] = bin_data

            numerical_stats[col_str] = {
                "count": int(len(clean_s)),
                "mean": round(float(clean_s.mean()), 2),
                "std": round(float(clean_s.std()), 2) if len(clean_s) > 1 else 0.0,
                "min": round(float(clean_s.min()), 2),
                "q25": round(q25, 2),
                "median": round(q50, 2),
                "q75": round(q75, 2),
                "max": round(float(clean_s.max()), 2),
                "skewness": round(float(clean_s.skew()), 2) if len(clean_s) > 2 else 0.0,
                "outlier_count": outlier_count,
                "variable_role": var_role
            }
        else:
            clean_s = series.dropna().astype(str)
            top_cats = clean_s.value_counts().head(8).to_dict()
            categorical_stats[col_str] = {
                "unique_count": int(clean_s.nunique()),
                "top_categories": [{"label": k, "count": int(v)} for k, v in top_cats.items()],
                "variable_role": var_role
            }

    return {
        "numerical_stats": numerical_stats,
        "categorical_stats": categorical_stats,
        "distributions": distributions
    }

def compute_correlation_matrix(df: pd.DataFrame) -> Dict[str, Any]:
    """Calculates Pearson correlation matrix for numerical columns."""
    num_df = df.select_dtypes(include=[np.number]).dropna()
    if num_df.empty or len(num_df.columns) < 2:
        return {"columns": [], "matrix": [], "strongest_correlations": []}

    corr_df = num_df.corr().round(2)
    cols = list(corr_df.columns)
    matrix = corr_df.values.tolist()

    strongest = []
    for i in range(len(cols)):
        for j in range(i + 1, len(cols)):
            val = float(matrix[i][j])
            if not np.isnan(val):
                strongest.append({
                    "var1": cols[i],
                    "var2": cols[j],
                    "r": val,
                    "strength": "Strong" if abs(val) >= 0.7 else ("Moderate" if abs(val) >= 0.4 else "Weak")
                })

    strongest.sort(key=lambda x: abs(x["r"]), reverse=True)

    return {
        "columns": cols,
        "matrix": matrix,
        "strongest_correlations": strongest[:6]
    }

def analyze_rainfall_vs_crop_yield(df: pd.DataFrame, col_mappings: Dict[str, str]) -> Dict[str, Any]:
    """
    Dedicated Rainfall vs Crop Yield / Production analytical module.
    Adheres strictly to Rule 3 & Rule 21: Never fabricate data.
    If rainfall or yield is missing, explain clearly.
    Derives Yield = Production / Area only if production & area exist.
    """
    var_to_col = {v: k for k, v in col_mappings.items()}
    rain_col = var_to_col.get("rainfall")
    yield_col = var_to_col.get("yield")
    prod_col = var_to_col.get("production")
    area_col = var_to_col.get("area")
    crop_col = var_to_col.get("crop")
    state_col = var_to_col.get("state")
    year_col = var_to_col.get("year")

    if not rain_col or rain_col not in df.columns or not pd.api.types.is_numeric_dtype(df[rain_col]):
        return {
            "available": False,
            "reason": "Rainfall analysis cannot be generated because the uploaded dataset does not contain a recognizable rainfall variable."
        }

    is_derived_yield = False
    derivation_formula = None
    target_yield_col = yield_col

    # If explicit yield not found, attempt safe derivation if production and area are available
    if (not target_yield_col or target_yield_col not in df.columns) and prod_col and area_col:
        if pd.api.types.is_numeric_dtype(df[prod_col]) and pd.api.types.is_numeric_dtype(df[area_col]):
            temp_df = df.copy()
            # Production in tonnes / Area in hectares -> kg/ha = (Production * 1000) / Area
            temp_df["_derived_yield"] = (temp_df[prod_col] * 1000.0) / temp_df[area_col].replace(0, np.nan)
            target_yield_col = "_derived_yield"
            is_derived_yield = True
            derivation_formula = "Derived Yield (kg/ha) = [Crop Production (tonnes) × 1000] / Cultivated Area (ha)"
        else:
            return {
                "available": False,
                "reason": "Crop yield analysis cannot be generated because crop yield/production information was not found."
            }
    elif not target_yield_col or target_yield_col not in df.columns:
        return {
            "available": False,
            "reason": "Crop yield analysis cannot be generated because crop yield/production information was not found."
        }

    # Filter non-null values for rainfall and target yield
    sub_df = df.copy()
    if is_derived_yield:
        sub_df[target_yield_col] = (sub_df[prod_col] * 1000.0) / sub_df[area_col].replace(0, np.nan)

    clean_subset = sub_df[[rain_col, target_yield_col]].dropna()
    clean_subset = clean_subset[(clean_subset[rain_col] >= 0) & (clean_subset[target_yield_col] >= 0)]

    if len(clean_subset) < 4:
        return {
            "available": False,
            "reason": "Insufficient valid data points (< 4 valid pairs) to conduct statistical rainfall vs yield analysis."
        }

    x = clean_subset[rain_col].values
    y = clean_subset[target_yield_col].values

    # Pearson correlation r and p-value
    r, p_val = stats.pearsonr(x, y)
    r = round(float(r), 3)
    p_val = round(float(p_val), 5)

    # Classify relationship using statistically responsible language
    if r >= 0.7:
        strength = "Strong positive relationship"
        interpretation = f"The dataset indicates a strong positive association (r = {r}) between rainfall and crop yield. Higher rainfall levels are consistently associated with higher productivity in these observations."
    elif r >= 0.4:
        strength = "Moderate positive relationship"
        interpretation = f"The dataset exhibits a moderate positive association (r = {r}) between rainfall and crop yield. Increased precipitation is generally accompanied by higher yields, though other agronomic variables also play a role."
    elif r >= 0.15:
        strength = "Weak positive relationship"
        interpretation = f"A slight positive correlation (r = {r}) is observed. While yield tends marginally higher with rainfall, the relationship is weak and non-decisive."
    elif r > -0.15:
        strength = "No clear linear relationship"
        interpretation = f"The correlation coefficient (r = {r}) indicates no discernible linear association between rainfall and yield in this dataset."
    elif r > -0.4:
        strength = "Weak negative relationship"
        interpretation = f"A slight negative correlation (r = {r}) is present, suggesting higher rainfall in certain areas did not correlate with improved yield for the recorded crops."
    elif r > -0.7:
        strength = "Moderate negative relationship"
        interpretation = f"A moderate negative association (r = {r}) is observed, which may reflect flood/excess precipitation sensitivity for certain staple crops in this dataset."
    else:
        strength = "Strong negative relationship"
        interpretation = f"A strong inverse relationship (r = {r}) is observed between rainfall and yield in this specific dataset."

    # Linear regression trend line: y = m*x + c
    slope, intercept, _, _, _ = stats.linregress(x, y)
    x_min, x_max = float(np.min(x)), float(np.max(x))
    trend_line = {
        "slope": round(float(slope), 4),
        "intercept": round(float(intercept), 2),
        "x_min": x_min,
        "y_at_min": round(float(slope * x_min + intercept), 2),
        "x_max": x_max,
        "y_at_max": round(float(slope * x_max + intercept), 2)
    }

    # Prepare scatter points
    scatter_data = []
    # Take up to 100 representative points if large
    sample_indices = np.linspace(0, len(clean_subset) - 1, min(100, len(clean_subset)), dtype=int)
    for idx in sample_indices:
        row = sub_df.iloc[idx]
        scatter_data.append({
            "rainfall": round(float(row[rain_col]), 1) if pd.notna(row[rain_col]) else None,
            "yield": round(float(row[target_yield_col]), 1) if pd.notna(row[target_yield_col]) else None,
            "crop": str(row[crop_col]) if crop_col and pd.notna(row[crop_col]) else "Crop",
            "state": str(row[state_col]) if state_col and pd.notna(row[state_col]) else "Region",
            "year": int(row[year_col]) if year_col and pd.notna(row[year_col]) and str(row[year_col]).isdigit() else str(row[year_col]) if year_col else ""
        })

    summary_stats = {
        "avg_rainfall": round(float(np.mean(x)), 1),
        "min_rainfall": round(x_min, 1),
        "max_rainfall": round(x_max, 1),
        "avg_yield": round(float(np.mean(y)), 1),
        "min_yield": round(float(np.min(y)), 1),
        "max_yield": round(float(np.max(y)), 1),
        "p_value": p_val
    }

    return {
        "available": True,
        "reason": None,
        "rainfall_column": rain_col,
        "yield_column": target_yield_col if not is_derived_yield else "Derived Yield (kg/ha)",
        "is_derived_yield": is_derived_yield,
        "derivation_formula": derivation_formula,
        "correlation_coefficient": r,
        "relationship_strength": strength,
        "statistical_interpretation": interpretation,
        "scatter_data": scatter_data,
        "regression_line": trend_line,
        "summary_stats": summary_stats
    }

def analyze_states(df: pd.DataFrame, col_mappings: Dict[str, str]) -> Dict[str, Any]:
    """Generates state-level comparison and regional aggregations."""
    var_to_col = {v: k for k, v in col_mappings.items()}
    state_col = var_to_col.get("state")
    prod_col = var_to_col.get("production")
    yield_col = var_to_col.get("yield")
    rain_col = var_to_col.get("rainfall")
    crop_col = var_to_col.get("crop")
    year_col = var_to_col.get("year")

    if not state_col or state_col not in df.columns:
        return {
            "available": False,
            "reason": "Geographical visualization is unavailable because this dataset does not contain recognizable state/district information."
        }

    sub_df = df.copy()
    sub_df["_std_state"] = sub_df[state_col].apply(normalize_state_name)
    sub_df = sub_df.dropna(subset=["_std_state"])

    unique_states = sorted(sub_df["_std_state"].unique().tolist())
    unique_crops = sorted(sub_df[crop_col].dropna().unique().tolist()) if crop_col and crop_col in sub_df.columns else []
    unique_years = sorted(sub_df[year_col].dropna().unique().tolist()) if year_col and year_col in sub_df.columns else []

    state_summaries = []
    for st in unique_states:
        st_data = sub_df[sub_df["_std_state"] == st]
        
        tot_prod = float(st_data[prod_col].sum()) if prod_col and pd.api.types.is_numeric_dtype(st_data[prod_col]) else 0.0
        avg_yield = float(st_data[yield_col].mean()) if yield_col and pd.api.types.is_numeric_dtype(st_data[yield_col]) else 0.0
        avg_rain = float(st_data[rain_col].mean()) if rain_col and pd.api.types.is_numeric_dtype(st_data[rain_col]) else 0.0

        top_crop = "N/A"
        if crop_col and crop_col in st_data.columns:
            mode_crop = st_data[crop_col].mode()
            if not mode_crop.empty:
                top_crop = str(mode_crop.iloc[0])

        coords = STATE_COORDINATES.get(st, {"lat": 22.0, "lng": 78.0, "zone": "India"})

        state_summaries.append({
            "state": st,
            "zone": coords.get("zone", "India"),
            "total_production": round(tot_prod, 1),
            "avg_yield": round(avg_yield, 1),
            "avg_rainfall": round(avg_rain, 1),
            "top_crop": top_crop,
            "records_count": len(st_data)
        })

    # Sort top & lowest producing states
    sorted_by_prod = sorted(state_summaries, key=lambda x: x["total_production"], reverse=True)
    top_producing = sorted_by_prod[:5]
    lowest_producing = sorted_by_prod[-5:] if len(sorted_by_prod) > 5 else []

    return {
        "available": True,
        "reason": None,
        "state_column": state_col,
        "states": unique_states,
        "crops": unique_crops,
        "years": unique_years,
        "top_producing_states": top_producing,
        "lowest_producing_states": lowest_producing,
        "state_summaries": state_summaries
    }

def generate_automatic_visualizations(df: pd.DataFrame, col_mappings: Dict[str, str]) -> Dict[str, Any]:
    """
    Intelligently generates suitable visualizations according to dataset columns.
    Follows Rule 18: Generate a small number of meaningful visualizations that answer questions.
    """
    var_to_col = {v: k for k, v in col_mappings.items()}
    crop_col = var_to_col.get("crop")
    prod_col = var_to_col.get("production")
    yield_col = var_to_col.get("yield")
    year_col = var_to_col.get("year")
    rain_col = var_to_col.get("rainfall")
    state_col = var_to_col.get("state")

    charts = []

    # 1. Categorical Comparison: Crop Production by Crop (Bar Chart)
    if crop_col and prod_col and pd.api.types.is_numeric_dtype(df[prod_col]):
        crop_agg = df.groupby(crop_col)[prod_col].sum().reset_index()
        crop_agg = crop_agg.sort_values(by=prod_col, ascending=False).head(10)
        charts.append({
            "id": "crop_production_bar",
            "type": "bar",
            "title": "Total Production by Crop",
            "title_mr": "पिकानुसार एकूण उत्पादन",
            "question_answered": "Which crops have the highest total production volume in this dataset?",
            "question_answered_mr": "या डेटासेटमध्ये कोणत्या पिकांचे एकूण उत्पादन सर्वाधिक आहे?",
            "x_axis": "Crop",
            "y_axis": "Production (Tonnes)",
            "data": [{"name": str(row[crop_col]), "value": round(float(row[prod_col]), 1)} for _, row in crop_agg.iterrows()],
            "insight": f"Top crop by production volume is '{crop_agg.iloc[0][crop_col]}' with {round(float(crop_agg.iloc[0][prod_col]), 1):,} tonnes."
        })

    # 2. Time Series: Production / Yield Trend over Years (Line Chart)
    if year_col and (prod_col or yield_col):
        metric_col = prod_col if prod_col else yield_col
        metric_name = "Production (Tonnes)" if prod_col else "Yield (kg/ha)"
        try:
            year_agg = df.groupby(year_col)[metric_col].mean().reset_index()
            year_agg = year_agg.sort_values(by=year_col)
            charts.append({
                "id": "yearly_trend_line",
                "type": "line",
                "title": f"Annual Average {metric_name} Trend",
                "title_mr": f"वार्षिक सरासरी { 'उत्पादन' if prod_col else 'उत्पादकता' } कल",
                "question_answered": f"How has average {metric_name.lower()} evolved across recorded years?",
                "question_answered_mr": "नोंदवलेल्या वर्षांमध्ये सरासरी कामगिरी कशी बदलली आहे?",
                "x_axis": "Year",
                "y_axis": metric_name,
                "data": [{"name": str(row[year_col]), "value": round(float(row[metric_col]), 1)} for _, row in year_agg.iterrows()],
                "insight": f"Average {metric_name.lower()} progressed from {round(float(year_agg.iloc[0][metric_col]), 1)} to {round(float(year_agg.iloc[-1][metric_col]), 1)} over the recorded period."
            })
        except Exception:
            pass

    # 3. Composition: Top Crops Production Share (Donut / Pie Chart)
    if crop_col and prod_col and pd.api.types.is_numeric_dtype(df[prod_col]):
        crop_agg = df.groupby(crop_col)[prod_col].sum().reset_index()
        total_p = crop_agg[prod_col].sum()
        if total_p > 0:
            crop_agg["share_pct"] = (crop_agg[prod_col] / total_p) * 100.0
            crop_agg = crop_agg.sort_values(by=prod_col, ascending=False).head(6)
            charts.append({
                "id": "crop_share_donut",
                "type": "pie",
                "title": "Crop Production Share (%)",
                "title_mr": "पिकानिहाय उत्पादन वाटा (%)",
                "question_answered": "What proportion of total production does each major crop represent?",
                "question_answered_mr": "एकूण उत्पादनात प्रत्येक प्रमुख पिकाचा वाटा किती आहे?",
                "data": [{"name": str(row[crop_col]), "value": round(float(row["share_pct"]), 1), "raw_value": round(float(row[prod_col]), 1)} for _, row in crop_agg.iterrows()],
                "insight": f"'{crop_agg.iloc[0][crop_col]}' accounts for approximately {round(float(crop_agg.iloc[0]['share_pct']), 1)}% of total agricultural output."
            })

    # 4. Regional Comparison: State-wise Production (Bar Chart)
    if state_col and prod_col and pd.api.types.is_numeric_dtype(df[prod_col]):
        state_agg = df.groupby(state_col)[prod_col].sum().reset_index()
        state_agg = state_agg.sort_values(by=prod_col, ascending=False).head(8)
        charts.append({
            "id": "state_production_bar",
            "type": "bar",
            "title": "Top Agricultural Producing States",
            "title_mr": "सर्वाधिक कृषी उत्पादन घेणारी राज्ये",
            "question_answered": "Which states generate the highest total agricultural production volume?",
            "question_answered_mr": "कोणत्या राज्यात सर्वाधिक कृषी उत्पादन होते?",
            "x_axis": "State",
            "y_axis": "Production (Tonnes)",
            "data": [{"name": str(row[state_col]), "value": round(float(row[prod_col]), 1)} for _, row in state_agg.iterrows()],
            "insight": f"'{state_agg.iloc[0][state_col]}' leads state-level production with {round(float(state_agg.iloc[0][prod_col]), 1):,} tonnes."
        })

    # 5. Distribution: Rainfall Distribution (Histogram / Bar)
    if rain_col and pd.api.types.is_numeric_dtype(df[rain_col]):
        clean_rain = df[rain_col].dropna()
        if len(clean_rain) > 0:
            hist_counts, bin_edges = np.histogram(clean_rain, bins=7)
            bin_data = []
            for i in range(len(hist_counts)):
                label = f"{int(bin_edges[i])}-{int(bin_edges[i+1])} mm"
                bin_data.append({"name": label, "value": int(hist_counts[i])})
            charts.append({
                "id": "rainfall_distribution_hist",
                "type": "bar",
                "title": "Annual Rainfall Frequency Distribution",
                "title_mr": "वार्षिक पर्जन्यमान वारंवारता वितरण",
                "question_answered": "What is the distribution spread of annual precipitation across recorded stations?",
                "question_answered_mr": "नोंदवलेल्या केंद्रांवर वार्षिक पर्जन्यमानाचा प्रसार कसा आहे?",
                "x_axis": "Rainfall Range (mm)",
                "y_axis": "Frequency (Records)",
                "data": bin_data,
                "insight": f"Mean annual rainfall across observations is {round(float(clean_rain.mean()), 1)} mm."
            })

    return {"charts": charts}

def generate_agricultural_insights(df: pd.DataFrame, col_mappings: Dict[str, str], quality_score: float, dataset_name: str) -> List[Dict[str, Any]]:
    """
    Generates 4-6 concise, statistically grounded insights strictly based on dataset facts.
    Never fabricates causal claims. Bilingual support (EN and MR).
    """
    insights = []
    var_to_col = {v: k for k, v in col_mappings.items()}
    crop_col = var_to_col.get("crop")
    prod_col = var_to_col.get("production")
    yield_col = var_to_col.get("yield")
    rain_col = var_to_col.get("rainfall")
    state_col = var_to_col.get("state")
    area_col = var_to_col.get("area")

    # Insight 1: Highest Producing Crop
    if crop_col and prod_col and pd.api.types.is_numeric_dtype(df[prod_col]):
        crop_totals = df.groupby(crop_col)[prod_col].sum()
        total_p = crop_totals.sum()
        if total_p > 0:
            top_crop = crop_totals.idxmax()
            top_val = crop_totals.max()
            share_pct = round((top_val / total_p) * 100.0, 1)
            insights.append({
                "id": "top_crop_production",
                "category": "production",
                "title": f"Dominant Crop: {top_crop}",
                "title_mr": f"प्रमुख पीक: {top_crop}",
                "description": f"'{top_crop}' is the highest producing crop in this dataset with {top_val:,.0f} tonnes, accounting for approximately {share_pct}% of total recorded production.",
                "description_mr": f"'{top_crop}' हे या डेटासेटमधील सर्वाधिक उत्पादन देणारे पीक असून एकूण नोंदीत उत्पादनाचा {share_pct}% वाटा उचलते.",
                "metric_label": "Production Share",
                "metric_value": f"{share_pct}%",
                "importance": "high"
            })

    # Insight 2: Highest Producing State
    if state_col and prod_col and pd.api.types.is_numeric_dtype(df[prod_col]):
        state_totals = df.groupby(state_col)[prod_col].sum()
        top_state = state_totals.idxmax()
        top_s_val = state_totals.max()
        tot_all = state_totals.sum()
        s_share = round((top_s_val / tot_all) * 100.0, 1) if tot_all > 0 else 0.0
        insights.append({
            "id": "top_state_production",
            "category": "geography",
            "title": f"Top Producing State: {top_state}",
            "title_mr": f"सर्वाधिक उत्पादक राज्य: {top_state}",
            "description": f"'{top_state}' recorded the highest cumulative agricultural output ({top_s_val:,.0f} tonnes), representing {s_share}% of all state contributions.",
            "description_mr": f"'{top_state}' राज्याने सर्वाधिक एकत्रित कृषी उत्पादन ({top_s_val:,.0f} टन) नोंदवले आहे, जे एकूण योगदानाच्या {s_share}% आहे.",
            "metric_label": "State Contribution",
            "metric_value": f"{s_share}%",
            "importance": "high"
        })

    # Insight 3: Rainfall vs Yield Association
    if rain_col and (yield_col or (prod_col and area_col)):
        rf_analysis = analyze_rainfall_vs_crop_yield(df, col_mappings)
        if rf_analysis.get("available") and rf_analysis.get("correlation_coefficient") is not None:
            r = rf_analysis["correlation_coefficient"]
            rel_strength = rf_analysis["relationship_strength"]
            insights.append({
                "id": "rainfall_yield_relation",
                "category": "rainfall",
                "title": f"Agro-Climatic Correlation: {rel_strength}",
                "title_mr": f"हवामान आणि उत्पादकता सहसंबंध: {rel_strength}",
                "description": f"The statistical correlation between annual precipitation and crop yield is r = {r}. {rf_analysis['statistical_interpretation']}",
                "description_mr": f"वार्षिक पर्जन्यमान आणि पीक उत्पादकता यामधील सांख्यिकी सहसंबंध r = {r} आहे. या डेटासेटनुसार पर्जन्यमानाचा उत्पादकतेशी मध्यम स्वरूपाचा संबंध दिसून येतो.",
                "metric_label": "Correlation (r)",
                "metric_value": f"{r}",
                "importance": "high"
            })

    # Insight 4: Average Rainfall Pattern
    if rain_col and pd.api.types.is_numeric_dtype(df[rain_col]):
        clean_rf = df[rain_col].dropna()
        if len(clean_rf) > 0:
            avg_rf = round(float(clean_rf.mean()), 1)
            min_rf = round(float(clean_rf.min()), 1)
            max_rf = round(float(clean_rf.max()), 1)
            insights.append({
                "id": "rainfall_summary",
                "category": "rainfall",
                "title": f"Mean Annual Precipitation: {avg_rf} mm",
                "title_mr": f"सरासरी वार्षिक पर्जन्यमान: {avg_rf} मिमी",
                "description": f"The recorded agro-climatic stations experienced an average annual rainfall of {avg_rf} mm, with values spanning from {min_rf} mm to {max_rf} mm.",
                "description_mr": f"नोंदवलेल्या केंद्रांमध्ये सरासरी वार्षिक पाऊस {avg_rf} मिमी राहिला, ज्याची कक्षा {min_rf} मिमी ते {max_rf} मिमी दरम्यान होती.",
                "metric_label": "Average Rainfall",
                "metric_value": f"{avg_rf} mm",
                "importance": "medium"
            })

    # Insight 5: Data Quality and Integrity
    insights.append({
        "id": "data_quality_metric",
        "category": "quality",
        "title": f"Data Integrity Score: {quality_score}%",
        "title_mr": f"डेटा गुणवत्ता स्कोअर: {quality_score}%",
        "description": f"Dataset verified with {len(df)} records and {len(df.columns)} features. Overall reliability score is {quality_score}% based on completeness, uniqueness, and consistency.",
        "description_mr": f"डेटासेटमध्ये {len(df)} नोंदी आणि {len(df.columns)} वैशिष्ट्ये आहेत. परिपूर्णता आणि अचूकतेनुसार गुणवत्ता स्कोअर {quality_score}% आहे.",
        "metric_label": "Quality Score",
        "metric_value": f"{quality_score}%",
        "importance": "info"
    })

    return insights
