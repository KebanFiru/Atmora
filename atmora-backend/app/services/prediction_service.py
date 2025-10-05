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


def fetch_historical_data(lat: float, lon: float, climate_type: str = "mediterranean") -> pd.DataFrame:
    """
    Load pre-collected 4-year historical weather data for specific climate types.
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
        "mediterranean": "italy_nasa_data.csv",  # Akdeniz iklimi - İtalya/İngiltere verisi
        # Gelecekte eklenecek:
        # "tropical": "tropical_nasa_data.csv",
        # "continental": "continental_nasa_data.csv",
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


def predict_weather(lat: float, lon: float, target_date_str: str, horizon: int = 1, climate_type: str = "mediterranean") -> PredictionResult:
    """
    Main prediction function for weather forecasting based on climate type
    
    Args:
        lat: Latitude (for reference)
        lon: Longitude (for reference)
        target_date_str: Target date for prediction (YYYY-MM-DD) - starting point for prediction
        horizon: Number of days to predict from target_date (default 1)
        climate_type: Climate type - "mediterranean" (Akdeniz iklimi), "tropical", etc.
    
    Returns:
        PredictionResult with predictions and accuracy metrics
    """
    target_date = datetime.strptime(target_date_str, "%Y-%m-%d")
    
    # Calculate accuracy based on distance from 2024
    accuracy_score, confidence_level = calculate_accuracy_score(target_date)
    days_from_2024 = (target_date - datetime(2024, 12, 31)).days
    
    logger.info(f"🔮 Predicting weather for {lat}, {lon} on {target_date_str}")
    logger.info(f"   Climate Type: {climate_type.upper()} (accuracy: {accuracy_score}%)")
    
    # Load pre-collected historical data based on climate type
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
    
    return PredictionResult(
        predictions=predictions,
        accuracy_score=accuracy_score,
        confidence_level=confidence_level,
        days_from_2024=days_from_2024,
        target_date=target_date_str,
        location={"latitude": lat, "longitude": lon}
    )
