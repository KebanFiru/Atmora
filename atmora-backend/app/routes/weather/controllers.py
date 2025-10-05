"""
Weather Analysis Controller
Handles weather analysis requests and data processing
"""

from flask import Blueprint, request, jsonify, send_file
from app.services.nasa_weather_service import get_point_data_for_period, create_weather_charts
import threading
import uuid
import time
import json
import csv
import tempfile
import os
from datetime import datetime

weather_bp = Blueprint('weather', __name__)

# Global değişkenler
active_tasks = {}

class ProgressTracker:
    def __init__(self, task_id):
        self.task_id = task_id
        self.progress = 0
        self.total = 0
        self.status = "başlıyor"
        self.result = None
        self.error = None
        self.start_time = time.time()

    def update(self, current, total):
        self.progress = current
        self.total = total
        self.status = f"{current}/{total} tamamlandı"

@weather_bp.route('/analyze', methods=['POST'])
def analyze_weather():
    """
    Start weather analysis for a location and date range
    Expected JSON payload:
    {
        "latitude": float,
        "longitude": float,
        "startDate": "YYYY-MM-DD",
        "endDate": "YYYY-MM-DD"
    }
    """
    try:
        data = request.json
        
        # Veriyi doğrula
        required_fields = ['latitude', 'longitude', 'startDate', 'endDate']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Eksik alan: {field}'}), 400
        
        # Tarih doğrulaması
        try:
            start_date = datetime.strptime(data['startDate'], '%Y-%m-%d')
            end_date = datetime.strptime(data['endDate'], '%Y-%m-%d')
            
            if start_date > end_date:
                return jsonify({'error': 'Başlangıç tarihi bitiş tarihinden sonra olamaz'}), 400
            
            # Maksimum 1 yıl sınırı
            if (end_date - start_date).days > 365:
                return jsonify({'error': 'Maksimum 1 yıllık veri analizi yapılabilir'}), 400
                
        except ValueError:
            return jsonify({'error': 'Geçersiz tarih formatı. YYYY-MM-DD formatını kullanın'}), 400
        
        # Koordinat doğrulaması
        try:
            lat = float(data['latitude'])
            lon = float(data['longitude'])
            
            if not (-90 <= lat <= 90):
                return jsonify({'error': 'Enlem -90 ile 90 arasında olmalıdır'}), 400
            if not (-180 <= lon <= 180):
                return jsonify({'error': 'Boylam -180 ile 180 arasında olmalıdır'}), 400
                
        except (ValueError, TypeError):
            return jsonify({'error': 'Geçersiz koordinat değerleri'}), 400
        
        # Task ID oluştur
        task_id = str(uuid.uuid4())
        
        # Progress tracker oluştur
        tracker = ProgressTracker(task_id)
        active_tasks[task_id] = tracker
        
        # Arkaplan thread başlat
        thread = threading.Thread(
            target=process_weather_data,
            args=(data, tracker)
        )
        thread.daemon = True  # Ana program kapandığında thread'i sonlandır
        thread.start()
        
        return jsonify({
            'task_id': task_id,
            'status': 'başladı',
            'message': 'Hava durumu analizi başlatıldı'
        })
        
    except Exception as e:
        return jsonify({'error': f'Beklenmeyen hata: {str(e)}'}), 500

def process_weather_data(data, tracker):
    """Background task for processing weather data"""
    try:
        tracker.status = "NASA API'den veri toplama başlıyor"
        
        # NASA API'den veri çek
        result = get_point_data_for_period(
            data['latitude'], data['longitude'],
            data['startDate'], data['endDate'],
            progress_callback=tracker.update
        )
        
        tracker.status = "grafikler oluşturuluyor"
        
        # Grafikleri oluştur
        charts = create_weather_charts(result)
        result['charts'] = charts
        
        # Kullanıcı dostu özet oluştur
        summary = create_user_summary(result)
        result['summary'] = summary
        
        tracker.result = result
        tracker.status = "tamamlandı"
        
        print(f"✅ Task {tracker.task_id} tamamlandı: {len(result['all_data'])} veri noktası")
        
    except Exception as e:
        tracker.error = str(e)
        tracker.status = "hata"
        print(f"❌ Task {tracker.task_id} hatası: {e}")

def create_user_summary(result):
    """Create a user-friendly summary of the weather analysis"""
    stats = result['statistics']
    risks = result['risk_analysis']
    
    # Temel istatistikler
    summary = {
        'overview': {
            'total_days': result['total_points'],
            'date_range': result['date_range'],
            'location': result['coordinates']
        },
        'weather_highlights': {
            'average_temperature': f"{stats['temperature']['average']:.1f}°C",
            'temperature_range': f"{stats['temperature']['minimum']:.1f}°C - {stats['temperature']['maximum']:.1f}°C",
            'average_humidity': f"{stats['humidity']['average']:.1f}%",
            'average_wind_speed': f"{stats['wind_speed']['average']:.1f} m/s",
            'total_precipitation': f"{sum([d['precipitation'] for d in result['all_data']]):.1f} mm"
        },
        'risk_assessment': {
            'very_hot_days': f"{risks['very_hot']['probability']:.1f}%",
            'very_cold_days': f"{risks['very_cold']['probability']:.1f}%",
            'very_windy_days': f"{risks['very_windy']['probability']:.1f}%",
            'very_wet_days': f"{risks['very_wet']['probability']:.1f}%",
            'uncomfortable_days': f"{risks['very_uncomfortable']['probability']:.1f}%"
        },
        'recommendation': risks['overall_assessment']['recommendation'],
        'overall_risk_level': risks['overall_assessment']['risk_level']
    }
    
    return summary

@weather_bp.route('/progress/<task_id>', methods=['GET'])
def get_progress(task_id):
    """Get progress status of a weather analysis task"""
    if task_id not in active_tasks:
        return jsonify({'error': 'Task bulunamadı'}), 404
    
    tracker = active_tasks[task_id]
    
    response = {
        'task_id': task_id,
        'progress': tracker.progress,
        'total': tracker.total,
        'status': tracker.status,
        'percentage': (tracker.progress / tracker.total * 100) if tracker.total > 0 else 0,
        'elapsed_time': int(time.time() - tracker.start_time)
    }
    
    # Başarılı sonuç varsa ekle
    if tracker.result:
        response['completed'] = True
        response['summary'] = tracker.result.get('summary', {})
        response['charts'] = tracker.result.get('charts', {})
        response['risk_analysis'] = tracker.result.get('risk_analysis', {})
        response['statistics'] = tracker.result.get('statistics', {})
        
    # Hata varsa ekle
    if tracker.error:
        response['error'] = tracker.error
        response['completed'] = False
    
    return jsonify(response)

@weather_bp.route('/result/<task_id>', methods=['GET'])
def get_result(task_id):
    """Get full results of a completed weather analysis"""
    if task_id not in active_tasks:
        return jsonify({'error': 'Task bulunamadı'}), 404
    
    tracker = active_tasks[task_id]
    
    if not tracker.result:
        return jsonify({'error': 'Analiz henüz tamamlanmadı'}), 400
    
    if tracker.error:
        return jsonify({'error': tracker.error}), 500
    
    # Full result döndür (grafikleri de içerir)
    return jsonify({
        'task_id': task_id,
        'status': 'completed',
        'result': tracker.result
    })

@weather_bp.route('/export/<task_id>/<format>', methods=['GET'])
def export_data(task_id, format):
    """Export weather analysis data in CSV or JSON format"""
    if task_id not in active_tasks:
        return jsonify({'error': 'Task bulunamadı'}), 404
    
    tracker = active_tasks[task_id]
    if not tracker.result:
        return jsonify({'error': 'Veri henüz hazır değil'}), 400
    
    try:
        if format.lower() == 'json':
            return export_json(tracker.result, task_id)
        elif format.lower() == 'csv':
            return export_csv(tracker.result, task_id)
        else:
            return jsonify({'error': 'Desteklenmeyen format. csv veya json kullanın'}), 400
    except Exception as e:
        return jsonify({'error': f'Export hatası: {str(e)}'}), 500

def export_json(result, task_id):
    """Export data in JSON format"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"atmora_weather_analysis_{task_id[:8]}_{timestamp}.json"
    
    export_data = {
        'metadata': {
            'export_time': datetime.now().isoformat(),
            'task_id': task_id,
            'analysis_tool': 'Atmora Weather Dashboard',
            'data_source': 'NASA POWER API',
            'date_range': result['date_range'],
            'coordinates': result['coordinates'],
            'total_points': result['total_points']
        },
        'summary': result.get('summary', {}),
        'statistics': result['statistics'],
        'risk_analysis': result['risk_analysis'],
        'daily_data': result['all_data']
    }
    
    # Temporary file oluştur
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
    try:
        json.dump(export_data, temp_file, indent=2, ensure_ascii=False)
        temp_file.close()
        
        return send_file(
            temp_file.name,
            as_attachment=True,
            download_name=filename,
            mimetype='application/json'
        )
    finally:
        # Cleanup
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)

def export_csv(result, task_id):
    """Export data in CSV format"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"atmora_weather_data_{task_id[:8]}_{timestamp}.csv"
    
    # Temporary file oluştur
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, encoding='utf-8')
    
    try:
        writer = csv.writer(temp_file)
        
        # Header
        writer.writerow([
            'Date',
            'Latitude',
            'Longitude',
            'Temperature (°C)',
            'Wind Speed (m/s)',
            'Precipitation (mm)',
            'Humidity (%)'
        ])
        
        # Data rows
        for point in result['all_data']:
            writer.writerow([
                point['date'],
                point['lat'],
                point['lon'],
                round(point['temperature'], 2),
                round(point['wind_speed'], 2),
                round(point['precipitation'], 2),
                round(point['humidity'], 2)
            ])
        
        temp_file.close()
        
        return send_file(
            temp_file.name,
            as_attachment=True,
            download_name=filename,
            mimetype='text/csv'
        )
    finally:
        # Cleanup
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)

@weather_bp.route('/cleanup/<task_id>', methods=['DELETE'])
def cleanup_task(task_id):
    """Clean up completed task data"""
    if task_id in active_tasks:
        del active_tasks[task_id]
        return jsonify({'status': 'temizlendi', 'task_id': task_id})
    else:
        return jsonify({'error': 'Task bulunamadı'}), 404

@weather_bp.route('/tasks', methods=['GET'])
def list_tasks():
    """List all active tasks (for debugging)"""
    task_list = []
    for task_id, tracker in active_tasks.items():
        task_info = {
            'task_id': task_id,
            'status': tracker.status,
            'progress': tracker.progress,
            'total': tracker.total,
            'elapsed_time': int(time.time() - tracker.start_time),
            'has_result': tracker.result is not None,
            'has_error': tracker.error is not None
        }
        task_list.append(task_info)
    
    return jsonify({
        'active_tasks': len(active_tasks),
        'tasks': task_list
    })

# Health check endpoint
@weather_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    from app.services.nasa_weather_service import get_cache_size_mb, memory_cache
    
    return jsonify({
        'status': 'healthy',
        'service': 'Atmora Weather Analysis API',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat(),
        'active_tasks': len(active_tasks),
        'cache_stats': {
            'disk_cache_size_mb': round(get_cache_size_mb(), 2),
            'memory_cache_items': len(memory_cache),
            'memory_cache_limit': 500
        }
    })