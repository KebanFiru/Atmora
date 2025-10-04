#!/usr/bin/env python3
"""
Test script for Atmora Weather Backend
Run this to test basic functionality before connecting to frontend
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app import create_app
from app.services.nasa_weather_service import get_point_data_for_period
import threading
import time

def test_basic_functionality():
    """Test basic NASA API functionality"""
    print("🧪 Testing NASA API Integration...")
    
    try:
        # Test with a small date range
        print("📊 Testing weather data retrieval for Istanbul...")
        result = get_point_data_for_period(
            latitude=41.0082,
            longitude=28.9784,
            start_date_str="2024-01-01",
            end_date_str="2024-01-03",  # Only 3 days for quick test
            progress_callback=lambda current, total: print(f"Progress: {current}/{total}")
        )
        
        print("✅ Test successful!")
        print(f"   - Retrieved {result['total_points']} data points")
        print(f"   - Date range: {result['date_range']}")
        print(f"   - Temperature average: {result['statistics']['temperature']['average']:.1f}°C")
        print(f"   - Risk level: {result['risk_analysis']['overall_assessment']['risk_level']}")
        print(f"   - Recommendation: {result['risk_analysis']['overall_assessment']['recommendation']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_flask_app():
    """Test Flask app creation"""
    print("\n🧪 Testing Flask App Creation...")
    
    try:
        app = create_app()
        print("✅ Flask app created successfully!")
        print(f"   - Debug mode: {app.config.get('DEBUG', False)}")
        print(f"   - Registered blueprints: {list(app.blueprints.keys())}")
        return True
        
    except Exception as e:
        print(f"❌ Flask app test failed: {e}")
        return False

def run_test_server():
    """Run a test server for manual testing"""
    print("\n🚀 Starting test server...")
    print("📱 You can test the following endpoints:")
    print("   - GET  http://localhost:5000/ (Root endpoint)")
    print("   - GET  http://localhost:5000/api/health (Health check)")
    print("   - POST http://localhost:5000/api/weather/analyze (Start analysis)")
    print("   - GET  http://localhost:5000/api/weather/progress/<task_id> (Check progress)")
    print("\n💡 Example POST request to /api/weather/analyze:")
    print("""
    {
        "latitude": 41.0082,
        "longitude": 28.9784,
        "startDate": "2024-01-01",
        "endDate": "2024-01-05"
    }
    """)
    
    try:
        from run import main
        main()
    except KeyboardInterrupt:
        print("\n⏹️ Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")

def main():
    """Main test function"""
    print("=" * 60)
    print("🌍 ATMORA WEATHER BACKEND TEST SUITE 🌍")
    print("=" * 60)
    
    # Test 1: Basic functionality
    if not test_basic_functionality():
        print("\n❌ Basic functionality test failed. Please check your NASA API connection.")
        return
    
    # Test 2: Flask app
    if not test_flask_app():
        print("\n❌ Flask app test failed. Please check your Flask setup.")
        return
    
    print("\n✅ All tests passed!")
    print("\n🎯 Next steps:")
    print("   1. Run 'python run.py' to start the backend server")
    print("   2. Run your Next.js frontend with 'npm run dev'")
    print("   3. Test the weather form in your browser")
    
    # Ask if user wants to run test server
    run_server = input("\n❓ Do you want to start the test server now? (y/n): ").lower().startswith('y')
    if run_server:
        run_test_server()

if __name__ == "__main__":
    main()