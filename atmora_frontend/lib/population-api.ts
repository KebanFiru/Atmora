/**
 * Population API Service
 * TypeScript interfaces and service for population analysis
 */

// Population API types
export interface PopulationGeometry {
  type: 'circle' | 'square' | 'rectangle';
  center?: {
    lat: number;
    lon: number;
  };
  radius?: number; // for circle, in km
  bounds?: [[number, number], [number, number]]; // for square/rectangle
}

export interface PopulationRequest {
  geometry: PopulationGeometry;
}

export interface PopulationData {
  total_population: number;
  area_km2: number;
  density: number;
  coordinates: {
    center_lat?: number;
    center_lon?: number;
    radius_km?: number;
    south_west?: { lat: number; lon: number };
    north_east?: { lat: number; lon: number };
  };
  geometry_type: string;
  data_source: string;
  timestamp: string;
}

export interface PopulationResponse {
  success: boolean;
  data: PopulationData;
  message: string;
}

// API Service Class
export class PopulationAPI {
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:5000/api/population') {
    this.baseURL = baseURL;
  }

  async analyzePopulation(request: PopulationRequest): Promise<PopulationResponse> {
    const response = await fetch(`${this.baseURL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Population analysis failed');
    }

    return response.json();
  }

  async healthCheck(): Promise<any> {
    const response = await fetch(`${this.baseURL}/health`);
    return response.json();
  }

  async getInfo(): Promise<any> {
    const response = await fetch(`${this.baseURL}/info`);
    return response.json();
  }
}

// Helper function to format population number
export function formatPopulation(population: number): string {
  if (population >= 1000000) {
    return `${(population / 1000000).toFixed(2)}M`;
  } else if (population >= 1000) {
    return `${(population / 1000).toFixed(1)}K`;
  }
  return population.toLocaleString();
}

// Helper function to get density description
export function getDensityDescription(density: number): string {
  if (density < 10) return 'Very Low';
  if (density < 50) return 'Low';
  if (density < 150) return 'Moderate';
  if (density < 500) return 'High';
  if (density < 2000) return 'Very High';
  return 'Extremely High';
}

// Helper function to get population color based on density
export function getDensityColor(density: number): string {
  if (density < 10) return 'text-green-600';
  if (density < 50) return 'text-blue-600';
  if (density < 150) return 'text-yellow-600';
  if (density < 500) return 'text-orange-600';
  if (density < 2000) return 'text-red-600';
  return 'text-purple-600';
}
