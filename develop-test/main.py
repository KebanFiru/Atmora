import requests
from datetime import datetime, timedelta
import time
from tqdm import tqdm
import json
import os
from functools import wraps
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import numpy as np
from collections import defaultdict
import concurrent.futures
import threading
from urllib.parse import urlencode
import hashlib

cache_dir = "cache"
if not os.path.exists(cache_dir):
    os.makedirs(cache_dir)

cache_lock = threading.Lock()

def get_cache_key(lat, lon, date_str):
    key_string = f"{lat}_{lon}_{date_str}"
    return hashlib.md5(key_string.encode()).hexdigest()

def get_from_cache(cache_key):
    cache_file = os.path.join(cache_dir, f"{cache_key}.json")
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'r') as f:
                return json.load(f)
        except:
            return None
    return None

def save_to_cache(cache_key, data):
    cache_file = os.path.join(cache_dir, f"{cache_key}.json")
    try:
        with cache_lock:
            with open(cache_file, 'w') as f:
                json.dump(data, f)
    except:
        pass

class AdaptiveRateLimiter:
    def __init__(self, initial_calls_per_second=1):
        self.calls_per_second = initial_calls_per_second
        self.min_interval = 1.0 / self.calls_per_second
        self.last_called = 0.0
        self.lock = threading.Lock()
        self.consecutive_429s = 0
        self.last_success_time = time.time()
    
    def wait_if_needed(self):
        with self.lock:
            elapsed = time.time() - self.last_called
            wait_time = self.min_interval - elapsed
            if wait_time > 0:
                time.sleep(wait_time)
            self.last_called = time.time()
    
    def report_429(self):
        with self.lock:
            self.consecutive_429s += 1
            self.calls_per_second = max(0.2, self.calls_per_second * 0.5)
            self.min_interval = 1.0 / self.calls_per_second
            print(f"⚠️ Rate limit decreased: {self.calls_per_second:.2f} calls/sec")
    
    def report_success(self):
        with self.lock:
            self.last_success_time = time.time()
            if self.consecutive_429s > 0:
                self.consecutive_429s = max(0, self.consecutive_429s - 1)
                if self.consecutive_429s == 0:
                    self.calls_per_second = min(2.0, self.calls_per_second * 1.1)
                    self.min_interval = 1.0 / self.calls_per_second

rate_limiter = AdaptiveRateLimiter(initial_calls_per_second=0.8)

def smart_retry(max_retries=5, base_delay=2):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    result = func(*args, **kwargs)
                    rate_limiter.report_success()
                    return result
                except requests.exceptions.HTTPError as e:
                    if e.response.status_code == 429:
                        rate_limiter.report_429()
                        wait_time = base_delay * (3 ** attempt) + (attempt * 2)
                        print(f"429 encountered {attempt + 1}/{max_retries}, waiting {wait_time}s...")
                        time.sleep(wait_time)
                    else:
                        print(f"HTTP error {e.response.status_code} - attempt {attempt + 1}/{max_retries}")
                        time.sleep(base_delay * (2 ** attempt))
                    
                    if attempt == max_retries - 1:
                        raise e
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise e
                    print(f"General error - attempt {attempt + 1}/{max_retries}: {e}")
                    time.sleep(base_delay * (2 ** attempt))
            return None
        return wrapper
    return decorator

def daterange(start_date, end_date):
    for n in range(int((end_date - start_date).days) + 1):
        yield start_date + timedelta(n)

@smart_retry(max_retries=5, base_delay=3)
def get_point_data(lat, lon, date_str):
    cache_key = get_cache_key(lat, lon, date_str)
    cached_data = get_from_cache(cache_key)
    if cached_data:
        return cached_data
    
    rate_limiter.wait_if_needed()
    
    date_api = datetime.strptime(date_str, "%Y-%m-%d").strftime("%Y%m%d")
    url = "https://power.larc.nasa.gov/api/temporal/daily/point"
    params = {
        "parameters": "T2M,WS10M,PRECTOTCORR,RH2M",
        "community": "RE",
        "longitude": lon,
        "latitude": lat,
        "start": date_api,
        "end": date_api,
        "format": "JSON"
    }
    
    response = requests.get(url, params=params, timeout=30)
    response.raise_for_status()
    data = response.json()
    params_data = data["properties"]["parameter"]
    
    result = {
        "temperature": list(params_data["T2M"].values())[0],
        "wind_speed": list(params_data["WS10M"].values())[0],
        "precipitation": list(params_data["PRECTOTCORR"].values())[0],
        "humidity": list(params_data["RH2M"].values())[0],
        "lat": lat,
        "lon": lon,
        "date": date_str
    }
    
    save_to_cache(cache_key, result)
    return result

def fetch_data_parallel(coordinates_list, max_workers=2):
    results = []
    failed_coords = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_coord = {
            executor.submit(get_point_data, coord[0], coord[1], coord[2]): coord 
            for coord in coordinates_list
        }
        
        for future in concurrent.futures.as_completed(future_to_coord):
            coord = future_to_coord[future]
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                failed_coords.append((coord, str(e)))
    
    return results, failed_coords

def process_data_batch(data_points, batch_size=100):
    for i in range(0, len(data_points), batch_size):
        yield data_points[i:i + batch_size]

def calculate_statistics(all_data):
    if not all_data:
        raise Exception("No data.")
    
    keys = [k for k in all_data[0].keys() if k not in ['lat', 'lon', 'date']]
    
    stats = {}
    for key in keys:
        values = [d[key] for d in all_data if key in d and d[key] is not None]
        if values:
            stats[key] = {
                'average': sum(values) / len(values),
                'minimum': min(values),
                'maximum': max(values),
                'count': len(values)
            }
    
    return stats

def calculate_weather_risks(all_data):
    if not all_data:
        return {}
    
    thresholds = {
        'very_hot': 32.2,
        'very_cold': 0.0,
        'very_windy': 15.0,
        'very_wet': 10.0,
        'very_humid': 85.0
    }
    
    total_points = len(all_data)
    risks = {}
    
    hot_count = sum(1 for d in all_data if d.get('temperature', 0) > thresholds['very_hot'])
    risks['very_hot'] = {
        'probability': (hot_count / total_points) * 100,
        'threshold': thresholds['very_hot'],
        'description': f"Temperature above {thresholds['very_hot']}°C",
        'risk_level': 'high' if hot_count/total_points > 0.3 else 'medium' if hot_count/total_points > 0.1 else 'low'
    }
    
    cold_count = sum(1 for d in all_data if d.get('temperature', 0) < thresholds['very_cold'])
    risks['very_cold'] = {
        'probability': (cold_count / total_points) * 100,
        'threshold': thresholds['very_cold'],
        'description': f"Temperature below {thresholds['very_cold']}°C",
        'risk_level': 'high' if cold_count/total_points > 0.3 else 'medium' if cold_count/total_points > 0.1 else 'low'
    }
    
    windy_count = sum(1 for d in all_data if d.get('wind_speed', 0) > thresholds['very_windy'])
    risks['very_windy'] = {
        'probability': (windy_count / total_points) * 100,
        'threshold': thresholds['very_windy'],
        'description': f"Wind speed above {thresholds['very_windy']} m/s",
        'risk_level': 'high' if windy_count/total_points > 0.3 else 'medium' if windy_count/total_points > 0.1 else 'low'
    }
    
    wet_count = sum(1 for d in all_data if d.get('precipitation', 0) > thresholds['very_wet'])
    risks['very_wet'] = {
        'probability': (wet_count / total_points) * 100,
        'threshold': thresholds['very_wet'],
        'description': f"Precipitation above {thresholds['very_wet']} mm",
        'risk_level': 'high' if wet_count/total_points > 0.3 else 'medium' if wet_count/total_points > 0.1 else 'low'
    }
    
    humid_count = sum(1 for d in all_data if d.get('humidity', 0) > thresholds['very_humid'])
    risks['very_uncomfortable'] = {
        'probability': (humid_count / total_points) * 100,
        'threshold': thresholds['very_humid'],
        'description': f"Humidity above {thresholds['very_humid']}%",
        'risk_level': 'high' if humid_count/total_points > 0.3 else 'medium' if humid_count/total_points > 0.1 else 'low'
    }
    
    high_risk_count = sum(1 for risk in risks.values() if risk['risk_level'] == 'high')
    risks['overall_assessment'] = {
        'risk_level': 'high' if high_risk_count >= 2 else 'medium' if high_risk_count == 1 else 'low',
        'recommendation': get_risk_recommendation(risks)
    }
    
    return risks

def get_risk_recommendation(risks):
    high_risks = [name for name, data in risks.items() if data.get('risk_level') == 'high']
    
    if not high_risks:
        return "✅ Weather conditions look suitable for outdoor activities."
    
    recommendations = {
        'very_hot': "🌡️ It may be extremely hot. Drink plenty of water and stay in shaded areas.",
        'very_cold': "🥶 It may be very cold. Dress warmly and bring cold-weather gear.",
        'very_windy': "💨 It may be very windy. Reconsider your outdoor activity plans.",
        'very_wet': "🌧️ It may be rainy. Prepare waterproof gear and indoor alternatives.",
        'very_uncomfortable': "💧 The humidity may be high. Choose refreshing drinks and cool environments."
    }
    
    advice = "⚠️ Risk factors: " + ", ".join([recommendations.get(risk, risk) for risk in high_risks])
    return advice

def get_area_average(lat_min, lat_max, lon_min, lon_max, start_date_str, end_date_str, step=1.0, progress_callback=None):
    
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
    end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
    
    lat_points = [lat_min + i*step for i in range(int((lat_max - lat_min)/step) + 1)]
    lon_points = [lon_min + i*step for i in range(int((lon_max - lon_min)/step) + 1)]
    
    coordinates_list = []
    for single_date in daterange(start_date, end_date):
        date_str = single_date.strftime("%Y-%m-%d")
        for lat in lat_points:
            for lon in lon_points:
                coordinates_list.append((lat, lon, date_str))
    
    total_operations = len(coordinates_list)
    print(f"📊 Total {total_operations} data points will be processed...")
    print("🚀 Starting parallel processing...")
    
    batch_size = 20
    all_data = []
    processed = 0
    
    with tqdm(total=total_operations, desc="🌍 Conservative data collection", unit="point") as pbar:
        for i in range(0, len(coordinates_list), batch_size):
            batch = coordinates_list[i:i + batch_size]
            
            batch_results, failed_coords = fetch_data_parallel(batch, max_workers=2)
            
            all_data.extend(batch_results)
            processed += len(batch)
            pbar.update(len(batch))
            
            if progress_callback:
                progress_callback(processed, total_operations)
            
            if failed_coords:
                for coord, error in failed_coords:
                    print(f"⚠️ Error: {error} at {coord[0]:.2f},{coord[1]:.2f} on {coord[2]}")
            
            if i + batch_size < len(coordinates_list):
                wait_time = 3 + (rate_limiter.consecutive_429s * 2)
                print(f"⏳ Waiting {wait_time}s between batches...")
                time.sleep(wait_time)
    
    print("📈 Calculating statistics...")
    stats = calculate_statistics(all_data)
    
    risk_analysis = calculate_weather_risks(all_data)
    
    return {
        "statistics": stats,
        "risk_analysis": risk_analysis,
        "raw_data": all_data[:100],
        "total_points": len(all_data),
        "date_range": f"{start_date_str} - {end_date_str}",
        "coordinates": f"({lat_min},{lon_min}) - ({lat_max},{lon_max})",
        "all_data": all_data,
        "cache_hits": sum(1 for coord in coordinates_list if get_from_cache(get_cache_key(*coord))),
        "processing_time": time.time()
    }

def create_weather_charts(data, output_dir="charts"):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    date_data = defaultdict(list)
    for point in data['all_data']:
        date_data[point['date']].append(point)
    
    dates = []
    temp_avg = []
    wind_avg = []
    precip_avg = []
    humidity_avg = []
    
    for date_str in sorted(date_data.keys()):
        points = date_data[date_str]
        dates.append(datetime.strptime(date_str, "%Y-%m-%d"))
        
        temp_avg.append(np.mean([p['temperature'] for p in points]))
        wind_avg.append(np.mean([p['wind_speed'] for p in points]))
        precip_avg.append(np.mean([p['precipitation'] for p in points]))
        humidity_avg.append(np.mean([p['humidity'] for p in points]))
    
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 10))
    fig.suptitle('🌍 NASA POWER Weather Analysis', fontsize=16, fontweight='bold')
    
    ax1.plot(dates, temp_avg, linewidth=2, marker='o', markersize=4)
    ax1.set_title('🌡️ Temperature (°C)')
    ax1.set_ylabel('Temperature (°C)')
    ax1.grid(True, alpha=0.3)
    ax1.xaxis.set_major_formatter(mdates.DateFormatter('%m-%d'))
    
    ax2.plot(dates, wind_avg, linewidth=2, marker='s', markersize=4)
    ax2.set_title('💨 Wind Speed (m/s)')
    ax2.set_ylabel('Wind Speed (m/s)')
    ax2.grid(True, alpha=0.3)
    ax2.xaxis.set_major_formatter(mdates.DateFormatter('%m-%d'))
    
    ax3.bar(dates, precip_avg, alpha=0.7, width=0.8)
    ax3.set_title('🌧️ Precipitation (mm)')
    ax3.set_ylabel('Precipitation (mm)')
    ax3.grid(True, alpha=0.3)
    ax3.xaxis.set_major_formatter(mdates.DateFormatter('%m-%d'))
    
    ax4.fill_between(dates, humidity_avg, alpha=0.5)
    ax4.plot(dates, humidity_avg, linewidth=2)
    ax4.set_title('💧 Humidity (%)')
    ax4.set_ylabel('Humidity (%)')
    ax4.grid(True, alpha=0.3)
    ax4.xaxis.set_major_formatter(mdates.DateFormatter('%m-%d'))
    
    plt.tight_layout()
    
    chart_path = os.path.join(output_dir, 'weather_analysis.png')
    plt.savefig(chart_path, dpi=300, bbox_inches='tight')
    print(f"📊 Chart saved: {chart_path}")
    
    fig2, ax = plt.subplots(figsize=(12, 8))
    stats = data['statistics']
    
    categories = list(stats.keys())
    averages = [stats[cat]['average'] for cat in categories]
    minimums = [stats[cat]['minimum'] for cat in categories]
    maximums = [stats[cat]['maximum'] for cat in categories]
    
    x = np.arange(len(categories))
    width = 0.25
    
    ax.bar(x - width, averages, width, label='Average', alpha=0.8)
    ax.bar(x, minimums, width, label='Minimum', alpha=0.8)
    ax.bar(x + width, maximums, width, label='Maximum', alpha=0.8)
    
    ax.set_xlabel('Parameters')
    ax.set_ylabel('Values')
    ax.set_title('📈 Weather Statistics')
    ax.set_xticks(x)
    ax.set_xticklabels(categories)
    ax.legend()
    ax.grid(True, alpha=0.3)
    
    stats_path = os.path.join(output_dir, 'weather_statistics.png')
    plt.savefig(stats_path, dpi=300, bbox_inches='tight')
    print(f"📈 Statistics chart saved: {stats_path}")
    
    plt.show()
    
    return [chart_path, stats_path]

def run_console_mode():
    print("🌍 NASA Weather Risk Checker (Grid Area + Long Range) 🌍")
    print("📱 For web interface: python app.py")
    print("=" * 50)
    
    try:
        lat_min = float(input("Min latitude: "))
        lat_max = float(input("Max latitude: "))
        lon_min = float(input("Min longitude: "))
        lon_max = float(input("Max longitude: "))
        start_date = input("Start date (YYYY-MM-DD): ")
        end_date = input("End date (YYYY-MM-DD): ")
        step = float(input("Grid step (default 1.0): ") or "1.0")
        
        print("\n🚀 Analysis starting...")
        result = get_area_average(lat_min, lat_max, lon_min, lon_max, start_date, end_date, step=step)
        
        print("\n" + "="*50)
        print("📊 RESULTS")
        print("="*50)
        
        stats = result["statistics"]
        for param, data in stats.items():
            print(f"\n🌡️ {param.upper()}:")
            print(f"   Average: {data['average']:.2f}")
            print(f"   Minimum:  {data['minimum']:.2f}")
            print(f"   Maximum: {data['maximum']:.2f}")
        
        print(f"\n📈 Total data points: {result['total_points']}")
        print(f"📅 Date range: {result['date_range']}")
        print(f"🗺️ Coordinate range: {result['coordinates']}")
        
        create_charts = input("\nCreate charts? (y/n): ").lower().startswith('y')
        if create_charts:
            chart_paths = create_weather_charts(result)
            print(f"Graphs have been created: {chart_paths}")
        
    except KeyboardInterrupt:
        print("\n❌ Interrupted.")
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    run_console_mode()
