# Atmora
NASA Space Apps Challenge - Weather Analysis & Population Estimation Platform

## 🌍 Project Overview

Atmora is a comprehensive full-stack web application that integrates NASA Earth observation data to provide:
- **Weather Analysis**: Historical weather data analysis using NASA POWER API
- **Weather Prediction**: Machine learning-based weather forecasting
- **Population Estimation**: Geographic population analysis for selected areas

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
