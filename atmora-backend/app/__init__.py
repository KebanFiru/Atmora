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
    
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['DEBUG'] = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    CORS(app,
         resources={r"/api/*": {"origins": "*"}},
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization", "Accept"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    cache_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'cache')
    if not os.path.exists(cache_dir):
        os.makedirs(cache_dir)
    
    static_dir = os.path.join(app.instance_path, 'static', 'charts')
    if not os.path.exists(static_dir):
        os.makedirs(static_dir)
    
    from .routes.weather.controllers import weather_bp
    from .routes.prediction.controllers import prediction_bp
    app.register_blueprint(weather_bp, url_prefix='/api/weather')
    app.register_blueprint(prediction_bp, url_prefix='/api/prediction')
    
    @app.route('/api/health')
    def health():
        return {
            'status': 'healthy',
            'message': 'Atmora Backend API is running',
            'version': '1.0.0'
        }
    
    @app.route('/')
    def root():
        return {
            'message': 'Atmora Weather Analysis Backend',
            'version': '1.0.0',
            'endpoints': {
                'health': '/api/health',
                'weather_analysis': '/api/weather/analyze',
                'weather_progress': '/api/weather/progress/<task_id>',
                'weather_export': '/api/weather/export/<task_id>/<format>',
                'weather_forecast': '/api/prediction/forecast',
                'forecast_progress': '/api/prediction/progress/<task_id>'
            }
        }
    
    return app
