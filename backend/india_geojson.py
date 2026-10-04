"""
India States metadata, aliases and centroid coordinates for mapping and state-level analysis.
"""
from typing import Any, Optional
import pandas as pd

INDIAN_STATE_ALIASES = {
    "andhra pradesh": "Andhra Pradesh", "ap": "Andhra Pradesh",
    "arunachal pradesh": "Arunachal Pradesh", "ar": "Arunachal Pradesh",
    "assam": "Assam", "as": "Assam",
    "bihar": "Bihar", "br": "Bihar",
    "chhattisgarh": "Chhattisgarh", "cg": "Chhattisgarh",
    "goa": "Goa", "ga": "Goa",
    "gujarat": "Gujarat", "gj": "Gujarat",
    "haryana": "Haryana", "hr": "Haryana",
    "himachal pradesh": "Himachal Pradesh", "hp": "Himachal Pradesh",
    "jharkhand": "Jharkhand", "jh": "Jharkhand",
    "karnataka": "Karnataka", "ka": "Karnataka",
    "kerala": "Kerala", "kl": "Kerala",
    "madhya pradesh": "Madhya Pradesh", "mp": "Madhya Pradesh",
    "maharashtra": "Maharashtra", "mh": "Maharashtra",
    "manipur": "Manipur", "mn": "Manipur",
    "meghalaya": "Meghalaya", "ml": "Meghalaya",
    "mizoram": "Mizoram", "mz": "Mizoram",
    "nagaland": "Nagaland", "nl": "Nagaland",
    "odisha": "Odisha", "orissa": "Odisha", "od": "Odisha", "or": "Odisha",
    "punjab": "Punjab", "pb": "Punjab",
    "rajasthan": "Rajasthan", "rj": "Rajasthan",
    "sikkim": "Sikkim", "sk": "Sikkim",
    "tamil nadu": "Tamil Nadu", "tamilnadu": "Tamil Nadu", "tn": "Tamil Nadu",
    "telangana": "Telangana", "ts": "Telangana", "tg": "Telangana",
    "tripura": "Tripura", "tr": "Tripura",
    "uttar pradesh": "Uttar Pradesh", "up": "Uttar Pradesh",
    "uttarakhand": "Uttarakhand", "uk": "Uttarakhand", "ua": "Uttarakhand",
    "west bengal": "West Bengal", "wb": "West Bengal",
    "jammu and kashmir": "Jammu & Kashmir", "j&k": "Jammu & Kashmir", "jk": "Jammu & Kashmir",
    "ladakh": "Ladakh",
    "delhi": "Delhi", "nct of delhi": "Delhi", "dl": "Delhi"
}

STATE_COORDINATES = {
    "Maharashtra": {"lat": 19.7515, "lng": 75.7139, "zone": "Western"},
    "Punjab": {"lat": 31.1471, "lng": 75.3412, "zone": "Northern"},
    "Uttar Pradesh": {"lat": 26.8467, "lng": 80.9462, "zone": "Northern"},
    "Madhya Pradesh": {"lat": 22.9734, "lng": 78.6569, "zone": "Central"},
    "Gujarat": {"lat": 22.2587, "lng": 71.1924, "zone": "Western"},
    "West Bengal": {"lat": 22.9868, "lng": 87.8550, "zone": "Eastern"},
    "Karnataka": {"lat": 15.3173, "lng": 75.7139, "zone": "Southern"},
    "Andhra Pradesh": {"lat": 15.9129, "lng": 79.7400, "zone": "Southern"},
    "Tamil Nadu": {"lat": 11.1271, "lng": 78.6569, "zone": "Southern"},
    "Rajasthan": {"lat": 27.0238, "lng": 74.2179, "zone": "Northern"},
    "Haryana": {"lat": 29.0588, "lng": 76.0856, "zone": "Northern"},
    "Bihar": {"lat": 25.0961, "lng": 85.3131, "zone": "Eastern"},
    "Odisha": {"lat": 20.9517, "lng": 85.0985, "zone": "Eastern"},
    "Kerala": {"lat": 10.8505, "lng": 76.2711, "zone": "Southern"},
    "Telangana": {"lat": 18.1124, "lng": 79.0193, "zone": "Southern"},
    "Chhattisgarh": {"lat": 21.2787, "lng": 81.8661, "zone": "Central"},
    "Assam": {"lat": 26.2006, "lng": 92.9376, "zone": "North-Eastern"},
    "Jharkhand": {"lat": 23.6102, "lng": 85.2799, "zone": "Eastern"},
    "Himachal Pradesh": {"lat": 31.1048, "lng": 77.1734, "zone": "Northern"},
    "Uttarakhand": {"lat": 30.0668, "lng": 79.0193, "zone": "Northern"},
    "Goa": {"lat": 15.2993, "lng": 74.1240, "zone": "Western"},
}

def normalize_state_name(val: Any) -> Optional[str]:
    """Standardizes state names to official Indian state names."""
    if val is None or pd.isna(val):
        return None
    cleaned = str(val).strip().lower()
    return INDIAN_STATE_ALIASES.get(cleaned, str(val).strip().title())
