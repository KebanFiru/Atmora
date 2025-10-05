"""
Prediction Routes
Weather forecasting endpoints
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import threading
import uuid
import time
from app.services.prediction_service import predict_weather, PredictionResult

prediction_bp = Blueprint('prediction', __name__)

active_predictions = {}


class PredictionTracker:
    def __init__(self, task_id):
        self.task_id = task_id
        self.progress = 0
        self.status = "starting"
        self.result = None
        self.error = None
        self.start_time = time.time()


@prediction_bp.route('/forecast', methods=['POST'])
def forecast_weather():
    """
    Start weather prediction for a future date using real-time NASA data
    Expected JSON payload:
    {
        "latitude": float,
        "longitude": float,
        "targetDate": "YYYY-MM-DD",
        "horizon": int (optional, default 1),
        "use_dynamic_data": bool (optional, default True)
    }
    
    Data modes:
    - use_dynamic_data=True: Fetches 10 years of location-specific data from NASA POWER API (~3-10s)
    - use_dynamic_data=False: Uses pre-collected regional climate data (faster, less accurate)
    """
    try:
        data = request.json
        
        required_fields = ['latitude', 'longitude', 'targetDate']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Eksik alan: {field}'}), 400
        
        try:
            lat = float(data['latitude'])
            lon = float(data['longitude'])
            
            if not (-90 <= lat <= 90):
                return jsonify({'error': 'Latitude must be between -90 and 90'}), 400
            if not (-180 <= lon <= 180):
                return jsonify({'error': 'Longitude must be between -180 and 180'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid coordinate values'}), 400
        
        try:
            target_date = datetime.strptime(data['targetDate'], '%Y-%m-%d')
            
            training_end_date = datetime(2024, 12, 31)
            if target_date <= training_end_date:
                return jsonify({'error': 'Hedef tarih 2025-01-01 veya sonrası olmalıdır (eğitim verisi 2024-12-31\'de bitiyor)'}), 400
            
            max_prediction_date = datetime(2025, 12, 31)
            if target_date > max_prediction_date:
                return jsonify({'error': 'Target date cannot exceed 2025-12-31 (for reasonable accuracy)'}), 400
                
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        horizon = data.get('horizon', 1)
        
        task_id = str(uuid.uuid4())
        
        tracker = PredictionTracker(task_id)
        active_predictions[task_id] = tracker
        
        thread = threading.Thread(
            target=process_prediction,
            args=(data, tracker)
        )
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'task_id': task_id,
            'status': 'started',
            'message': 'Weather prediction initiated'
        })
        
    except Exception as e:
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500


def process_prediction(data, tracker):
    """Background task for processing prediction"""
    try:
        use_dynamic = data.get('use_dynamic_data', True)
        
        if use_dynamic:
            tracker.status = "Fetching 10 years of data from NASA POWER API..."
        else:
            tracker.status = "Loading Mediterranean climate data (4 years)"
        
        tracker.progress = 10
        
        result = predict_weather(
            data['latitude'],
            data['longitude'],
            data['targetDate'],
            horizon=data.get('horizon', 1),
            climate_type=data.get('climate_type', 'mediterranean'),
            use_dynamic_data=use_dynamic
        )
        
        tracker.progress = 90
        tracker.status = "Preparing results"
        
        prediction_summary = create_prediction_summary(result)
        
        tracker.result = {
            'predictions': result.predictions,
            'accuracy_score': result.accuracy_score,
            'confidence_level': result.confidence_level,
            'days_from_2024': result.days_from_2024,
            'target_date': result.target_date,
            'location': result.location,
            'summary': prediction_summary,
            'chart': result.chart
        }
        tracker.progress = 100
        tracker.status = "completed"
        
        print(f"✅ Prediction {tracker.task_id} completed")
        
    except Exception as e:
        tracker.error = str(e)
        tracker.status = "error"
        print(f"❌ Prediction {tracker.task_id} errorsı: {e}")


def create_prediction_summary(result: PredictionResult) -> dict:
    """Create user-friendly summary"""
    if not result.predictions:
        return {}
    
    pred = result.predictions[0]
    
    temp = pred['temperature']
    if temp > 30:
        temp_desc = "very hot"
    elif temp > 20:
        temp_desc = "warm"
    elif temp > 10:
        temp_desc = "cool"
    else:
        temp_desc = "cold"
    
    wind = pred['wind_speed']
    if wind > 15:
        wind_desc = "very windy"
    elif wind > 8:
        wind_desc = "windy"
    else:
        wind_desc = "calm"
    
    precip = pred['precipitation']
    if precip > 10:
        precip_desc = "rainy"
    elif precip > 2:
        precip_desc = "light rain"
    else:
        precip_desc = "dry"
    
    if result.accuracy_score >= 80:
        accuracy_color = "green"
    elif result.accuracy_score >= 50:
        accuracy_color = "yellow"
    else:
        accuracy_color = "red"
    
    return {
        'temperature': {
            'value': round(temp, 1),
            'description': temp_desc,
            'unit': '°C'
        },
        'wind_speed': {
            'value': round(wind, 1),
            'description': wind_desc,
            'unit': 'm/s'
        },
        'precipitation': {
            'value': round(precip, 1),
            'description': precip_desc,
            'unit': 'mm'
        },
        'humidity': {
            'value': round(pred['humidity'], 1),
            'unit': '%'
        },
        'overall_condition': f"{temp_desc}, {wind_desc}, {precip_desc}",
        'accuracy_bar': {
            'score': result.accuracy_score,
            'color': accuracy_color,
            'confidence': result.confidence_level
        },
        'warning': get_accuracy_warning(result.days_from_2024, result.accuracy_score)
    }


def get_accuracy_warning(days_from_2024: int, accuracy: float) -> str:
    """Generate warning message based on accuracy"""
    if accuracy >= 80:
        return "✅ High accuracy - Prediction is reliable"
    elif accuracy >= 50:
        return "⚠️ Medium accuracy - Prediction is for reference"
    else:
        return "❌ Low accuracy - Prediction is very uncertain, general idea only"


@prediction_bp.route('/progress/<task_id>', methods=['GET'])
def get_prediction_progress(task_id):
    """Get progress status of a prediction task"""
    if task_id not in active_predictions:
        return jsonify({'error': 'Task not found'}), 404
    
    tracker = active_predictions[task_id]
    
    response = {
        'task_id': task_id,
        'progress': tracker.progress,
        'status': tracker.status,
        'elapsed_time': int(time.time() - tracker.start_time)
    }
    
    if tracker.result:
        response['completed'] = True
        response['result'] = tracker.result
    
    if tracker.error:
        response['error'] = tracker.error
        response['completed'] = False
    
    return jsonify(response)


@prediction_bp.route('/cleanup/<task_id>', methods=['DELETE'])
def cleanup_prediction(task_id):
    """Clean up completed prediction task"""
    if task_id in active_predictions:
        del active_predictions[task_id]
        return jsonify({'status': 'cleaned', 'task_id': task_id})
    else:
        return jsonify({'error': 'Task not found'}), 404


@prediction_bp.route('/accuracy-test', methods=['POST'])
def accuracy_test():
    """
    Test prediction accuracy for a location using historical data
    Expected JSON payload:
    {
        "latitude": float,
        "longitude": float,
        "test_months": int (optional, default 3),
        "use_dynamic_data": bool (optional, default True)
    }
    """
    try:
        data = request.json
        
        if 'latitude' not in data or 'longitude' not in data:
            return jsonify({'error': 'Latitude and longitude are required'}), 400
        
        lat = float(data['latitude'])
        lon = float(data['longitude'])
        test_months = data.get('test_months', 3)
        use_dynamic = data.get('use_dynamic_data', True)
        
        print(f"🧪 Starting accuracy test for ({lat}, {lon})")
        
        from app.services.accuracy_test_service import test_prediction_accuracy
        result = test_prediction_accuracy(lat, lon, test_months, use_dynamic)
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify({'error': result.get('error', 'Test failed')}), 500
            
    except Exception as e:
        print(f"❌ Accuracy test error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@prediction_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Atmora Prediction API',
        'version': '1.0.0',
        'active_tasks': len(active_predictions)
    })
