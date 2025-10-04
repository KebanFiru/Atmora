
/*
Frontend Integration Service for WeatherForm
This TypeScript interface matches the backend API
*/

// Backend API types that match the Flask endpoints
export interface WeatherAnalysisRequest {
  latitude: number;
  longitude: number;
  startDate: string; // YYYY-MM-DD format
  endDate: string;   // YYYY-MM-DD format
}

export interface AnalysisResponse {
  task_id: string;
  status: string;
  message: string;
}

export interface ProgressResponse {
  task_id: string;
  progress: number;
  total: number;
  status: string;
  percentage: number;
  elapsed_time: number;
  completed?: boolean;
  summary?: WeatherSummary;
  charts?: {
    weather_chart: string; // base64 encoded image
    statistics_chart: string; // base64 encoded image
  };
  risk_analysis?: RiskAnalysis;
  statistics?: WeatherStatistics;
  error?: string;
}

export interface WeatherSummary {
  overview: {
    total_days: number;
    date_range: string;
    location: string;
  };
  weather_highlights: {
    average_temperature: string;
    temperature_range: string;
    average_humidity: string;
    average_wind_speed: string;
    total_precipitation: string;
  };
  risk_assessment: {
    very_hot_days: string;
    very_cold_days: string;
    very_windy_days: string;
    very_wet_days: string;
    uncomfortable_days: string;
  };
  recommendation: string;
  overall_risk_level: 'low' | 'medium' | 'high';
}

export interface RiskAnalysis {
  very_hot: RiskItem;
  very_cold: RiskItem;
  very_windy: RiskItem;
  very_wet: RiskItem;
  very_uncomfortable: RiskItem;
  overall_assessment: {
    risk_level: 'low' | 'medium' | 'high';
    recommendation: string;
  };
}

export interface RiskItem {
  probability: number;
  threshold: number;
  description: string;
  risk_level: 'low' | 'medium' | 'high';
}

export interface WeatherStatistics {
  temperature: StatItem;
  wind_speed: StatItem;
  precipitation: StatItem;
  humidity: StatItem;
}

export interface StatItem {
  average: number;
  minimum: number;
  maximum: number;
  count: number;
}

// API Service Class
export class WeatherAnalysisAPI {
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:5000/api/weather') {
    this.baseURL = baseURL;
  }

  async startAnalysis(request: WeatherAnalysisRequest): Promise<AnalysisResponse> {
    const response = await fetch(`${this.baseURL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Analysis request failed');
    }

    return response.json();
  }

  async getProgress(taskId: string): Promise<ProgressResponse> {
    const response = await fetch(`${this.baseURL}/progress/${taskId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get progress');
    }

    return response.json();
  }

  async getResult(taskId: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/result/${taskId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get result');
    }

    return response.json();
  }

  async exportData(taskId: string, format: 'csv' | 'json'): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/export/${taskId}/${format}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Export failed');
    }

    return response.blob();
  }

  async cleanupTask(taskId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/cleanup/${taskId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Cleanup failed');
    }
  }

  async healthCheck(): Promise<any> {
    const response = await fetch(`${this.baseURL}/health`);
    return response.json();
  }
}

// Usage example:
/*
const api = new WeatherAnalysisAPI();

// Start analysis
const response = await api.startAnalysis({
  latitude: 41.0082,
  longitude: 28.9784,
  startDate: '2025-01-01',
  endDate: '2025-12-31'
});

// Poll for progress
const progressInterval = setInterval(async () => {
  const progress = await api.getProgress(response.task_id);
  
  if (progress.completed) {
    clearInterval(progressInterval);
    // Use progress.summary, progress.charts, etc.
  }
}, 2000);

// Export data when ready
const csvBlob = await api.exportData(response.task_id, 'csv');
const jsonBlob = await api.exportData(response.task_id, 'json');
*/