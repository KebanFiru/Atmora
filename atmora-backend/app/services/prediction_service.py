"""
Weather Prediction Service
Adapted from deneme/src for Atmora Backend
"""

import logging
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Dict, Iterable, List
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.multioutput import MultiOutputRegressor
import requests
import time

logger = logging.getLogger(__name__)

TARGET_COLUMNS = ["temperature", "wind_speed", "precipitation", "humidity"]
LAG_DAYS = [1, 2, 3, 7, 14]


@dataclass
class PredictionResult:
    predictions: List[Dict[str, float]]
    accuracy_score: float  # 0-100%
    confidence_level: str  # "high", "medium", "low"
    days_from_2024: int
    target_date: str
    location: Dict[str, float]
    chart: str = None  # Base64 encoded chart image


def calculate_accuracy_score(target_date: datetime) -> tuple[float, str]:
    """
    Calculate accuracy score based on distance from 2024-12-31
    Linear decay: 100% at 2024-12-31, decreases as we go further
    """
    reference_date = datetime(2024, 12, 31)
    days_diff = abs((target_date - reference_date).days)
    
    # Linear decay: lose 1% per 3 days (roughly 10% per month)
    accuracy = max(20, 100 - (days_diff / 3.0))
    
    if accuracy >= 80:
        confidence = "high"
    elif accuracy >= 50:
        confidence = "medium"
    else:
        confidence = "low"
    
    return round(accuracy, 1), confidence


def _add_time_features(frame: pd.DataFrame) -> pd.DataFrame:
    df = frame.copy()
    day_of_year = df["date"].dt.dayofyear
    df["dayofyear_sin"] = np.sin(2 * np.pi * day_of_year / 365.25)
    df["dayofyear_cos"] = np.cos(2 * np.pi * day_of_year / 365.25)
    return df


def _add_lag_features(frame: pd.DataFrame, lags: Iterable[int]) -> pd.DataFrame:
    df = frame.copy()
    for column in TARGET_COLUMNS:
        for lag in lags:
            df[f"{column}_lag_{lag}"] = df[column].shift(lag)
    return df


def build_feature_frame(df: pd.DataFrame, lags: Iterable[int] = LAG_DAYS) -> pd.DataFrame:
    enhanced = _add_time_features(df)
    enhanced = _add_lag_features(enhanced, lags)
    return enhanced


def prepare_training_data(df: pd.DataFrame, lags: Iterable[int] = LAG_DAYS):
    feature_frame = build_feature_frame(df, lags)
    lag_columns = [f"{column}_lag_{lag}" for column in TARGET_COLUMNS for lag in lags]
    base_features = ["dayofyear_sin", "dayofyear_cos"] + lag_columns
    training_data = feature_frame.dropna(subset=lag_columns)
    X = training_data[base_features]
    y = training_data[TARGET_COLUMNS]
    return X, y, base_features


def train_model(X: pd.DataFrame, y: pd.DataFrame) -> MultiOutputRegressor:
    base_model = HistGradientBoostingRegressor(
        loss="squared_error", 
        max_depth=12, 
        learning_rate=0.05, 
        max_iter=400
    )
    model = MultiOutputRegressor(base_model)
    model.fit(X, y)
    return model


def forecast_next_days(
    df: pd.DataFrame,
    model: MultiOutputRegressor,
    feature_columns: List[str],
    horizon: int = 7,
    lags: Iterable[int] = LAG_DAYS,
) -> List[Dict[str, float]]:
    df_extended = df.copy().sort_values("date").reset_index(drop=True)
    last_date = df_extended["date"].iloc[-1]
    
    predictions: List[Dict[str, float]] = []
    
    for step in range(1, horizon + 1):
        target_date = last_date + timedelta(days=step)
        new_row = {
            "date": target_date,
            "latitude": df_extended["latitude"].iloc[-1],
            "longitude": df_extended["longitude"].iloc[-1],
        }
        for column in TARGET_COLUMNS:
            new_row[column] = np.nan
        df_extended = pd.concat([df_extended, pd.DataFrame([new_row])], ignore_index=True)
        feature_frame = build_feature_frame(df_extended, lags)
        feature_row = feature_frame.iloc[-1]
        X_pred = (
            feature_row[feature_columns]
            .astype(float, copy=True)
            .to_frame()
            .T
        )
        X_pred.columns = feature_columns
        y_pred = model.predict(X_pred)[0]
        
        for idx, column in enumerate(TARGET_COLUMNS):
            df_extended.at[df_extended.index[-1], column] = y_pred[idx]
        
        prediction_record = {
            "date": target_date.date().isoformat(),
        }
        for idx, column in enumerate(TARGET_COLUMNS):
            prediction_record[column] = float(y_pred[idx])
        predictions.append(prediction_record)
    
    return predictions


def fetch_historical_data_dynamic(lat: float, lon: float, years: int = 10) -> pd.DataFrame:
    """
    Fetch real-time historical weather data from NASA POWER API for exact coordinates.
    This provides location-specific data instead of pre-cached regional data.
    
    Args:
        lat: Exact latitude of the selected location
        lon: Exact longitude of the selected location
        years: Number of years of historical data (default 10, max 10-15)
    
    Returns:
        DataFrame with columns: date, latitude, longitude, temperature, wind_speed, precipitation, humidity
    """
    API_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
    
    # Calculate date range
    end_date = datetime(2024, 12, 31)  # NASA data available until end of 2024
    start_date = end_date - timedelta(days=years*365)
    
    start_str = start_date.strftime("%Y%m%d")
    end_str = end_date.strftime("%Y%m%d")
    
    params = {
        "parameters": "T2M,WS10M,PRECTOTCORR,RH2M",
        "community": "RE",
        "longitude": lon,
        "latitude": lat,
        "start": start_str,
        "end": end_str,
        "format": "JSON",
    }
    
    logger.info(f"🌐 Fetching NASA POWER data for coordinates ({lat:.4f}, {lon:.4f})")
    logger.info(f"   Date range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')} ({years} years)")
    
    start_time = time.time()
    
    try:
        response = requests.get(API_URL, params=params, timeout=60)
        response.raise_for_status()
        
        elapsed = time.time() - start_time
        logger.info(f"   ✅ NASA API responded in {elapsed:.1f}s")
        
        data = response.json()
        parameter_data = data.get("properties", {}).get("parameter", {})
        
        # Get all dates
        dates = sorted(set(parameter_data.get("T2M", {}).keys()))
        
        records = []
        for date_str in dates:
            date_obj = datetime.strptime(date_str, "%Y%m%d")
            
            record = {
                "date": date_obj.strftime("%Y-%m-%d"),
                "latitude": lat,
                "longitude": lon,
                "temperature": parameter_data.get("T2M", {}).get(date_str, None),
                "wind_speed": parameter_data.get("WS10M", {}).get(date_str, None),
                "precipitation": parameter_data.get("PRECTOTCORR", {}).get(date_str, None),
                "humidity": parameter_data.get("RH2M", {}).get(date_str, None),
            }
            records.append(record)
        
        df = pd.DataFrame(records)
        df['date'] = pd.to_datetime(df['date'])
        
        # Remove rows with missing values
        initial_count = len(df)
        df = df.dropna()
        removed = initial_count - len(df)
        
        if removed > 0:
            logger.warning(f"   Removed {removed} rows with missing data")
        
        logger.info(f"✅ Loaded {len(df)} days of location-specific data")
        logger.info(f"   Temperature avg: {df['temperature'].mean():.1f}°C (range: {df['temperature'].min():.1f}°C to {df['temperature'].max():.1f}°C)")
        
        return df
        
    except requests.exceptions.Timeout:
        logger.error("❌ NASA API timeout (>60s)")
        raise Exception("NASA POWER API timeout - please try again")
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ NASA API error: {e}")
        raise Exception(f"Failed to fetch NASA data: {str(e)}")


def fetch_historical_data(lat: float, lon: float, climate_type: str = "mediterranean") -> pd.DataFrame:
    """
    Load pre-collected historical weather data for specific climate types (fallback method).
    Uses local CSV files instead of API calls for faster predictions.
    
    Args:
        lat: Latitude (for reference only, not used in data selection)
        lon: Longitude (for reference only, not used in data selection)
        climate_type: Climate type - "mediterranean" (Akdeniz iklimi), etc.
    
    Returns:
        DataFrame with columns: date, latitude, longitude, temperature, wind_speed, precipitation, humidity
    """
    import os
    
    # Map climate types to data files
    climate_data_files = {
        "mediterranean": "izmir_nasa_data.csv",  # Akdeniz iklimi - İzmir gerçek verisi (2021-2024, avg 18°C)
        # Gelecekte eklenecek:
        # "tropical": "tropical_nasa_data.csv",
        # "continental": "continental_nasa_data.csv",
        # "temperate": "italy_nasa_data.csv",  # Ilıman iklim (UK/Italy)
    }
    
    # Default to mediterranean if type not found
    if climate_type not in climate_data_files:
        logger.warning(f"Climate type '{climate_type}' not found, using Mediterranean data")
        climate_type = "mediterranean"
    
    # Build path to data file
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    data_path = os.path.join(base_dir, 'instance', 'static', climate_data_files[climate_type])
    
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Climate data file not found: {data_path}")
    
    # Load CSV data
    logger.info(f"Loading {climate_type} climate data from {climate_data_files[climate_type]}")
    df = pd.read_csv(data_path)
    df['date'] = pd.to_datetime(df['date'])
    
    # Verify required columns exist
    required_cols = ['date', 'temperature', 'wind_speed', 'precipitation', 'humidity']
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns in data: {missing_cols}")
    
    # Sort by date and reset index
    df = df.sort_values('date').reset_index(drop=True)
    
    logger.info(f"✅ Loaded {len(df)} days of {climate_type} climate data")
    logger.info(f"   Date range: {df['date'].min()} to {df['date'].max()}")
    
    # Ensure latitude and longitude columns exist (use from CSV or provided values)
    if 'latitude' not in df.columns:
        df['latitude'] = lat
    if 'longitude' not in df.columns:
        df['longitude'] = lon
    
    return df[['date', 'latitude', 'longitude', 'temperature', 'wind_speed', 'precipitation', 'humidity']]


def predict_weather(lat: float, lon: float, target_date_str: str, horizon: int = 1, climate_type: str = "mediterranean", use_dynamic_data: bool = True) -> PredictionResult:
    """
    Main prediction function for weather forecasting based on climate type
    
    Args:
        lat: Exact latitude of selected location
        lon: Exact longitude of selected location
        target_date_str: Target date for prediction (YYYY-MM-DD) - starting point for prediction
        horizon: Number of days to predict from target_date (default 1)
        climate_type: Climate type - "mediterranean" (Akdeniz iklimi), etc. (used only if use_dynamic_data=False)
        use_dynamic_data: If True, fetch real-time data from NASA API for exact coordinates (default True)
    
    Returns:
        PredictionResult with predictions and accuracy metrics
    """
    target_date = datetime.strptime(target_date_str, "%Y-%m-%d")
    
    # Calculate accuracy based on distance from 2024
    accuracy_score, confidence_level = calculate_accuracy_score(target_date)
    days_from_2024 = (target_date - datetime(2024, 12, 31)).days
    
    logger.info(f"🔮 Predicting weather for ({lat:.4f}, {lon:.4f}) on {target_date_str}")
    logger.info(f"   Data Mode: {'DYNAMIC (Real-time NASA API)' if use_dynamic_data else f'STATIC ({climate_type})'}")
    logger.info(f"   Accuracy: {accuracy_score}%")
    
    # Fetch historical data - either dynamic or static
    if use_dynamic_data:
        logger.info("📡 Fetching location-specific data from NASA POWER API...")
        df = fetch_historical_data_dynamic(lat, lon, years=10)
    else:
        logger.info(f"📁 Loading pre-collected {climate_type} climate data...")
        df = fetch_historical_data(lat, lon, climate_type=climate_type)
    
    # Get last available date in historical data
    last_historical_date = df['date'].max()
    logger.info(f"   Last historical date: {last_historical_date}")
    
    # Calculate how many days we need to predict to reach target_date
    days_to_predict = (target_date - last_historical_date).days
    
    if days_to_predict <= 0:
        raise ValueError(f"Target date {target_date_str} must be after last historical date {last_historical_date.strftime('%Y-%m-%d')}")
    
    logger.info(f"   Days to predict: {days_to_predict} (from {last_historical_date.strftime('%Y-%m-%d')} to {target_date_str})")
    
    # Total predictions needed: reach target_date + horizon days
    total_days_to_predict = days_to_predict + horizon - 1
    
    # Train model on historical data
    X, y, feature_columns = prepare_training_data(df)
    model = train_model(X, y)
    
    # Make predictions from last historical date to target_date + horizon
    all_predictions = forecast_next_days(df, model, feature_columns, horizon=total_days_to_predict)
    
    # Extract only the predictions starting from target_date
    # Skip the first (days_to_predict - 1) predictions
    predictions = all_predictions[days_to_predict - 1:days_to_predict - 1 + horizon]
    
    logger.info(f"✅ Generated {len(predictions)} predictions starting from {target_date_str}")
    
    # Generate visualization chart
    chart_base64 = None
    try:
        from .visualization_service import create_prediction_chart
        logger.info("📊 Generating prediction visualization chart...")
        chart_base64 = create_prediction_chart(df, predictions, target_date_str, years_to_show=3)
        logger.info("✅ Chart generated successfully")
    except Exception as e:
        logger.warning(f"⚠️ Failed to generate chart: {e}")
    
    return PredictionResult(
        predictions=predictions,
        accuracy_score=accuracy_score,
        confidence_level=confidence_level,
        days_from_2024=days_from_2024,
        target_date=target_date_str,
        location={"latitude": lat, "longitude": lon},
        chart=chart_base64
    )
