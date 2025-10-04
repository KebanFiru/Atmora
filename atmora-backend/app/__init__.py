"""
Atmora Backend Application
Flask app factory and configuration
"""

from flask import Flask
from flask_cors import CORS
import os

def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['DEBUG'] = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    # Enable CORS for frontend communication with all HTTP methods
    CORS(app, 
         resources={r"/api/*": {"origins": "*"}},
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization", "Accept"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    # Create cache directory if it doesn't exist
    cache_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'cache')
    if not os.path.exists(cache_dir):
        os.makedirs(cache_dir)
    
    # Create static directory for charts if it doesn't exist
    static_dir = os.path.join(app.instance_path, 'static', 'charts')
    if not os.path.exists(static_dir):
        os.makedirs(static_dir)
    
    # Register routes
    from .routes.weather.controllers import weather_bp
    app.register_blueprint(weather_bp, url_prefix='/api/weather')
    
    # Basic health check route
    @app.route('/api/health')
    def health():
        return {
            'status': 'healthy',
            'message': 'Atmora Backend API is running',
            'version': '1.0.0'
        }
    
    # Root route
    @app.route('/')
    def root():
        return {
            'message': 'Atmora Weather Analysis Backend',
            'version': '1.0.0',
            'endpoints': {
                'health': '/api/health',
                'weather_analysis': '/api/weather/analyze',
                'progress_check': '/api/weather/progress/<task_id>',
                'data_export': '/api/weather/export/<task_id>/<format>'
            }
        }
    
    return app
