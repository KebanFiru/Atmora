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

The Apply Date button now displays an interactive heat map showing global population density!

### Features:
- 🌡️ **Color-Coded Visualization**: 
  - 🔵 **Blue**: Low population density (0–50 people/km²)
  - 🟢 **Green**: Medium density (50–150 people/km²)
  - 🟡 **Yellow**: High density (150–500 people/km²)
  - 🔴 **Red**: Very high density (500+ people/km²)

- 📊 **Grid-Based Density**: Each point represents a grid cell
- 🗓️ **Date-Based Change**: See how population changes over time
- 🌍 **Global Coverage**: 2° × 2° grid covering the entire world

### How to Use:

1. **Select a date from the TimeScroller on the right**
2. **Click the "Apply Date" button**
3. **Wait for the “Loading heat map” message**
4. **View the color-coded population density map**
   - Zoom in to explore details
   - Select different dates to observe changes over time

### Technical Details:

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
- Gradient: Blue → Cyan → Green → Yellow → Red
- Radius: 25px, Blur: 35px
- Dynamic loading ve cleanup

### Data source:
- Simulated data based on real-world patterns
- Urban centers (İstanbul, New York, Tokyo, vb.) ile enhanced
- Geographic factors (latitude, coastal areas) considered 
