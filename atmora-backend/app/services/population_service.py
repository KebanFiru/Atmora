"""
NASA Harmony API Population Service
Handles population data retrieval for geographic areas
"""

import requests
import json
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
import time
import logging

logger = logging.getLogger(__name__)


@dataclass
class BoundingBox:
    """Represents a geographical bounding box"""
    west: float
    south: float
    east: float
    north: float


@dataclass
class PopulationData:
    """Represents population data for a region"""
    total_population: int
    area_km2: float
    density: float
    coordinates: Dict[str, float]
    geometry_type: str
    data_source: str
    timestamp: str
    
    def to_dict(self):
        return asdict(self)


class HarmonyAPIClient:
    """Client for NASA Harmony API"""
    
    def __init__(self, base_url: str = "https://harmony.earthdata.nasa.gov"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'AtmoraPopulationAnalyzer/1.0',
            'Accept': 'application/json'
        })
    
    def calculate_bounding_box_from_circle(self, lat: float, lon: float, radius_km: float) -> BoundingBox:
        """
        Calculate bounding box from circle center and radius
        
        Args:
            lat: Latitude in degrees
            lon: Longitude in degrees
            radius_km: Radius in kilometers
            
        Returns:
            BoundingBox object with calculated bounds
        """
        # Approximate conversion: 1 degree ≈ 111 km
        lat_offset = radius_km / 111.0
        lon_offset = radius_km / (111.0 * abs(lat) if lat != 0 else 111.0)
        
        return BoundingBox(
            west=lon - lon_offset,
            south=lat - lat_offset,
            east=lon + lon_offset,
            north=lat + lat_offset
        )
    
    def calculate_bounding_box_from_rectangle(self, bounds: List[List[float]]) -> BoundingBox:
        """
        Calculate bounding box from rectangle bounds
        
        Args:
            bounds: [[lat1, lon1], [lat2, lon2]]
            
        Returns:
            BoundingBox object
        """
        lats = [bounds[0][0], bounds[1][0]]
        lons = [bounds[0][1], bounds[1][1]]
        
        return BoundingBox(
            west=min(lons),
            south=min(lats),
            east=max(lons),
            north=max(lats)
        )
    
    def calculate_area_km2(self, bbox: BoundingBox) -> float:
        """
        Calculate approximate area of bounding box in km²
        
        Args:
            bbox: BoundingBox object
            
        Returns:
            Area in square kilometers
        """
        # Approximate calculation
        lat_diff = abs(bbox.north - bbox.south)
        lon_diff = abs(bbox.east - bbox.west)
        
        # Convert to km (1 degree ≈ 111 km for latitude)
        height_km = lat_diff * 111.0
        # Longitude varies with latitude
        avg_lat = (bbox.north + bbox.south) / 2
        width_km = lon_diff * 111.0 * abs(max(-1, min(1, avg_lat / 90)))
        
        return height_km * width_km
    
    def get_available_collections(self) -> List[Dict]:
        """
        Get available population datasets from Harmony
        
        Returns:
            List of available collections
        """
        try:
            url = f"{self.base_url}/collections"
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            collections = response.json()
            
            # Filter for population-related collections
            population_collections = []
            for collection in collections.get('feed', {}).get('entry', []):
                title = collection.get('title', '').lower()
                if any(keyword in title for keyword in ['population', 'demographic', 'human', 'people']):
                    population_collections.append(collection)
            
            return population_collections
            
        except requests.RequestException as e:
            logger.error(f"Error fetching collections: {e}")
            return []
    
    def request_population_data(self, collection_id: str, bbox: BoundingBox) -> Optional[str]:
        """
        Request population data for a bounding box
        
        Args:
            collection_id: Collection identifier
            bbox: Bounding box for the request
            
        Returns:
            Job ID if successful, None otherwise
        """
        try:
            url = f"{self.base_url}/{collection_id}/harmony"
            
            params = {
                'bbox': f"{bbox.west},{bbox.south},{bbox.east},{bbox.north}",
                'format': 'application/json',
                'maxResults': '1'
            }
            
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()
            
            # Harmony typically returns a job URL or direct data
            if response.headers.get('content-type', '').startswith('application/json'):
                return response.json()
            else:
                # If it's a job, extract job ID from headers or URL
                location = response.headers.get('Location')
                if location:
                    return location.split('/')[-1]
                    
        except requests.RequestException as e:
            logger.error(f"Error requesting population data: {e}")
            return None


class PopulationAnalyzer:
    """High-level interface for population analysis"""
    
    def __init__(self):
        self.client = HarmonyAPIClient()
    
    def get_population_for_geometry(self, geometry: Dict) -> Optional[PopulationData]:
        """
        Get population estimate for geometry (circle, square, or rectangle)
        
        Args:
            geometry: Dictionary with geometry information
                {
                    "type": "circle" | "square" | "rectangle",
                    "center": {"lat": float, "lon": float},
                    "radius": float (for circle),
                    "bounds": [[lat1, lon1], [lat2, lon2]] (for rectangle/square)
                }
            
        Returns:
            PopulationData if successful, None otherwise
        """
        geometry_type = geometry.get('type', 'unknown')
        
        logger.info(f"🔍 Analyzing population for {geometry_type} geometry...")
        
        # Calculate bounding box based on geometry type
        if geometry_type == 'circle':
            center = geometry.get('center', {})
            lat = center.get('lat', 0)
            lon = center.get('lon', 0)
            radius = geometry.get('radius', 10)
            
            bbox = self.client.calculate_bounding_box_from_circle(lat, lon, radius)
            area_km2 = 3.14159 * radius * radius
            coordinates = {'center_lat': lat, 'center_lon': lon, 'radius_km': radius}
            
        elif geometry_type in ['square', 'rectangle']:
            bounds = geometry.get('bounds', [[0, 0], [0, 0]])
            bbox = self.client.calculate_bounding_box_from_rectangle(bounds)
            area_km2 = self.client.calculate_area_km2(bbox)
            coordinates = {
                'south_west': {'lat': bounds[0][0], 'lon': bounds[0][1]},
                'north_east': {'lat': bounds[1][0], 'lon': bounds[1][1]}
            }
            
        else:
            logger.error(f"Unknown geometry type: {geometry_type}")
            return None
        
        logger.info(f"📦 Bounding box: {bbox}")
        logger.info(f"📐 Area: {area_km2:.2f} km²")
        
        # Get population data
        logger.info("🌐 Fetching available population datasets...")
        collections = self.client.get_available_collections()
        
        if not collections:
            logger.warning("⚠️ No population collections found. Using simulated data...")
            return self._generate_simulated_data(bbox, area_km2, coordinates, geometry_type)
        
        logger.info(f"✅ Found {len(collections)} population-related collections")
        
        # Try to get real data (currently most NASA datasets require authentication)
        # For now, we'll use simulated data
        logger.info("💡 Using simulated data (NASA Harmony API requires authentication)")
        return self._generate_simulated_data(bbox, area_km2, coordinates, geometry_type)
    
    def _generate_simulated_data(self, bbox: BoundingBox, area_km2: float, 
                                 coordinates: Dict, geometry_type: str) -> PopulationData:
        """
        Generate simulated population data based on geographic location
        Uses real-world population density patterns
        """
        avg_lat = (bbox.north + bbox.south) / 2
        avg_lon = (bbox.east + bbox.west) / 2
        
        # Base population density (people per km²)
        population_density = 50
        
        # Adjust based on latitude (climate zones)
        if abs(avg_lat) < 23.5:  # Tropical zone
            population_density *= 2.0
        elif abs(avg_lat) < 45:  # Temperate zone
            population_density *= 2.5
        elif abs(avg_lat) < 66.5:  # Cool temperate
            population_density *= 1.5
        else:  # Polar regions
            population_density *= 0.05
        
        # Major urban centers (simplified)
        urban_centers = [
            # City, lat, lon, density multiplier
            ("Istanbul", 41.0082, 28.9784, 20),
            ("New York", 40.7128, -74.0060, 25),
            ("London", 51.5074, -0.1278, 22),
            ("Tokyo", 35.6762, 139.6503, 30),
            ("Paris", 48.8566, 2.3522, 20),
            ("Berlin", 52.5200, 13.4050, 18),
            ("Moscow", 55.7558, 37.6173, 20),
            ("Beijing", 39.9042, 116.4074, 25),
            ("Sydney", -33.8688, 151.2093, 15),
            ("Cairo", 30.0444, 31.2357, 22),
            ("Mumbai", 19.0760, 72.8777, 35),
            ("Los Angeles", 34.0522, -118.2437, 20),
            ("Singapore", 1.3521, 103.8198, 28),
            ("Hong Kong", 22.3193, 114.1694, 32),
            ("Seoul", 37.5665, 126.9780, 26),
            ("Mexico City", 19.4326, -99.1332, 24),
            ("São Paulo", -23.5505, -46.6333, 23),
            ("Lagos", 6.5244, 3.3792, 27),
            ("Dhaka", 23.8103, 90.4125, 38),
            ("Karachi", 24.8607, 67.0011, 30),
        ]
        
        # Check proximity to urban centers
        for city_name, city_lat, city_lon, multiplier in urban_centers:
            distance = ((avg_lat - city_lat) ** 2 + (avg_lon - city_lon) ** 2) ** 0.5
            # If within ~2 degrees (~200km)
            if distance < 2:
                proximity_factor = (2 - distance) / 2  # 1.0 at center, 0.0 at edge
                population_density *= (1 + multiplier * proximity_factor)
                logger.info(f"🏙️ Near {city_name}, applying urban multiplier")
                break
        
        # Coastal areas (simplified - more populated)
        # This is a very rough approximation
        if abs(avg_lon) < 20 or abs(avg_lon) > 160:  # Near major coastlines
            population_density *= 1.3
        
        # Calculate total population
        estimated_population = int(area_km2 * population_density)
        
        # Add some randomness for realism
        import random
        random.seed(int(avg_lat * 1000 + avg_lon * 1000))
        variation = random.uniform(0.8, 1.2)
        estimated_population = int(estimated_population * variation)
        
        # Ensure minimum population
        estimated_population = max(estimated_population, int(area_km2 * 5))
        
        density = estimated_population / area_km2 if area_km2 > 0 else 0
        
        logger.info(f"👥 Estimated population: {estimated_population:,}")
        logger.info(f"📊 Population density: {density:.2f} people/km²")
        
        return PopulationData(
            total_population=estimated_population,
            area_km2=round(area_km2, 2),
            density=round(density, 2),
            coordinates=coordinates,
            geometry_type=geometry_type,
            data_source="Simulated (based on real-world patterns)",
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S")
        )
