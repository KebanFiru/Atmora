"""
Global Population Density Service
Generates grid-based population density data for world visualization
"""

import numpy as np
from datetime import datetime
from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)


class GlobalPopulationDensityService:
    """Service for generating global population density heat maps"""
    
    def __init__(self):
        # Major cities with their populations (simplified dataset)
        self.major_cities = [
            # City, lat, lon, base_population (millions), growth_rate (% per year)
            ("Tokyo", 35.6762, 139.6503, 37.4, 0.3),
            ("Delhi", 28.7041, 77.1025, 30.3, 2.1),
            ("Shanghai", 31.2304, 121.4737, 27.1, 1.2),
            ("São Paulo", -23.5505, -46.6333, 22.0, 0.8),
            ("Mexico City", 19.4326, -99.1332, 21.8, 1.0),
            ("Cairo", 30.0444, 31.2357, 20.9, 2.0),
            ("Dhaka", 23.8103, 90.4125, 21.0, 3.5),
            ("Mumbai", 19.0760, 72.8777, 20.4, 1.8),
            ("Beijing", 39.9042, 116.4074, 20.4, 1.5),
            ("Osaka", 34.6937, 135.5023, 19.3, 0.2),
            ("New York", 40.7128, -74.0060, 18.8, 0.5),
            ("Karachi", 24.8607, 67.0011, 16.0, 2.5),
            ("Buenos Aires", -34.6037, -58.3816, 15.2, 0.9),
            ("Chongqing", 29.4316, 106.9123, 15.3, 1.8),
            ("Istanbul", 41.0082, 28.9784, 15.5, 1.7),
            ("Kolkata", 22.5726, 88.3639, 14.9, 1.5),
            ("Manila", 14.5995, 120.9842, 13.9, 2.0),
            ("Lagos", 6.5244, 3.3792, 14.4, 3.5),
            ("Rio de Janeiro", -22.9068, -43.1729, 13.5, 0.7),
            ("Tianjin", 39.3434, 117.3616, 13.6, 1.3),
            ("Kinshasa", -4.4419, 15.2663, 14.3, 4.0),
            ("Guangzhou", 23.1291, 113.2644, 13.3, 1.5),
            ("Los Angeles", 34.0522, -118.2437, 12.4, 0.6),
            ("Moscow", 55.7558, 37.6173, 12.5, 0.3),
            ("Shenzhen", 22.5431, 114.0579, 12.4, 2.5),
            ("Lahore", 31.5204, 74.3587, 12.3, 2.8),
            ("Bangalore", 12.9716, 77.5946, 11.9, 2.5),
            ("Paris", 48.8566, 2.3522, 11.0, 0.4),
            ("Bogotá", 4.7110, -74.0721, 10.8, 1.3),
            ("Jakarta", -6.2088, 106.8456, 10.6, 1.4),
            ("Chennai", 13.0827, 80.2707, 10.5, 1.8),
            ("Lima", -12.0464, -77.0428, 10.6, 1.5),
            ("Bangkok", 13.7563, 100.5018, 10.5, 1.2),
            ("Seoul", 37.5665, 126.9780, 9.8, 0.4),
            ("Nagoya", 35.1815, 136.9066, 9.5, 0.1),
            ("Hyderabad", 17.3850, 78.4867, 9.7, 2.3),
            ("London", 51.5074, -0.1278, 9.3, 0.8),
            ("Tehran", 35.6892, 51.3890, 9.1, 1.0),
            ("Chicago", 41.8781, -87.6298, 8.9, 0.3),
            ("Chengdu", 30.5728, 104.0668, 9.0, 1.7),
            ("Nanjing", 32.0603, 118.7969, 8.7, 1.3),
            ("Wuhan", 30.5928, 114.3055, 8.4, 1.5),
            ("Ho Chi Minh", 10.8231, 106.6297, 8.6, 2.0),
            ("Luanda", -8.8383, 13.2344, 8.3, 3.8),
            ("Ahmedabad", 23.0225, 72.5714, 8.0, 2.4),
            ("Kuala Lumpur", 3.1390, 101.6869, 7.9, 2.2),
            ("Hong Kong", 22.3193, 114.1694, 7.5, 0.5),
            ("Dongguan", 23.0209, 113.7518, 8.3, 1.8),
            ("Foshan", 23.0218, 113.1219, 7.7, 1.6),
            ("Hangzhou", 30.2741, 120.1551, 7.6, 1.8),
            ("Shenyang", 41.8057, 123.4328, 7.5, 0.9),
            ("Riyadh", 24.7136, 46.6753, 7.2, 2.5),
            ("Baghdad", 33.3152, 44.3661, 7.2, 2.3),
            ("Santiago", -33.4489, -70.6693, 6.8, 1.0),
            ("Surat", 21.1702, 72.8311, 6.5, 3.0),
            ("Madrid", 40.4168, -3.7038, 6.6, 0.7),
            ("Suzhou", 31.2989, 120.5853, 6.7, 1.5),
            ("Pune", 18.5204, 73.8567, 6.5, 2.8),
            ("Harbin", 45.8038, 126.5340, 6.3, 0.5),
            ("Houston", 29.7604, -95.3698, 6.3, 1.8),
            ("Dallas", 32.7767, -96.7970, 6.3, 1.9),
            ("Toronto", 43.6532, -79.3832, 6.2, 1.5),
            ("Dar es Salaam", -6.7924, 39.2083, 6.4, 5.0),
            ("Miami", 25.7617, -80.1918, 6.1, 1.2),
            ("Belo Horizonte", -19.9167, -43.9345, 6.0, 0.8),
            ("Singapore", 1.3521, 103.8198, 5.9, 1.2),
            ("Philadelphia", 39.9526, -75.1652, 5.7, 0.4),
            ("Atlanta", 33.7490, -84.3880, 5.8, 1.6),
            ("Fukuoka", 33.5904, 130.4017, 5.6, 0.3),
            ("Khartoum", 15.5007, 32.5599, 5.5, 2.8),
            ("Barcelona", 41.3874, 2.1686, 5.6, 0.6),
            ("Johannesburg", -26.2041, 28.0473, 5.6, 1.8),
            ("Saint Petersburg", 59.9343, 30.3351, 5.4, 0.2),
            ("Qingdao", 36.0671, 120.3826, 5.4, 1.4),
            ("Dalian", 38.9140, 121.6147, 5.3, 0.8),
            ("Washington DC", 38.9072, -77.0369, 5.2, 1.0),
            ("Yangon", 16.8661, 96.1951, 5.3, 1.8),
            ("Alexandria", 31.2001, 29.9187, 5.2, 1.5),
            ("Jinan", 36.6512, 117.1200, 5.1, 1.2),
            ("Guadalajara", 20.6597, -103.3496, 5.0, 1.5),
        ]
        
        # Regional population density factors (people per km²)
        self.regional_density = {
            "East Asia": 150,
            "South Asia": 400,
            "Southeast Asia": 150,
            "Middle East": 50,
            "Europe": 100,
            "North America": 20,
            "South America": 25,
            "Africa": 45,
            "Oceania": 5
        }
    
    def calculate_population_for_year(self, base_pop: float, growth_rate: float, 
                                     base_year: int, target_year: int) -> float:
        """Calculate population based on growth rate"""
        years_diff = target_year - base_year
        return base_pop * ((1 + growth_rate / 100) ** years_diff)
    
    def get_region(self, lat: float, lon: float) -> str:
        """Determine region based on coordinates"""
        if 20 < lat < 50 and 100 < lon < 150:
            return "East Asia"
        elif 5 < lat < 35 and 60 < lon < 100:
            return "South Asia"
        elif -10 < lat < 25 and 95 < lon < 140:
            return "Southeast Asia"
        elif 15 < lat < 40 and 25 < lon < 60:
            return "Middle East"
        elif 35 < lat < 70 and -10 < lon < 40:
            return "Europe"
        elif 25 < lat < 70 and -170 < lon < -50:
            return "North America"
        elif -55 < lat < 15 and -85 < lon < -35:
            return "South America"
        elif -35 < lat < 37 and -20 < lon < 55:
            return "Africa"
        else:
            return "Oceania"
    
    def generate_global_density_grid(self, target_date: datetime, 
                                    grid_resolution: float = 2.0) -> List[Dict]:
        """
        Generate global population density grid
        
        Args:
            target_date: Date for population calculation
            grid_resolution: Grid cell size in degrees (default 2.0)
            
        Returns:
            List of density points with [lat, lon, intensity]
        """
        target_year = target_date.year
        base_year = 2024
        
        logger.info(f"🌍 Generating global population density for year {target_year}")
        
        density_points = []
        
        # Generate city-based density points
        for city_name, lat, lon, base_pop, growth_rate in self.major_cities:
            # Calculate population for target year
            city_pop = self.calculate_population_for_year(
                base_pop, growth_rate, base_year, target_year
            )
            
            # City core - highest density
            density_points.append({
                "lat": lat,
                "lon": lon,
                "intensity": min(1.0, city_pop / 40.0),  # Normalized to 0-1
                "population": city_pop * 1_000_000,
                "type": "city_core"
            })
            
            # Add surrounding area points with decreasing intensity
            for radius_factor in [1, 2, 3]:
                radius_deg = radius_factor * 0.5  # degrees
                num_points = 8 * radius_factor
                
                for i in range(num_points):
                    angle = (2 * np.pi * i) / num_points
                    point_lat = lat + radius_deg * np.sin(angle)
                    point_lon = lon + radius_deg * np.cos(angle)
                    
                    # Decrease intensity with distance
                    intensity = (city_pop / 40.0) * (1.0 / (radius_factor + 1))
                    
                    density_points.append({
                        "lat": point_lat,
                        "lon": point_lon,
                        "intensity": min(1.0, intensity),
                        "population": city_pop * 1_000_000 / (radius_factor + 1),
                        "type": "city_suburb"
                    })
        
        # Add regional background density
        for lat in np.arange(-60, 70, grid_resolution * 2):
            for lon in np.arange(-180, 180, grid_resolution * 2):
                region = self.get_region(lat, lon)
                base_density = self.regional_density[region]
                
                # Vary density with random factor
                density_variation = np.random.uniform(0.7, 1.3)
                adjusted_density = base_density * density_variation
                
                # Calculate intensity (normalize to 0-1 range)
                # Max density ~400 people/km²
                intensity = min(1.0, adjusted_density / 400.0) * 0.3  # Keep regional lower than cities
                
                if intensity > 0.05:  # Only add visible points
                    density_points.append({
                        "lat": lat,
                        "lon": lon,
                        "intensity": intensity,
                        "population": adjusted_density * 10000,  # Approximate
                        "type": "regional"
                    })
        
        logger.info(f"✅ Generated {len(density_points)} density points")
        
        return density_points
    
    def get_density_statistics(self, density_points: List[Dict]) -> Dict:
        """Calculate statistics for density data"""
        total_population = sum(p["population"] for p in density_points)
        avg_intensity = np.mean([p["intensity"] for p in density_points])
        max_intensity = max(p["intensity"] for p in density_points)
        
        # Count by type
        city_cores = len([p for p in density_points if p["type"] == "city_core"])
        city_suburbs = len([p for p in density_points if p["type"] == "city_suburb"])
        regional = len([p for p in density_points if p["type"] == "regional"])
        
        return {
            "total_points": len(density_points),
            "estimated_global_population": int(total_population),
            "average_intensity": round(avg_intensity, 3),
            "max_intensity": round(max_intensity, 3),
            "breakdown": {
                "city_cores": city_cores,
                "city_suburbs": city_suburbs,
                "regional_background": regional
            }
        }
