# Atmora
NASA Space Apps Challenge - Weather Analysis & Population Estimation Platform

## 🌍 Project Overview

Atmora is a comprehensive full-stack web application that integrates NASA Earth observation data to provide:
- **Weather Analysis**: Historical weather data analysis using NASA POWER API
- **Weather Prediction**: Machine learning-based weather forecasting
- **Population Estimation**: Geographic population analysis for selected areas
- **🔥 Global Population Heat Map**: Interactive visualization of worldwide population density over time

## ✨ New Feature: Population Analysis

### How to Use Population Analysis:

1. **Select an Area**: Use one of the drawing tools (Circle, Square, or Rectangle) on the map
   - ⚠️ **Note**: Single marker selection is NOT supported for population analysis
   - You must select an area using Circle, Square, or Rectangle tool

2. **Choose Date**: Use the vertical date slider on the right side of the screen

3. **Click "Bring Population"**: The button will be enabled only when a valid area is selected

4. **View Results**: Population data will be displayed in a modal showing:
   - Total population
   - Area size (km²)
   - Population density (people/km²)
   - Geographic details

### Supported Geometry Types:
- ⭕ **Circle**: Define center and radius
- ⬜ **Square/Pentagon**: Multi-point polygon selection
- 📐 **Rectangle**: Two-corner selection

### API Integration:
- Backend: `/api/population/analyze`
- Data Source: NASA Harmony API (with intelligent fallback to simulated data)
- Analysis: Real-world population density patterns based on geographic location

---

## 🔥 NEW: Global Population Heat Map

### Interactive World Population Visualization

**Apply Date** butonu artık dünya genelindeki popülasyon yoğunluğunu interaktif heat map olarak görselleştirir!

### Özellikler:
- 🌡️ **Renk Kodlu Görselleştirme**: 
  - 🔵 **Mavi**: Düşük popülasyon yoğunluğu (0-50 kişi/km²)
  - 🟢 **Yeşil**: Orta yoğunluk (50-150 kişi/km²)
  - 🟡 **Sarı**: Yüksek yoğunluk (150-500 kişi/km²)
  - 🔴 **Kırmızı**: Çok yüksek yoğunluk (500+ kişi/km²)

- 📊 **Nokta Bazlı Yoğunluk**: Her nokta bir grid hücresini temsil eder
- 🗓️ **Tarih Bazlı Değişim**: Tarih değiştirerek popülasyon değişimini görebilirsiniz
- 🌍 **Global Kapsam**: Tüm dünya genelinde 2° × 2° grid

### Nasıl Kullanılır:

1. **Sağdaki TimeScroller'da tarih seçin**
2. **"Apply Date" butonuna tıklayın**
3. **Heat map yükleniyor mesajını bekleyin**
4. **Haritada renk kodlu popülasyon yoğunluğunu görüntüleyin**
   - Zoom yaparak detaylara bakabilirsiniz
   - Farklı tarihler seçerek değişimi gözlemleyebilirsiniz

### Teknik Detaylar:

**Backend:**
- Endpoint: `POST /api/population/density`
- Request:
```json
{
  "date": "2024-06-15",
  "resolution": 2.0
}
```
- Response: Grid-based population density data points

**Frontend:**
- **leaflet.heat** plugin ile render
- Gradient: Mavi → Cyan → Yeşil → Sarı → Kırmızı
- Radius: 25px, Blur: 35px
- Dynamic loading ve cleanup

### Veri Kaynağı:
- Simulated data based on real-world patterns
- Urban centers (İstanbul, New York, Tokyo, vb.) ile enhanced
- Geographic factors (latitude, coastal areas) considered 
