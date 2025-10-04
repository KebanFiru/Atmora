# Atmora - NASA Weather Dashboard

A futuristic, minimal weather analysis dashboard built for the NASA Space Apps Challenge. The application provides personalized weather insights using NASA Earth observation data to help users plan outdoor activities.

## Features

### 🗺️ Interactive Map Interface
- Full-screen interactive map with drawing tools
- Point, circle, rectangle, and polygon selection modes
- Day/night mode toggle
- Zoom controls

### 🌤️ Weather Analysis
- Real-time weather data from NASA POWER API
- Analysis of extreme weather conditions:
  - Very hot days
  - Very cold days
  - Very windy conditions
  - Very wet periods
  - Uncomfortable weather combinations
- Customizable thresholds for weather conditions
- Interactive charts and visualizations
- Data export functionality (CSV format)

### 🌍 Climate Overview
- Long-term climate pattern analysis
- Educational content about climate change
- Regional climate data visualization
- Monthly averages and trends

### ⏰ Time Selection
- Innovative vertical scrollbar for date selection
- Lock mechanism design for precise date picking
- Real-time date updates with confirmation system

## Technology Stack

- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS v4
- **Maps**: ArcGIS JavaScript API (@arcgis/core)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Data Source**: NASA POWER API

## Getting Started

### Prerequisites
- Node.js (Latest LTS version)
- pnpm package manager

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### 1. Location Selection
- Use the bottom toolbar to select your preferred drawing tool:
  - **Point**: Click anywhere on the map to select a specific location
  - **Circle**: Draw a circular area for regional analysis
  - **Rectangle**: Select rectangular regions
  - **Polygon**: Create custom shaped areas

### 2. Weather Analysis
- Click the "Weather" button in the top center
- Set your analysis parameters:
  - Date range for analysis
  - Weather condition thresholds
- Click "Analyze Weather Patterns" to fetch NASA data
- View results including probability percentages and interactive charts
- Download data as CSV for further analysis

### 3. Climate Overview
- Click the "Climate" button to access educational content
- View regional climate data and trends
- Understand long-term climate patterns

### 4. Time Navigation
- Use the right-side vertical scroller to change dates
- Drag or scroll to navigate through time
- Click "Onayla" (Confirm) to apply selected date

## NASA POWER API Integration

The application integrates with NASA's POWER (Prediction Of Worldwide Energy Resources) API to fetch:

- **T2M**: Temperature at 2 meters (°C)
- **WS10M**: Wind speed at 10 meters (m/s)
- **PRECTOT**: Total precipitation (mm/day)
- **HUMIDITY**: Relative Humidity (%)

Data is available globally with daily resolution from 1981 to near real-time.

## Design Philosophy

The application follows a **futuristic minimal design** approach:

- **Glassmorphism effects**: Semi-transparent components with backdrop blur
- **Rounded corners**: Soft, modern appearance
- **Intuitive interactions**: Clear visual feedback for all user actions
- **Responsive layout**: Works seamlessly on all device sizes
- **Accessible design**: High contrast ratios and clear typography

---

**Developed for NASA Space Apps Challenge 2025**
*Making weather data accessible for outdoor activity planning*
