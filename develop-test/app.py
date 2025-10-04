import threading
import uuid
from main import get_area_average, create_weather_charts
import matplotlib
matplotlib.use('Agg')
import csv
import json
from datetime import datetime
import os

active_tasks = {}

class ProgressTracker:
    def __init__(self, task_id):
        self.task_id = task_id
        self.progress = 0
        self.total = 0
        self.status = "starting"
        self.result = None
        self.error = None

    def update(self, current, total):
        self.progress = current
        self.total = total
        self.status = f"{current}/{total} completed"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze_weather():
    try:
        data = request.json

        required_fields = ['lat_min', 'lat_max', 'lon_min', 'lon_max', 'start_date', 'end_date']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400

        task_id = str(uuid.uuid4())
        tracker = ProgressTracker(task_id)
        active_tasks[task_id] = tracker

        thread = threading.Thread(
            target=process_weather_data,
            args=(data, tracker)
        )
        thread.start()

        return jsonify({
            'task_id': task_id,
            'status': 'started'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def process_weather_data(data, tracker):
    try:
        tracker.status = "collecting data"

        result = get_area_average(
            data['lat_min'], data['lat_max'],
            data['lon_min'], data['lon_max'],
            data['start_date'], data['end_date'],
            step=data.get('step', 1.0),
            progress_callback=tracker.update
        )

        tracker.status = "creating charts"
        chart_paths = create_weather_charts(result)

        result['chart_paths'] = chart_paths
        tracker.result = result
        tracker.status = "completed"

    except Exception as e:
        tracker.error = str(e)
        tracker.status = "error"

@app.route('/api/progress/<task_id>')
def get_progress(task_id):
    if task_id not in active_tasks:
        return jsonify({'error': 'Task not found'}), 404

    tracker = active_tasks[task_id]

    response = {
        'progress': tracker.progress,
        'total': tracker.total,
        'status': tracker.status,
        'percentage': (tracker.progress / tracker.total * 100) if tracker.total > 0 else 0
    }

    if tracker.result:
        response['result'] = {
            'statistics': tracker.result['statistics'],
            'total_points': tracker.result['total_points'],
            'date_range': tracker.result['date_range'],
            'coordinates': tracker.result['coordinates']
        }

    if tracker.error:
        response['error'] = tracker.error

    return jsonify(response)

@app.route('/api/chart/<path:filename>')
def serve_chart(filename):
    try:
        return send_file(f'charts/{filename}')
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@app.route('/api/cleanup/<task_id>')
def cleanup_task(task_id):
    if task_id in active_tasks:
        del active_tasks[task_id]
    return jsonify({'status': 'cleaned'})

@app.route('/api/export/<task_id>/<format>')
def export_data(task_id, format):
    if task_id not in active_tasks:
        return jsonify({'error': 'Task not found'}), 404

    tracker = active_tasks[task_id]
    if not tracker.result:
        return jsonify({'error': 'Data not ready yet'}), 400

    try:
        if format.lower() == 'json':
            return export_json(tracker.result, task_id)
        elif format.lower() == 'csv':
            return export_csv(tracker.result, task_id)
        else:
            return jsonify({'error': 'Unsupported format'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def export_json(result, task_id):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"nasa_weather_analysis_{task_id[:8]}_{timestamp}.json"

    export_data = {
        'metadata': {
            'export_time': datetime.now().isoformat(),
            'task_id': task_id,
            'date_range': result['date_range'],
            'coordinates': result['coordinates'],
            'total_points': result['total_points']
        },
        'statistics': result['statistics'],
        'risk_analysis': result['risk_analysis'],
        'raw_data': result['all_data']
    }

    temp_path = f"temp_{filename}"
    with open(temp_path, 'w') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)

    def remove_file(response):
        try:
            os.remove(temp_path)
        except:
            pass
        return response

    response = send_file(temp_path, as_attachment=True, download_name=filename)
    response.call_on_close(lambda: remove_file(response))
    return response

def export_csv(result, task_id):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"nasa_weather_data_{task_id[:8]}_{timestamp}.csv"

    temp_path = f"temp_{filename}"

    with open(temp_path, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['date', 'latitude', 'longitude', 'temperature', 'wind_speed', 'precipitation', 'humidity']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        for point in result['all_data']:
            writer.writerow({
                'date': point['date'],
                'latitude': point['lat'],
                'longitude': point['lon'],
                'temperature': point['temperature'],
                'wind_speed': point['wind_speed'],
                'precipitation': point['precipitation'],
                'humidity': point['humidity']
            })

    def remove_file(response):
        try:
            os.remove(temp_path)
        except:
            pass
        return response

    response = send_file(temp_path, as_attachment=True, download_name=filename)
    response.call_on_close(lambda: remove_file(response))
    return response

if __name__ == '__main__':
    print("🌍 NASA Weather Analysis Web Server Starting...")
    print("📱 Open http://localhost:5000 in your browser")
    app.run(debug=True, host='0.0.0.0', port=5000)
