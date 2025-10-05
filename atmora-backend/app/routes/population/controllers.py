"""
Population Analysis Controller
Handles population analysis requests for geographic areas
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import logging

population_bp = Blueprint('population', __name__)
logger = logging.getLogger(__name__)


@population_bp.route('/analyze', methods=['POST'])
def analyze_population():
    """
    Analyze population for a geographic area
    Expected JSON payload:
    {
        "geometry": {
            "type": "circle" | "square" | "rectangle",
            "center": {"lat": float, "lon": float},
            "radius": float (for circle, in km),
            "bounds": [[lat1, lon1], [lat2, lon2]] (for rectangle/square)
        }
    }
    """
    try:
        data = request.json
        
        if 'geometry' not in data:
            return jsonify({'error': 'Geometry field is required'}), 400
        
        geometry = data['geometry']
        geometry_type = geometry.get('type')
        
        if geometry_type not in ['circle', 'square', 'rectangle']:
            return jsonify({'error': 'Invalid geometry type. Must be circle, square, or rectangle'}), 400
        
        # Validate circle geometry
        if geometry_type == 'circle':
            if 'center' not in geometry or 'radius' not in geometry:
                return jsonify({'error': 'Circle geometry requires center and radius'}), 400
            
            center = geometry['center']
            if 'lat' not in center or 'lon' not in center:
                return jsonify({'error': 'Center requires lat and lon'}), 400
            
            try:
                lat = float(center['lat'])
                lon = float(center['lon'])
                radius = float(geometry['radius'])
                
                if not (-90 <= lat <= 90):
                    return jsonify({'error': 'Latitude must be between -90 and 90'}), 400
                if not (-180 <= lon <= 180):
                    return jsonify({'error': 'Longitude must be between -180 and 180'}), 400
                if not (0.1 <= radius <= 1000):
                    return jsonify({'error': 'Radius must be between 0.1 and 1000 km'}), 400
                    
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid numeric values'}), 400
        
        # Validate rectangle/square geometry
        elif geometry_type in ['square', 'rectangle']:
            if 'bounds' not in geometry:
                return jsonify({'error': f'{geometry_type.capitalize()} geometry requires bounds'}), 400
            
            bounds = geometry['bounds']
            if not isinstance(bounds, list) or len(bounds) != 2:
                return jsonify({'error': 'Bounds must be array of 2 points [[lat1, lon1], [lat2, lon2]]'}), 400
            
            try:
                for point in bounds:
                    if not isinstance(point, list) or len(point) != 2:
                        return jsonify({'error': 'Each bound point must be [lat, lon]'}), 400
                    lat, lon = float(point[0]), float(point[1])
                    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
                        return jsonify({'error': 'Invalid coordinates in bounds'}), 400
                        
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid numeric values in bounds'}), 400
        
        # Import here to avoid circular imports
        from app.services.population_service import PopulationAnalyzer
        
        analyzer = PopulationAnalyzer()
        
        logger.info(f"🔍 Population analysis request for {geometry_type} geometry")
        
        # Get population data
        population_data = analyzer.get_population_for_geometry(geometry)
        
        if not population_data:
            return jsonify({'error': 'Failed to analyze population'}), 500
        
        response = {
            'success': True,
            'data': population_data.to_dict(),
            'message': f'Population analysis completed for {geometry_type} area'
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"❌ Population analysis error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500


@population_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Atmora Population API',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })


@population_bp.route('/info', methods=['GET'])
def api_info():
    """API information endpoint"""
    return jsonify({
        'service': 'Population Analysis API',
        'description': 'Analyzes population data for geographic areas using NASA Harmony API',
        'version': '1.0.0',
        'supported_geometries': ['circle', 'square', 'rectangle'],
        'data_source': 'NASA Harmony API with simulated fallback',
        'endpoints': {
            '/analyze': {
                'method': 'POST',
                'description': 'Analyze population for a geographic area',
                'example': {
                    'geometry': {
                        'type': 'circle',
                        'center': {'lat': 41.0082, 'lon': 28.9784},
                        'radius': 50
                    }
                }
            },
            '/health': {
                'method': 'GET',
                'description': 'Check API health status'
            },
            '/info': {
                'method': 'GET',
                'description': 'Get API information'
            }
        }
    })
