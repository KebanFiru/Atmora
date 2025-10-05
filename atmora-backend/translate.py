import os
import re

translations = {
    'Cache anahtarı oluştur': 'Generate cache key',
    "Cache'den veri oku - Memory cache ile optimize edilmiş": 'Read data from cache - Optimized with memory cache',
    '429 hatası aldığında rate limiting''i yavaşlat': 'Slow down rate limiting when receiving 429 error',
    'Başarılı çağrıda rate''i yavaşça artır': 'Slowly increase rate on successful calls',
    'Rate limit düşürüldü': 'Rate limit reduced',
    'başlıyor': 'starting',
    'Enlem -90 ile 90 arasında olmalıdır': 'Latitude must be between -90 and 90',
    'Boylam -180 ile 180 arasında olmalıdır': 'Longitude must be between -180 and 180',
    'Geçersiz koordinat değerleri': 'Invalid coordinate values',
    'Hedef tarih 2025-01-01 veya sonrası olmalıdır (eğitim verisi 2024-12-31''de bitiyor)': 'Target date must be 2025-01-01 or later (training data ends at 2024-12-31)',
    'Hedef tarih en fazla 2025-12-31 olabilir (makul doğruluk için)': 'Target date cannot exceed 2025-12-31 (for reasonable accuracy)',
    'Geçersiz tarih formatı. YYYY-MM-DD formatını kullanın': 'Invalid date format. Use YYYY-MM-DD',
    'Beklenmeyen hata': 'Unexpected error',
    'başladı': 'started',
    'Hava durumu tahmini başlatıldı': 'Weather prediction initiated',
    "NASA POWER API'den 10 yıllık veri çekiliyor...": 'Fetching 10 years of data from NASA POWER API...',
    'Akdeniz iklimi verisi yükleniyor (4 yıllık)': 'Loading Mediterranean climate data (4 years)',
    'Sonuçlar hazırlanıyor': 'Preparing results',
    'tamamlandı': 'completed',
    'hata': 'error',
    'çok sıcak': 'very hot',
    'ılık': 'warm',
    'serin': 'cool',
    'soğuk': 'cold',
    'çok rüzgarlı': 'very windy',
    'rüzgarlı': 'windy',
    'sakin': 'calm',
    'yağmurlu': 'rainy',
    'hafif yağışlı': 'light rain',
    'kuru': 'dry',
    'Yüksek doğruluk - Tahmin güvenilir': 'High accuracy - Prediction is reliable',
    'Orta doğruluk - Tahmin referans amaçlıdır': 'Medium accuracy - Prediction is for reference',
    'Düşük doğruluk - Tahmin çok belirsiz, sadece genel fikir verir': 'Low accuracy - Prediction is very uncertain, general idea only',
    'Task bulunamadı': 'Task not found',
    'temizlendi': 'cleaned',
    'Latitude ve longitude gerekli': 'Latitude and longitude are required'
}

def translate_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    for turkish, english in translations.items():
        content = content.replace(turkish, english)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Translated: {filepath}")
    
def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        if 'venv' in root or '__pycache__' in root:
            continue
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                try:
                    translate_file(filepath)
                except Exception as e:
                    print(f"Error: {filepath}: {e}")

if __name__ == '__main__':
    process_directory('app')
    print("Translation completed!")
