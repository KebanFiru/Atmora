'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, TrendingUp, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { WeatherAnalysisAPI, WeatherSummary, ProgressResponse } from '../lib/weather-api';

interface WeatherFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: { longitude: number; latitude: number } | null;
  onAnalyze?: (params: WeatherAnalysisParams) => void;
}

interface WeatherAnalysisParams {
  startDate: string;
  endDate: string;
  parameters: string[];
}

const WeatherForm: React.FC<WeatherFormProps> = ({ 
  isOpen, 
  onClose, 
  selectedLocation,
  onAnalyze
}) => {
  const [formData, setFormData] = useState<WeatherAnalysisParams>({
    startDate: '2020-01-01',
    endDate: '2024-12-31',
    parameters: ['T2M', 'WS10M', 'PRECTOT', 'HUMIDITY']
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [analysisResults, setAnalysisResults] = useState<WeatherSummary | null>(null);
  const [charts, setCharts] = useState<{ weather_chart: string; statistics_chart: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const api = new WeatherAnalysisAPI();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResults(null);
    setCharts(null);

    try {
      // Start analysis
      const response = await api.startAnalysis({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        startDate: formData.startDate,
        endDate: formData.endDate
      });

      setCurrentTaskId(response.task_id);
      
      // Call parent callback if provided
      if (onAnalyze) {
        onAnalyze(formData);
      }

      // Start polling for progress
      pollProgress(response.task_id);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setIsAnalyzing(false);
    }
  };

  const pollProgress = async (taskId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const progressData = await api.getProgress(taskId);
        setProgress(progressData);

        if (progressData.completed) {
          clearInterval(pollInterval);
          setIsAnalyzing(false);
          
          if (progressData.summary) {
            setAnalysisResults(progressData.summary);
          }
          
          if (progressData.charts) {
            setCharts(progressData.charts);
          }
        }

        if (progressData.error) {
          clearInterval(pollInterval);
          setError(progressData.error);
          setIsAnalyzing(false);
        }

      } catch (err) {
        clearInterval(pollInterval);
        setError(err instanceof Error ? err.message : 'Failed to get progress');
        setIsAnalyzing(false);
      }
    }, 2000);
  };

  const downloadData = async (format: 'csv' | 'json') => {
    if (!currentTaskId) return;

    try {
      const blob = await api.exportData(currentTaskId, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `atmora_weather_data_${selectedLocation?.latitude}_${selectedLocation?.longitude}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentTaskId && !isAnalyzing) {
        api.cleanupTask(currentTaskId).catch(console.error);
      }
    };
  }, [currentTaskId, isAnalyzing]);

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
                    max="2024-12-31"
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Data available until Dec 31, 2024</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    max="2024-12-31"
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum: Dec 31, 2024</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={!selectedLocation || isAnalyzing}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={20} className="inline mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <TrendingUp size={20} className="inline mr-2" />
                      Analyze Weather Patterns
                    </>
                  )}
                </button>
                
                {analysisResults && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => downloadData('csv')}
                      className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      <Download size={20} className="inline mr-2" />
                      CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadData('json')}
                      className="bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      <Download size={20} className="inline mr-2" />
                      JSON
                    </button>
                  </div>
                )}
              </div>
            </form>

            {/* Progress Display */}
            {isAnalyzing && progress && (
              <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  <Loader2 size={20} className="inline mr-2 animate-spin" />
                  Analysis in Progress
                </h3>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{progress.status}</span>
                    <span>{progress.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Elapsed time: {Math.floor(progress.elapsed_time / 60)}m {progress.elapsed_time % 60}s
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-8 p-6 bg-red-50 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  <AlertCircle size={20} className="inline mr-2" />
                  Analysis Error
                </h3>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Analysis Results */}
            {analysisResults && (
              <div className="mt-8 space-y-6">
                {/* Success Header */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    <CheckCircle2 size={20} className="inline mr-2" />
                    Analysis Complete!
                  </h3>
                  <p className="text-sm text-green-700">{analysisResults.recommendation}</p>
                </div>

                {/* Weather Highlights */}
                <div className="p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Weather Highlights</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">{analysisResults.weather_highlights.average_temperature}</div>
                      <div className="text-sm text-gray-600">Average Temperature</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{analysisResults.weather_highlights.average_humidity}</div>
                      <div className="text-sm text-gray-600">Average Humidity</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{analysisResults.weather_highlights.average_wind_speed}</div>
                      <div className="text-sm text-gray-600">Average Wind Speed</div>
                    </div>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Assessment</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{analysisResults.risk_assessment.very_hot_days}</div>
                      <div className="text-sm text-gray-600">Very Hot Days</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{analysisResults.risk_assessment.very_cold_days}</div>
                      <div className="text-sm text-gray-600">Very Cold Days</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{analysisResults.risk_assessment.very_windy_days}</div>
                      <div className="text-sm text-gray-600">Very Windy Days</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-cyan-600">{analysisResults.risk_assessment.very_wet_days}</div>
                      <div className="text-sm text-gray-600">Very Wet Days</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{analysisResults.risk_assessment.uncomfortable_days}</div>
                      <div className="text-sm text-gray-600">Uncomfortable Days</div>
                    </div>
                  </div>
                </div>

                {/* Overview */}
                <div className="p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Analysis Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Location:</span> {analysisResults.overview.location}
                    </div>
                    <div>
                      <span className="font-medium">Date Range:</span> {analysisResults.overview.date_range}
                    </div>
                    <div>
                      <span className="font-medium">Total Days:</span> {analysisResults.overview.total_days}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Charts */}
            {charts && (
              <div className="mt-8 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Weather Analysis Charts</h3>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <img 
                      src={`data:image/png;base64,${charts.weather_chart}`}
                      alt="Weather Analysis Chart"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistics Chart</h3>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <img 
                      src={`data:image/png;base64,${charts.statistics_chart}`}
                      alt="Statistics Chart"
                      className="w-full h-auto"
                    />
                  </div>
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