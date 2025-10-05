# Atmora Weather Backend

A Flask-based backend service that integrates with NASA POWER API to provide weather analysis for the Atmora frontend application.

## Features

 **NASA Earth Observation Data Integration**
- Real-time weather data from NASA POWER API
- Temperature, wind speed, precipitation, humidity analysis
- Intelligent caching system for improved performance

 **Advanced Weather Analysis**
- Risk assessment for extreme weather conditions
- Statistical analysis with min/max/average calculations
- User-friendly weather summaries and recommendations

 **Data Visualization**
- Automatic chart generation using matplotlib
- Weather trend analysis with time series plots
- Statistical charts for comprehensive overview

 **Data Export**
- CSV export for spreadsheet analysis
- JSON export for programmatic use
- Downloadable analysis reports

 **Performance Optimizations**
- Adaptive rate limiting for NASA API
- Intelligent caching system
- Background processing with progress tracking

## Quick Start

### 1. Install Dependencies

```bash
cd atmora-backend
pip install -r requirements.txt
```

### 2. Test the Backend

```bash
python test_backend.py
```

This will:
- Test NASA API connectivity
- Verify Flask app creation
- Optionally start a test server

### 3. Run the Backend Server

```bash
python run.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /api/health
```

### Start Weather Analysis
```
POST /api/weather/analyze
Content-Type: application/json

{
    "latitude": 41.0082,
    "longitude": 28.9784,
    "startDate": "2025-01-01",
    "endDate": "2025-12-31"
}
```

Returns:
```json
{
    "task_id": "uuid-string",
    "status": "başladı",
    "message": "Hava durumu analizi başlatıldı"
}
```

### Check Analysis Progress
```
GET /api/weather/progress/{task_id}
```

Returns:
```json
{
    "task_id": "uuid-string",
    "progress": 150,
    "total": 365,
    "status": "150/365 tamamlandı",
    "percentage": 41.1,
    "elapsed_time": 45,
    "completed": false
}
```

When completed, also includes:
- `summary`: User-friendly weather analysis summary
- `charts`: Base64-encoded weather charts
- `risk_analysis`: Detailed risk assessment
- `statistics`: Statistical analysis results

### Export Data
```
GET /api/weather/export/{task_id}/{format}
```

Where `format` is either `csv` or `json`.

### Cleanup Task
```
DELETE /api/weather/cleanup/{task_id}
```

## Frontend Integration

The backend is designed to work with the Atmora Next.js frontend. The frontend WeatherForm component has been updated to:

1. **Start Analysis**: Send location and date range to backend
2. **Track Progress**: Poll for analysis progress with real-time updates
3. **Display Results**: Show weather analysis with charts and risk assessment
4. **Export Data**: Download analysis results in CSV or JSON format

### Frontend Setup

1. Install the updated WeatherForm component
2. The `weather-api.ts` utility provides TypeScript interfaces and API methods
3. Start your Next.js development server: `npm run dev`

## Weather Analysis Features

### Risk Assessment
The system analyzes weather data for extreme conditions:

- **Very Hot**: Temperature > 32.2°C (90°F)
- **Very Cold**: Temperature < 0°C (32°F)  
- **Very Windy**: Wind speed > 15 m/s (33 mph)
- **Very Wet**: Precipitation > 10mm
- **Very Humid**: Humidity > 85%

### User-Friendly Summaries
- Weather highlights with average conditions
- Risk percentages for extreme weather events
- Overall risk level (low/medium/high)
- Personalized recommendations for outdoor activities

### Data Visualization
- Time series plots for all weather parameters
- Statistical comparison charts
- Base64-encoded images for web display

## Cache System

The backend implements an intelligent caching system:

- **Location**: `cache/` directory
- **Format**: JSON files with MD5-hashed filenames
- **Benefits**: Reduces NASA API calls, improves response times
- **Thread-safe**: Multiple requests can use cache simultaneously

## Error Handling

The system includes comprehensive error handling:

- NASA API rate limiting with adaptive backoff
- Validation for coordinates and date ranges
- Graceful degradation for network issues
- User-friendly error messages

## Development Notes

### NASA API Limits
- The system respects NASA POWER API rate limits
- Adaptive rate limiting automatically adjusts request frequency
- Cache system reduces API calls for repeated requests

### Performance Considerations
- Maximum 1 year date range per analysis
- Background processing prevents UI blocking
- Efficient batch processing for large date ranges

### Production Deployment
- Set `FLASK_DEBUG=False` in production
- Use a proper WSGI server (gunicorn, uWSGI)
- Configure proper CORS origins for your domain
- Consider implementing authentication for public deployments

## Troubleshooting

### Common Issues

1. **NASA API Connection Issues**
   - Check internet connectivity
   - Verify coordinates are within valid ranges
   - Ensure date format is YYYY-MM-DD

2. **Import Errors**
   - Ensure all dependencies are installed: `pip install -r requirements.txt`
   - Check Python path and virtual environment

3. **Frontend Connection Issues**
   - Verify backend is running on port 5000
   - Check CORS configuration in `app/__init__.py`
   - Ensure frontend is making requests to correct URL

### Debug Mode

Run with debug mode for detailed error information:
```bash
export FLASK_DEBUG=True
python run.py
```

## License

This project integrates with NASA POWER API data, which is freely available for research and application development.
