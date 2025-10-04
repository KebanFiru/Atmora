from .date.routers import date_bp
from .location.routers import location_bp


def register_routes(app):
    """Register blueprints for the application.

    This function centralises all blueprint registration so the app factory
    in `app/__init__.py` can simply call `register_routes(app)`.
    """
    app.register_blueprint(date_bp, url_prefix='/api/date')
    app.register_blueprint(location_bp, url_prefix='/api/location')