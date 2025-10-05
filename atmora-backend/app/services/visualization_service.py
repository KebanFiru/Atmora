"""
Visualization utilities for weather predictions
Creates charts showing historical data and predictions
"""

import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from typing import List, Dict, Tuple
import io
import base64

def create_prediction_chart(
    historical_df: pd.DataFrame,
    predictions: List[Dict[str, float]],
    target_date: str,
    years_to_show: int = 3
) -> str:
    """
    Create a chart showing last N years of historical data and predictions
    
    Args:
        historical_df: DataFrame with historical weather data
        predictions: List of prediction dictionaries
        target_date: Starting date of predictions
        years_to_show: Number of recent years to show (default 3)
    
    Returns:
        Base64 encoded PNG image
    """
    
    # Filter last N years of historical data
    end_date = historical_df['date'].max()
    start_date = end_date - timedelta(days=years_to_show * 365)
    recent_df = historical_df[historical_df['date'] >= start_date].copy()
    
    # Create predictions DataFrame
    pred_df = pd.DataFrame(predictions)
    pred_df['date'] = pd.to_datetime(pred_df['date'])
    
    # Create figure with 4 subplots
    fig, axes = plt.subplots(4, 1, figsize=(14, 12))
    fig.suptitle('Weather Prediction Visualization', fontsize=16, fontweight='bold')
    
    parameters = [
        ('temperature', 'Temperature (°C)', 'orangered', 'coral'),
        ('wind_speed', 'Wind Speed (m/s)', 'dodgerblue', 'lightblue'),
        ('precipitation', 'Precipitation (mm)', 'mediumseagreen', 'lightgreen'),
        ('humidity', 'Humidity (%)', 'mediumpurple', 'plum')
    ]
    
    for idx, (param, label, hist_color, pred_color) in enumerate(parameters):
        ax = axes[idx]
        
        # Plot historical data
        ax.plot(recent_df['date'], recent_df[param], 
                color=hist_color, linewidth=1.5, label='Historical Data', alpha=0.8)
        
        # Plot predictions
        ax.plot(pred_df['date'], pred_df[param], 
                color=pred_color, linewidth=2.5, label='Predictions', 
                linestyle='--', marker='o', markersize=4)
        
        # Add vertical line at prediction start
        ax.axvline(x=pd.to_datetime(target_date), color='red', 
                   linestyle=':', linewidth=2, alpha=0.7, label='Prediction Start')
        
        # Formatting
        ax.set_ylabel(label, fontweight='bold')
        ax.legend(loc='upper left', fontsize=9)
        ax.grid(True, alpha=0.3)
        ax.set_xlim(recent_df['date'].min(), pred_df['date'].max())
        
        # Format x-axis
        ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
        ax.xaxis.set_major_locator(mdates.MonthLocator(interval=3))
        
        # Rotate date labels
        plt.setp(ax.xaxis.get_majorticklabels(), rotation=45, ha='right')
    
    # Add info text
    info_text = f"Historical: {years_to_show} years | Predictions: {len(predictions)} days"
    fig.text(0.5, 0.02, info_text, ha='center', fontsize=10, style='italic', color='gray')
    
    plt.tight_layout()
    
    # Convert to base64
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png', dpi=100, bbox_inches='tight')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.read()).decode()
    plt.close(fig)
    
    return image_base64


def create_accuracy_test_chart(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
    predictions: List[Dict[str, float]],
    accuracy_metrics: Dict[str, float]
) -> str:
    """
    Create a chart for accuracy testing showing actual vs predicted
    
    Args:
        train_df: Training data (before 2023)
        test_df: Test data (actual 2023 data)
        predictions: Model predictions for 2023
        accuracy_metrics: Dictionary with MAE, RMSE, etc.
    
    Returns:
        Base64 encoded PNG image
    """
    
    # Create predictions DataFrame
    pred_df = pd.DataFrame(predictions)
    pred_df['date'] = pd.to_datetime(pred_df['date'])
    
    # Create figure with 4 subplots
    fig, axes = plt.subplots(4, 1, figsize=(14, 12))
    fig.suptitle('Accuracy Test: 2023 Predictions vs Actual Data', fontsize=16, fontweight='bold')
    
    parameters = [
        ('temperature', 'Temperature (°C)', 'orangered'),
        ('wind_speed', 'Wind Speed (m/s)', 'dodgerblue'),
        ('precipitation', 'Precipitation (mm)', 'mediumseagreen'),
        ('humidity', 'Humidity (%)', 'mediumpurple')
    ]
    
    for idx, (param, label, color) in enumerate(parameters):
        ax = axes[idx]
        
        # Plot actual data
        ax.plot(test_df['date'], test_df[param], 
                color=color, linewidth=2, label='Actual', alpha=0.8)
        
        # Plot predictions
        ax.plot(pred_df['date'], pred_df[param], 
                color='gray', linewidth=2, label='Predicted', 
                linestyle='--', marker='o', markersize=3, alpha=0.7)
        
        # Calculate error for this parameter
        if param in accuracy_metrics:
            mae = accuracy_metrics[param]['mae']
            rmse = accuracy_metrics[param]['rmse']
            error_text = f"MAE: {mae:.2f} | RMSE: {rmse:.2f}"
            ax.text(0.02, 0.98, error_text, transform=ax.transAxes,
                   fontsize=9, verticalalignment='top', bbox=dict(boxstyle='round', 
                   facecolor='wheat', alpha=0.5))
        
        # Formatting
        ax.set_ylabel(label, fontweight='bold')
        ax.legend(loc='upper right', fontsize=9)
        ax.grid(True, alpha=0.3)
        
        # Format x-axis
        ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
        ax.xaxis.set_major_locator(mdates.MonthLocator())
        
        # Rotate date labels
        plt.setp(ax.xaxis.get_majorticklabels(), rotation=45, ha='right')
    
    # Add overall accuracy text
    if 'overall_mae' in accuracy_metrics:
        overall_text = f"Overall MAE: {accuracy_metrics['overall_mae']:.2f}"
        fig.text(0.5, 0.02, overall_text, ha='center', fontsize=11, 
                style='italic', color='darkred', fontweight='bold')
    
    plt.tight_layout()
    
    # Convert to base64
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png', dpi=100, bbox_inches='tight')
    buffer.seek(0)
    image_base64 = base64.b64encode(buffer.read()).decode()
    plt.close(fig)
    
    return image_base64


def calculate_accuracy_metrics(
    actual_df: pd.DataFrame,
    predictions: List[Dict[str, float]]
) -> Dict[str, any]:
    """
    Calculate accuracy metrics (MAE, RMSE) for predictions vs actual data
    
    Args:
        actual_df: DataFrame with actual values
        predictions: List of prediction dictionaries
    
    Returns:
        Dictionary with accuracy metrics per parameter
    """
    
    pred_df = pd.DataFrame(predictions)
    pred_df['date'] = pd.to_datetime(pred_df['date'])
    
    # Merge actual and predicted on date
    merged = actual_df.merge(pred_df, on='date', suffixes=('_actual', '_pred'))
    
    metrics = {}
    parameters = ['temperature', 'wind_speed', 'precipitation', 'humidity']
    
    all_maes = []
    
    for param in parameters:
        actual_col = f"{param}_actual"
        pred_col = f"{param}_pred"
        
        if actual_col in merged.columns and pred_col in merged.columns:
            actual = merged[actual_col].values
            predicted = merged[pred_col].values
            
            # Calculate MAE
            mae = np.mean(np.abs(actual - predicted))
            
            # Calculate RMSE
            rmse = np.sqrt(np.mean((actual - predicted) ** 2))
            
            # Calculate percentage error
            mape = np.mean(np.abs((actual - predicted) / (actual + 1e-10))) * 100
            
            metrics[param] = {
                'mae': mae,
                'rmse': rmse,
                'mape': mape
            }
            
            all_maes.append(mae)
    
    # Overall metrics
    if all_maes:
        metrics['overall_mae'] = np.mean(all_maes)
    
    return metrics
