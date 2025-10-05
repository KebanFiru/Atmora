"""
Weather Analysis Routes
Router for weather-related endpoints
"""

from flask import Blueprint
from .controllers import weather_bp

def register_weather_routes(app):
    """Register weather analysis routes with the Flask app"""
    app.register_blueprint(weather_bp, url_prefix='/api/weather')
