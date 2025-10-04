# 🌍 NASA Weather Analysis Tool

Bu araç NASA POWER API'sından hava durumu verilerini çekerek kapsamlı analiz ve görselleştirme sağlar.

## 🚀 Özellikler

- ✅ **API Rate Limiting**: NASA POWER API limitlerini aşmaz
- 📊 **Progress Göstergesi**: Uzun işlemlerde ilerleme durumu
- 💾 **Memory Optimization**: Büyük veri setleri için optimize edilmiş
- 📈 **Grafik Oluşturma**: Matplotlib ile otomatik grafik üretimi
- 🌐 **Web Arayüzü**: Modern, responsive web interface
- 📱 **Real-time Updates**: Anlık işlem durumu takibi

## 🔧 Kurulum

### Otomatik Kurulum (Windows)
```batch
# start_web.bat dosyasını çift tıklayın
start_web.bat
```

### Manuel Kurulum
```bash
# Gerekli paketleri yükle
pip install -r requirements.txt

# Web server'ı başlat
python app.py
```

## 📱 Kullanım

### Web Arayüzü (Önerilen)
1. `start_web.bat` dosyasını çalıştırın
2. Tarayıcınızda `http://localhost:5000` adresini açın
3. Koordinatları ve tarih aralığını girin
4. "Analizi Başlat" butonuna tıklayın
5. Progress bar ile işlemi takip edin
6. Sonuçları ve grafikleri inceleyin

### Console Modu
```bash
python main.py
```

## 🌡️ API Parametreleri

Aracımız aşağıdaki hava durumu parametrelerini analiz eder:

- **T2M**: Yüzey sıcaklığı (°C)
- **WS10M**: 10m rüzgar hızı (m/s)  
- **PRECTOTCORR**: Düzeltilmiş yağış (mm)
- **RH2M**: 2m bağıl nem (%)

## 📊 Çıktılar

- **İstatistiksel Analiz**: Ortalama, minimum, maksimum değerler
- **Zaman Serisi Grafikleri**: Parametrelerin günlük değişimi
- **Karşılaştırmalı Grafikler**: Tüm parametrelerin istatistikleri
- **Coğrafi Kapkapsam**: Grid tabanlı alan analizi

## ⚙️ Yapılandırma

- **Grid Adımı**: 0.1° - 5.0° arası (varsayılan: 1.0°)
- **API Rate Limit**: 1.5 saniye/istek
- **Retry Mekanizması**: 3 deneme, exponential backoff
- **Memory Batch Size**: 100 nokta/batch

## 🔗 API Endpoints

- `GET /` - Ana sayfa
- `POST /api/analyze` - Analiz başlatma  
- `GET /api/progress/<task_id>` - İlerleme durumu
- `GET /api/chart/<filename>` - Grafik dosyası
- `DELETE /api/cleanup/<task_id>` - Task temizleme

## 📋 Gereksinimler

- Python 3.7+
- Internet bağlantısı (NASA POWER API için)
- 512MB+ RAM (büyük analizler için)

## 🐛 Sorun Giderme

### Yaygın Hatalar
- **API Timeout**: Grid adımını büyültün (>1.0°)
- **Memory Error**: Tarih aralığını kısaltın  
- **Connection Error**: İnternet bağlantınızı kontrol edin

### Performans İpuçları
- Küçük alanlar için grid adımını küçük tutun
- Uzun tarih aralıkları için büyük grid adımı kullanın
- Çok büyük analizlerde batch processing devreye girer

## 📈 Örnek Kullanım

```
Koordinatlar:
- Min Enlem: 39.0° (İstanbul)
- Max Enlem: 42.0° (Karadeniz)  
- Min Boylam: 26.0° (Çanakkale)
- Max Boylam: 45.0° (Doğu Anadolu)

Tarih Aralığı: 2024-01-01 - 2024-01-07
Grid Adımı: 1.0°

Sonuç: 36 veri noktası, ~30 saniye işlem süresi
```

## 🤝 Katkıda Bulunma

Bu proje NASA POWER API'sını kullanmaktadır. API kullanım koşullarına uygun şekilde kullanın.

## 📄 Lisans

Bu araç eğitim ve araştırma amaçlı geliştirilmiştir.