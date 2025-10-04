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

# Cache sistemi
cache_dir = "cache"
if not os.path.exists(cache_dir):
    os.makedirs(cache_dir)

cache_lock = threading.Lock()

def get_cache_key(lat, lon, date_str):
    """Cache anahtarı oluştur"""
    key_string = f"{lat}_{lon}_{date_str}"
    return hashlib.md5(key_string.encode()).hexdigest()

def get_from_cache(cache_key):
    """Cache'den veri oku"""
    cache_file = os.path.join(cache_dir, f"{cache_key}.json")
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'r') as f:
                return json.load(f)
        except:
            return None
    return None

def save_to_cache(cache_key, data):
    """Cache'e veri kaydet"""
    cache_file = os.path.join(cache_dir, f"{cache_key}.json")
    try:
        with cache_lock:
            with open(cache_file, 'w') as f:
                json.dump(data, f)
    except:
        pass

# Thread-safe adaptive rate limiting
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
        """429 hatası aldığında rate limiting'i yavaşlat"""
        with self.lock:
            self.consecutive_429s += 1
            # Her 429'da daha yavaş yap
            self.calls_per_second = max(0.2, self.calls_per_second * 0.5)
            self.min_interval = 1.0 / self.calls_per_second
            print(f"⚠️ Rate limit düşürüldü: {self.calls_per_second:.2f} calls/sec")
    
    def report_success(self):
        """Başarılı çağrıda rate'i yavaşça artır"""
        with self.lock:
            self.last_success_time = time.time()
            if self.consecutive_429s > 0:
                self.consecutive_429s = max(0, self.consecutive_429s - 1)
                if self.consecutive_429s == 0:
                    # Yavaşça geri artır
                    self.calls_per_second = min(2.0, self.calls_per_second * 1.1)
                    self.min_interval = 1.0 / self.calls_per_second

# Global adaptive rate limiter
rate_limiter = AdaptiveRateLimiter(initial_calls_per_second=0.8)

def smart_retry(max_retries=5, base_delay=2):
    """429 hatalarına özel akıllı retry decorator"""
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
                        # 429 için özel bekleme süresi
                        wait_time = base_delay * (3 ** attempt) + (attempt * 2)
                        print(f"🔄 429 Hatası - Deneme {attempt + 1}/{max_retries}, {wait_time}s bekleniyor...")
                        time.sleep(wait_time)
                    else:
                        print(f"🔄 HTTP Hatası {e.response.status_code} - Deneme {attempt + 1}/{max_retries}")
                        time.sleep(base_delay * (2 ** attempt))
                    
                    if attempt == max_retries - 1:
                        raise e
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise e
                    print(f"🔄 Genel Hata - Deneme {attempt + 1}/{max_retries}: {e}")
                    time.sleep(base_delay * (2 ** attempt))
            return None
        return wrapper
    return decorator

def daterange(start_date, end_date):
    """Tarih aralığını gün gün döndürür"""
    for n in range(int((end_date - start_date).days) + 1):
        yield start_date + timedelta(n)

@smart_retry(max_retries=5, base_delay=3)
def get_point_data(lat, lon, date_str):
    """Tek nokta için NASA POWER point sorgusu - cache ve rate limiting ile"""
    # Cache kontrolü
    cache_key = get_cache_key(lat, lon, date_str)
    cached_data = get_from_cache(cache_key)
    if cached_data:
        return cached_data
    
    # Rate limiting
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
    
    # Verileri hazırla
    result = {
        "temperature": list(params_data["T2M"].values())[0],
        "wind_speed": list(params_data["WS10M"].values())[0],
        "precipitation": list(params_data["PRECTOTCORR"].values())[0],
        "humidity": list(params_data["RH2M"].values())[0],
        "lat": lat,
        "lon": lon,
        "date": date_str
    }
    
    # Cache'e kaydet
    save_to_cache(cache_key, result)
    return result

def fetch_data_parallel(coordinates_list, max_workers=2):
    """Konservatif paralel veri çekme (NASA API rate limits için)"""
    results = []
    failed_coords = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Future'ları hazırla
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
    """Memory efficient batch processing"""
    for i in range(0, len(data_points), batch_size):
        yield data_points[i:i + batch_size]

def calculate_statistics(all_data):
    """Memory efficient statistics calculation"""
    if not all_data:
        raise Exception("Hiç veri alınamadı.")
    
    # İlk parametreleri al
    keys = [k for k in all_data[0].keys() if k not in ['lat', 'lon', 'date']]
    
    # Memory efficient hesaplama
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
    """Weather risk thresholds based on NASA challenge requirements"""
    if not all_data:
        return {}
    
    # Threshold değerleri (extreme weather events)
    thresholds = {
        'very_hot': 32.2,      # 90°F = 32.2°C
        'very_cold': 0.0,      # 32°F = 0°C
        'very_windy': 15.0,    # 15 m/s (~33 mph)
        'very_wet': 10.0,      # 10mm yağış
        'very_humid': 85.0     # %85 nem (uncomfortable)
    }
    
    total_points = len(all_data)
    risks = {}
    
    # Very Hot Risk
    hot_count = sum(1 for d in all_data if d.get('temperature', 0) > thresholds['very_hot'])
    risks['very_hot'] = {
        'probability': (hot_count / total_points) * 100,
        'threshold': thresholds['very_hot'],
        'description': f"Sıcaklık {thresholds['very_hot']}°C üzerinde",
        'risk_level': 'high' if hot_count/total_points > 0.3 else 'medium' if hot_count/total_points > 0.1 else 'low'
    }
    
    # Very Cold Risk
    cold_count = sum(1 for d in all_data if d.get('temperature', 0) < thresholds['very_cold'])
    risks['very_cold'] = {
        'probability': (cold_count / total_points) * 100,
        'threshold': thresholds['very_cold'],
        'description': f"Sıcaklık {thresholds['very_cold']}°C altında",
        'risk_level': 'high' if cold_count/total_points > 0.3 else 'medium' if cold_count/total_points > 0.1 else 'low'
    }
    
    # Very Windy Risk
    windy_count = sum(1 for d in all_data if d.get('wind_speed', 0) > thresholds['very_windy'])
    risks['very_windy'] = {
        'probability': (windy_count / total_points) * 100,
        'threshold': thresholds['very_windy'],
        'description': f"Rüzgar hızı {thresholds['very_windy']} m/s üzerinde",
        'risk_level': 'high' if windy_count/total_points > 0.3 else 'medium' if windy_count/total_points > 0.1 else 'low'
    }
    
    # Very Wet Risk
    wet_count = sum(1 for d in all_data if d.get('precipitation', 0) > thresholds['very_wet'])
    risks['very_wet'] = {
        'probability': (wet_count / total_points) * 100,
        'threshold': thresholds['very_wet'],
        'description': f"Yağış {thresholds['very_wet']} mm üzerinde",
        'risk_level': 'high' if wet_count/total_points > 0.3 else 'medium' if wet_count/total_points > 0.1 else 'low'
    }
    
    # Very Humid Risk (uncomfortable)
    humid_count = sum(1 for d in all_data if d.get('humidity', 0) > thresholds['very_humid'])
    risks['very_uncomfortable'] = {
        'probability': (humid_count / total_points) * 100,
        'threshold': thresholds['very_humid'],
        'description': f"Nem oranı %{thresholds['very_humid']} üzerinde",
        'risk_level': 'high' if humid_count/total_points > 0.3 else 'medium' if humid_count/total_points > 0.1 else 'low'
    }
    
    # Overall risk assessment
    high_risk_count = sum(1 for risk in risks.values() if risk['risk_level'] == 'high')
    risks['overall_assessment'] = {
        'risk_level': 'high' if high_risk_count >= 2 else 'medium' if high_risk_count == 1 else 'low',
        'recommendation': get_risk_recommendation(risks)
    }
    
    return risks

def get_risk_recommendation(risks):
    """Generate recommendation based on risk analysis"""
    high_risks = [name for name, data in risks.items() if data.get('risk_level') == 'high']
    
    if not high_risks:
        return "✅ Hava koşulları outdoor aktiviteler için uygun görünüyor."
    
    recommendations = {
        'very_hot': "🌡️ Aşırı sıcak olabilir. Bol su için ve gölgelik alanları tercih edin.",
        'very_cold': "🥶 Çok soğuk olabilir. Sıcak giyinin ve soğuk hava ekipmanları getirin.",
        'very_windy': "💨 Çok rüzgarlı olabilir. Açık alanda aktivite planlarınızı gözden geçirin.",
        'very_wet': "🌧️ Yağışlı olabilir. Su geçirmez ekipman ve kapalı alan alternatifleri hazırlayın.",
        'very_uncomfortable': "💧 Nem oranı yüksek olabilir. Ferahlatıcı içecekler ve serin ortam tercih edin."
    }
    
    advice = "⚠️ Risk faktörleri: " + ", ".join([recommendations.get(risk, risk) for risk in high_risks])
    return advice

def get_area_average(lat_min, lat_max, lon_min, lon_max, start_date_str, end_date_str, step=1.0, progress_callback=None):
    """
    Alan ve tarih aralığı için ortalama/min/max hesaplar - optimized version
    step: alan grid adımı (°)
    progress_callback: ilerleme durumu için callback fonksiyonu
    """
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
    end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
    
    lat_points = [lat_min + i*step for i in range(int((lat_max - lat_min)/step) + 1)]
    lon_points = [lon_min + i*step for i in range(int((lon_max - lon_min)/step) + 1)]
    
    # Tüm koordinat-tarih kombinasyonlarını hazırla
    coordinates_list = []
    for single_date in daterange(start_date, end_date):
        date_str = single_date.strftime("%Y-%m-%d")
        for lat in lat_points:
            for lon in lon_points:
                coordinates_list.append((lat, lon, date_str))
    
    total_operations = len(coordinates_list)
    print(f"📊 Toplam {total_operations} veri noktası işlenecek...")
    print("🚀 Paralel işleme başlıyor...")
    
    # Konservatif paralel işlem için küçük batch'lere ayır
    batch_size = 20  # Her batch'te 20 koordinat (NASA API'ye nazik olalım)
    all_data = []
    processed = 0
    
    # Progress bar
    with tqdm(total=total_operations, desc="🌍 Konservatif veri toplama", unit="nokta") as pbar:
        for i in range(0, len(coordinates_list), batch_size):
            batch = coordinates_list[i:i + batch_size]
            
            # Bu batch'i paralel olarak işle (sadece 2 thread)
            batch_results, failed_coords = fetch_data_parallel(batch, max_workers=2)
            
            all_data.extend(batch_results)
            processed += len(batch)
            pbar.update(len(batch))
            
            # Progress callback
            if progress_callback:
                progress_callback(processed, total_operations)
            
            # Başarısız olanları logla
            if failed_coords:
                for coord, error in failed_coords:
                    print(f"⚠️ Hata: {error} at {coord[0]:.2f},{coord[1]:.2f} on {coord[2]}")
            
            # NASA API'ye saygı: batch'ler arası daha uzun bekleme
            if i + batch_size < len(coordinates_list):
                wait_time = 3 + (rate_limiter.consecutive_429s * 2)  # 429'lar arttıkça daha uzun bekle
                print(f"⏳ Batch arası {wait_time}s bekleme...")
                time.sleep(wait_time)
    
    # İstatistikleri hesapla
    print("📈 İstatistikler hesaplanıyor...")
    stats = calculate_statistics(all_data)
    
    # Risk analizi ekle
    risk_analysis = calculate_weather_risks(all_data)
    
    return {
        "statistics": stats,
        "risk_analysis": risk_analysis,
        "raw_data": all_data[:100],  # Sadece ilk 100 veri noktasını döndür
        "total_points": len(all_data),
        "date_range": f"{start_date_str} - {end_date_str}",
        "coordinates": f"({lat_min},{lon_min}) - ({lat_max},{lon_max})",
        "all_data": all_data,  # Grafik için tüm veri
        "cache_hits": sum(1 for coord in coordinates_list if get_from_cache(get_cache_key(*coord))),
        "processing_time": time.time()
    }

def create_weather_charts(data, output_dir="charts"):
    """Hava durumu verilerini grafikleştirir"""
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Verileri tarihe göre grupla
    date_data = defaultdict(list)
    for point in data['all_data']:
        date_data[point['date']].append(point)
    
    # Günlük ortalamalar
    dates = []
    temp_avg = []
    wind_avg = []
    precip_avg = []
    humidity_avg = []
    
    for date_str in sorted(date_data.keys()):
        points = date_data[date_str]
        dates.append(datetime.strptime(date_str, "%Y-%m-%d"))
        
        # Günlük ortalamalar
        temp_avg.append(np.mean([p['temperature'] for p in points]))
        wind_avg.append(np.mean([p['wind_speed'] for p in points]))
        precip_avg.append(np.mean([p['precipitation'] for p in points]))
        humidity_avg.append(np.mean([p['humidity'] for p in points]))
    
    # 4 subplot oluştur
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 10))
    fig.suptitle('🌍 NASA POWER Hava Durumu Analizi', fontsize=16, fontweight='bold')
    
    # Sıcaklık grafiği
    ax1.plot(dates, temp_avg, 'r-', linewidth=2, marker='o', markersize=4)
    ax1.set_title('🌡️ Sıcaklık (°C)')
    ax1.set_ylabel('Sıcaklık (°C)')
    ax1.grid(True, alpha=0.3)
    ax1.xaxis.set_major_formatter(mdates.DateFormatter('%m-%d'))
    
    # Rüzgar hızı grafiği
    ax2.plot(dates, wind_avg, 'b-', linewidth=2, marker='s', markersize=4)
    ax2.set_title('💨 Rüzgar Hızı (m/s)')
    ax2.set_ylabel('Rüzgar Hızı (m/s)')
    ax2.grid(True, alpha=0.3)
    ax2.xaxis.set_major_formatter(mdates.DateFormatter('%m-%d'))
    
    # Yağış grafiği
    ax3.bar(dates, precip_avg, color='skyblue', alpha=0.7, width=0.8)
    ax3.set_title('🌧️ Yağış (mm)')
    ax3.set_ylabel('Yağış (mm)')
    ax3.grid(True, alpha=0.3)
    ax3.xaxis.set_major_formatter(mdates.DateFormatter('%m-%d'))
    
    # Nem grafiği
    ax4.fill_between(dates, humidity_avg, alpha=0.5, color='green')
    ax4.plot(dates, humidity_avg, 'g-', linewidth=2)
    ax4.set_title('💧 Nem (%)')
    ax4.set_ylabel('Nem (%)')
    ax4.grid(True, alpha=0.3)
    ax4.xaxis.set_major_formatter(mdates.DateFormatter('%m-%d'))
    
    # Layout düzenle
    plt.tight_layout()
    
    # Grafiği kaydet
    chart_path = os.path.join(output_dir, 'weather_analysis.png')
    plt.savefig(chart_path, dpi=300, bbox_inches='tight')
    print(f"📊 Grafik kaydedildi: {chart_path}")
    
    # İstatistik grafiği
    fig2, ax = plt.subplots(figsize=(12, 8))
    stats = data['statistics']
    
    categories = list(stats.keys())
    averages = [stats[cat]['average'] for cat in categories]
    minimums = [stats[cat]['minimum'] for cat in categories]
    maximums = [stats[cat]['maximum'] for cat in categories]
    
    x = np.arange(len(categories))
    width = 0.25
    
    ax.bar(x - width, averages, width, label='Ortalama', alpha=0.8)
    ax.bar(x, minimums, width, label='Minimum', alpha=0.8)
    ax.bar(x + width, maximums, width, label='Maksimum', alpha=0.8)
    
    ax.set_xlabel('Parametreler')
    ax.set_ylabel('Değerler')
    ax.set_title('📈 Hava Durumu İstatistikleri')
    ax.set_xticks(x)
    ax.set_xticklabels(categories)
    ax.legend()
    ax.grid(True, alpha=0.3)
    
    stats_path = os.path.join(output_dir, 'weather_statistics.png')
    plt.savefig(stats_path, dpi=300, bbox_inches='tight')
    print(f"📈 İstatistik grafiği kaydedildi: {stats_path}")
    
    plt.show()  # Grafikleri göster
    
    return [chart_path, stats_path]

# --- Console Mode ---
def run_console_mode():
    """Console modunda çalıştır"""
    print("🌍 NASA Weather Risk Checker (Grid Area + Long Range) 🌍")
    print("📱 Web arayüzü için: python app.py")
    print("=" * 50)
    
    try:
        lat_min = float(input("Min enlem: "))
        lat_max = float(input("Max enlem: "))
        lon_min = float(input("Min boylam: "))
        lon_max = float(input("Max boylam: "))
        start_date = input("Başlangıç tarihi (YYYY-MM-DD): ")
        end_date = input("Bitiş tarihi (YYYY-MM-DD): ")
        step = float(input("Grid adımı (varsayılan 1.0): ") or "1.0")
        
        print("\n🚀 Analiz başlıyor...")
        result = get_area_average(lat_min, lat_max, lon_min, lon_max, start_date, end_date, step=step)
        
        print("\n" + "="*50)
        print("📊 SONUÇLAR")
        print("="*50)
        
        stats = result["statistics"]
        for param, data in stats.items():
            print(f"\n🌡️ {param.upper()}:")
            print(f"   Ortalama: {data['average']:.2f}")
            print(f"   Minimum:  {data['minimum']:.2f}")
            print(f"   Maksimum: {data['maximum']:.2f}")
        
        print(f"\n📈 Toplam veri noktası: {result['total_points']}")
        print(f"📅 Tarih aralığı: {result['date_range']}")
        print(f"🗺️ Koordinat aralığı: {result['coordinates']}")
        
        # Grafik sor
        create_charts = input("\n� Grafikler oluşturulsun mu? (e/h): ").lower().startswith('e')
        if create_charts:
            chart_paths = create_weather_charts(result)
            print(f"✅ Grafikler oluşturuldu: {chart_paths}")
        
    except KeyboardInterrupt:
        print("\n❌ İşlem iptal edildi.")
    except Exception as e:
        print(f"\n❌ Hata: {e}")

if __name__ == "__main__":
    run_console_mode()
