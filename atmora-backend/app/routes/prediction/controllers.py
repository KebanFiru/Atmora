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

# Global variables for async predictions
active_predictions = {}


class PredictionTracker:
    def __init__(self, task_id):
        self.task_id = task_id
        self.progress = 0
        self.status = "başlıyor"
        self.result = None
        self.error = None
        self.start_time = time.time()


@prediction_bp.route('/forecast', methods=['POST'])
def forecast_weather():
    """
    Start weather prediction for a future date using real-time NASA data
    Expected JSON payload:
    {
        "latitude": float,  # Exact latitude of selected location
        "longitude": float,  # Exact longitude of selected location
        "targetDate": "YYYY-MM-DD",  # Future date to predict
        "horizon": int (optional, default 1),  # Number of days to predict
        "use_dynamic_data": bool (optional, default True)  # Use real-time NASA API
    }
    
    Data modes:
    - use_dynamic_data=True: Fetches 10 years of location-specific data from NASA POWER API (~3-10s)
    - use_dynamic_data=False: Uses pre-collected regional climate data (faster, less accurate)
    """
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['latitude', 'longitude', 'targetDate']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Eksik alan: {field}'}), 400
        
        # Validate coordinates
        try:
            lat = float(data['latitude'])
            lon = float(data['longitude'])
            
            if not (-90 <= lat <= 90):
                return jsonify({'error': 'Enlem -90 ile 90 arasında olmalıdır'}), 400
            if not (-180 <= lon <= 180):
                return jsonify({'error': 'Boylam -180 ile 180 arasında olmalıdır'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Geçersiz koordinat değerleri'}), 400
        
        # Validate date
        try:
            target_date = datetime.strptime(data['targetDate'], '%Y-%m-%d')
            
            # Must be after training data end date (2024-12-31)
            training_end_date = datetime(2024, 12, 31)
            if target_date <= training_end_date:
                return jsonify({'error': 'Hedef tarih 2025-01-01 veya sonrası olmalıdır (eğitim verisi 2024-12-31\'de bitiyor)'}), 400
            
            # Optional: limit to reasonable future (e.g., 1 year)
            max_prediction_date = datetime(2025, 12, 31)
            if target_date > max_prediction_date:
                return jsonify({'error': 'Hedef tarih en fazla 2025-12-31 olabilir (makul doğruluk için)'}), 400
                
        except ValueError:
            return jsonify({'error': 'Geçersiz tarih formatı. YYYY-MM-DD formatını kullanın'}), 400
        
        horizon = data.get('horizon', 1)
        
        # Create task ID
        task_id = str(uuid.uuid4())
        
        # Create progress tracker
        tracker = PredictionTracker(task_id)
        active_predictions[task_id] = tracker
        
        # Start background thread
        thread = threading.Thread(
            target=process_prediction,
            args=(data, tracker)
        )
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'task_id': task_id,
            'status': 'başladı',
            'message': 'Hava durumu tahmini başlatıldı'
        })
        
    except Exception as e:
        return jsonify({'error': f'Beklenmeyen hata: {str(e)}'}), 500


def process_prediction(data, tracker):
    """Background task for processing prediction"""
    try:
        # Check if dynamic data fetching is enabled (default: True)
        use_dynamic = data.get('use_dynamic_data', True)
        
        if use_dynamic:
            tracker.status = "NASA POWER API'den 10 yıllık veri çekiliyor..."
        else:
            tracker.status = "Akdeniz iklimi verisi yükleniyor (4 yıllık)"
        
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
        tracker.status = "Sonuçlar hazırlanıyor"
        
        # Create user-friendly response
        prediction_summary = create_prediction_summary(result)
        
        tracker.result = {
            'predictions': result.predictions,
            'accuracy_score': result.accuracy_score,
            'confidence_level': result.confidence_level,
            'days_from_2024': result.days_from_2024,
            'target_date': result.target_date,
            'location': result.location,
            'summary': prediction_summary,
            'chart': result.chart  # Base64 encoded chart
        }
        tracker.progress = 100
        tracker.status = "tamamlandı"
        
        print(f"✅ Prediction {tracker.task_id} tamamlandı")
        
    except Exception as e:
        tracker.error = str(e)
        tracker.status = "hata"
        print(f"❌ Prediction {tracker.task_id} hatası: {e}")


def create_prediction_summary(result: PredictionResult) -> dict:
    """Create user-friendly summary"""
    if not result.predictions:
        return {}
    
    pred = result.predictions[0]  # First day prediction
    
    # Weather condition classification
    temp = pred['temperature']
    if temp > 30:
        temp_desc = "çok sıcak"
    elif temp > 20:
        temp_desc = "ılık"
    elif temp > 10:
        temp_desc = "serin"
    else:
        temp_desc = "soğuk"
    
    wind = pred['wind_speed']
    if wind > 15:
        wind_desc = "çok rüzgarlı"
    elif wind > 8:
        wind_desc = "rüzgarlı"
    else:
        wind_desc = "sakin"
    
    precip = pred['precipitation']
    if precip > 10:
        precip_desc = "yağmurlu"
    elif precip > 2:
        precip_desc = "hafif yağışlı"
    else:
        precip_desc = "kuru"
    
    # Accuracy bar color
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
        return "✅ Yüksek doğruluk - Tahmin güvenilir"
    elif accuracy >= 50:
        return "⚠️ Orta doğruluk - Tahmin referans amaçlıdır"
    else:
        return "❌ Düşük doğruluk - Tahmin çok belirsiz, sadece genel fikir verir"


@prediction_bp.route('/progress/<task_id>', methods=['GET'])
def get_prediction_progress(task_id):
    """Get progress status of a prediction task"""
    if task_id not in active_predictions:
        return jsonify({'error': 'Task bulunamadı'}), 404
    
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
        return jsonify({'status': 'temizlendi', 'task_id': task_id})
    else:
        return jsonify({'error': 'Task bulunamadı'}), 404


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
        
        # Validate required fields
        if 'latitude' not in data or 'longitude' not in data:
            return jsonify({'error': 'Latitude ve longitude gerekli'}), 400
        
        lat = float(data['latitude'])
        lon = float(data['longitude'])
        test_months = data.get('test_months', 3)
        use_dynamic = data.get('use_dynamic_data', True)
        
        print(f"🧪 Starting accuracy test for ({lat}, {lon})")
        
        # Run accuracy test
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
