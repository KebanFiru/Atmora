"""
Accuracy testing for weather prediction model
Tests model performance on historical data
"""

import logging
from datetime import datetime, timedelta
from typing import Dict
import pandas as pd

logger = logging.getLogger(__name__)


def test_prediction_accuracy(lat: float, lon: float, test_months: int = 3, use_dynamic_data: bool = True) -> Dict:
    """
    Test prediction accuracy by training on data before 2023 and testing on 2023 data
    
    Args:
        lat: Latitude
        lon: Longitude
        test_months: Number of months to test (default 3)
        use_dynamic_data: Use real-time NASA API or static data
    
    Returns:
        Dictionary with test results, metrics, and charts
    """
    from .prediction_service import (
        fetch_historical_data_dynamic, 
        fetch_historical_data,
        prepare_training_data,
        train_model,
        forecast_next_days
    )
    from .visualization_service import create_accuracy_test_chart, calculate_accuracy_metrics
    
    logger.info(f"🧪 Starting accuracy test for ({lat:.4f}, {lon:.4f})")
    logger.info(f"   Test period: {test_months} months of 2023 data")
    
    try:
        # Fetch full historical data
        if use_dynamic_data:
            df = fetch_historical_data_dynamic(lat, lon, years=10)
        else:
            df = fetch_historical_data(lat, lon)
        
        # Split data: train on pre-2023, test on 2023
        test_start = datetime(2023, 1, 1)
        test_end = test_start + timedelta(days=test_months * 30)
        
        train_df = df[df['date'] < test_start].copy()
        test_df = df[(df['date'] >= test_start) & (df['date'] < test_end)].copy()
        
        logger.info(f"   Training data: {len(train_df)} days (until {train_df['date'].max()})")
        logger.info(f"   Test data: {len(test_df)} days ({test_df['date'].min()} to {test_df['date'].max()})")
        
        if len(test_df) == 0:
            raise ValueError("No test data available for 2023")
        
        # Train model on pre-2023 data
        logger.info("🧠 Training model on pre-2023 data...")
        X, y, feature_columns = prepare_training_data(train_df)
        model = train_model(X, y)
        
        # Make predictions for test period
        logger.info(f"🔮 Predicting {len(test_df)} days...")
        days_to_predict = (test_df['date'].max() - train_df['date'].max()).days
        predictions = forecast_next_days(train_df, model, feature_columns, horizon=days_to_predict)
        
        # Filter predictions to match test period
        pred_dates = [p['date'] for p in predictions]
        test_dates = test_df['date'].dt.strftime('%Y-%m-%d').tolist()
        
        # Match predictions with test data
        matched_predictions = []
        for pred in predictions:
            if pred['date'] in test_dates:
                matched_predictions.append(pred)
        
        logger.info(f"✅ Generated {len(matched_predictions)} matched predictions")
        
        # Calculate accuracy metrics
        logger.info("📊 Calculating accuracy metrics...")
        metrics = calculate_accuracy_metrics(test_df, matched_predictions)
        
        # Generate comparison chart
        logger.info("📈 Generating accuracy test chart...")
        chart_base64 = create_accuracy_test_chart(train_df, test_df, matched_predictions, metrics)
        
        # Calculate average temperature difference (user-friendly metric)
        temp_mae = metrics.get('temperature', {}).get('mae', 0)
        
        result = {
            'success': True,
            'test_period': {
                'start': test_df['date'].min().strftime('%Y-%m-%d'),
                'end': test_df['date'].max().strftime('%Y-%m-%d'),
                'days': len(test_df)
            },
            'training_period': {
                'start': train_df['date'].min().strftime('%Y-%m-%d'),
                'end': train_df['date'].max().strftime('%Y-%m-%d'),
                'days': len(train_df)
            },
            'metrics': metrics,
            'chart': chart_base64,
            'summary': {
                'average_temperature_error': f"±{temp_mae:.1f}°C",
                'overall_accuracy': f"{100 - metrics.get('overall_mae', 0) * 5:.1f}%",  # Rough percentage
                'status': 'Excellent' if temp_mae < 2 else 'Good' if temp_mae < 4 else 'Fair'
            }
        }
        
        logger.info(f"✅ Accuracy test completed!")
        logger.info(f"   Average Temperature Error: ±{temp_mae:.1f}°C")
        logger.info(f"   Overall MAE: {metrics.get('overall_mae', 0):.2f}")
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Accuracy test failed: {e}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e)
        }
