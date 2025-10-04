'use client';

import React, { useState } from 'react';
import { X, Download, TrendingUp } from 'lucide-react';

interface WeatherFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: { longitude: number; latitude: number } | null;
  onAnalyze: (params: WeatherAnalysisParams) => void;
  weatherData?: WeatherData;
}

interface WeatherAnalysisParams {
  startDate: string;
  endDate: string;
  parameters: string[];
}

interface WeatherData {
  temperature: Array<{ date: string; value: number }>;
  windSpeed: Array<{ date: string; value: number }>;
  precipitation: Array<{ date: string; value: number }>;
  humidity: Array<{ date: string; value: number }>;
}

const WeatherForm: React.FC<WeatherFormProps> = ({ 
  isOpen, 
  onClose, 
  selectedLocation, 
  onAnalyze,
  weatherData 
}) => {
  const [formData, setFormData] = useState<WeatherAnalysisParams>({
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    parameters: ['T2M', 'WS10M', 'PRECTOT', 'HUMIDITY'],
  });

  const [analysisResults, setAnalysisResults] = useState<any>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLocation) {
      onAnalyze(formData);
      
      // Mock analysis results for demonstration
      setAnalysisResults({
        veryHot: 35,
        veryCold: 12,
        veryWindy: 28,
        veryWet: 45,
        veryUncomfortable: 22
      });
    }
  };

  const downloadData = () => {
    if (weatherData && selectedLocation) {
      const csvData = generateCSV(weatherData, selectedLocation);
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weather_data_${selectedLocation.latitude}_${selectedLocation.longitude}.csv`;
      a.click();
    }
  };

  const generateCSV = (data: WeatherData, location: { longitude: number; latitude: number }) => {
    const headers = ['Date', 'Temperature (°C)', 'Wind Speed (m/s)', 'Precipitation (mm)', 'Humidity (%)'];
    const rows = data.temperature.map((temp, index) => [
      temp.date,
      temp.value,
      data.windSpeed[index]?.value || '',
      data.precipitation[index]?.value || '',
      data.humidity[index]?.value || ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="bg-black/20 backdrop-blur-sm absolute inset-0" onClick={onClose} />
      
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 w-full max-w-4xl mx-4 relative max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Weather Analysis</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="p-6">
            {/* Location Info */}
            {selectedLocation && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Selected Location</h3>
                <p className="text-gray-600">
                  Latitude: {selectedLocation.latitude.toFixed(4)}°, 
                  Longitude: {selectedLocation.longitude.toFixed(4)}°
                </p>
              </div>
            )}

            {/* Analysis Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={!selectedLocation}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <TrendingUp size={20} className="inline mr-2" />
                  Analyze Weather Patterns
                </button>
                
                {weatherData && (
                  <button
                    type="button"
                    onClick={downloadData}
                    className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <Download size={20} className="inline mr-2" />
                    Download Data
                  </button>
                )}
              </div>
            </form>

            {/* Analysis Results */}
            {analysisResults && (
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Analysis Results</h3>
                <div className="grid grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{analysisResults.veryHot}%</div>
                    <div className="text-sm text-gray-600">Very Hot Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{analysisResults.veryCold}%</div>
                    <div className="text-sm text-gray-600">Very Cold Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{analysisResults.veryWindy}%</div>
                    <div className="text-sm text-gray-600">Very Windy Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-600">{analysisResults.veryWet}%</div>
                    <div className="text-sm text-gray-600">Very Wet Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{analysisResults.veryUncomfortable}%</div>
                    <div className="text-sm text-gray-600">Uncomfortable Days</div>
                  </div>
                </div>
              </div>
            )}

            {/* Chart */}
            {weatherData && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Temperature Trend</h3>
                <div className="h-64">
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherForm;