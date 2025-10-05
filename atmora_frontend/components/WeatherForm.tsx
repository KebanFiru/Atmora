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
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Historical Weather Analysis</h2>
            <p className="text-sm text-gray-600 mt-1">Analyze past weather patterns using NASA POWER data</p>
          </div>
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
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-gray-800 mb-2">Selected Location</h3>
                <p className="text-gray-700">
                  <span className="font-medium">Coordinates:</span> {selectedLocation.latitude.toFixed(4)}°N, {selectedLocation.longitude.toFixed(4)}°E
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  NASA POWER data will be retrieved for this precise location
                </p>
              </div>
            )}

            {/* Analysis Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Select Time Period for Analysis</h4>
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
                    <p className="text-xs text-gray-500 mt-1">Recommend: At least 1 year for better statistics</p>
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
                    <p className="text-xs text-gray-500 mt-1">Latest available: December 31, 2024</p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs text-blue-800">
                    <strong>About the data:</strong> NASA POWER provides historical weather observations from satellites and ground stations. 
                    Longer time periods give more accurate probability estimates for extreme conditions.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={!selectedLocation || isAnalyzing}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={20} className="inline mr-2 animate-spin" />
                      Analyzing Weather Patterns...
                    </>
                  ) : (
                    <>
                      <TrendingUp size={20} className="inline mr-2" />
                      Start Historical Analysis
                    </>
                  )}
                </button>
                
                {analysisResults && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => downloadData('csv')}
                      className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium shadow-lg hover:shadow-xl"
                      title="Download data as spreadsheet format"
                    >
                      <Download size={20} className="inline mr-2" />
                      Export CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadData('json')}
                      className="bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-lg hover:shadow-xl"
                      title="Download data as JSON format"
                    >
                      <Download size={20} className="inline mr-2" />
                      Export JSON
                    </button>
                  </div>
                )}
              </div>
            </form>

            {/* Progress Display */}
            {isAnalyzing && progress && (
              <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  <Loader2 size={20} className="inline mr-2 animate-spin text-blue-600" />
                  Processing NASA Weather Data...
                </h3>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-700 mb-2">
                    <span className="font-medium">{progress.status}</span>
                    <span className="font-bold text-blue-700">{progress.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 shadow-sm"
                      style={{ width: `${progress.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Elapsed: {Math.floor(progress.elapsed_time / 60)}m {progress.elapsed_time % 60}s
                  </span>
                  <span className="text-xs text-gray-500 italic">
                    Fetching satellite observations & computing statistics...
                  </span>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-8 p-6 bg-red-50 rounded-lg border-2 border-red-300 shadow-lg">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  <AlertCircle size={20} className="inline mr-2" />
                  Analysis Error
                </h3>
                <p className="text-red-700">{error}</p>
                <p className="text-xs text-red-600 mt-2 italic">Please try again or select a different location/date range.</p>
              </div>
            )}

            {/* Analysis Results */}
            {analysisResults && (
              <div className="mt-8 space-y-6">
                {/* Success Header */}
                <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300 shadow-lg">
                  <h3 className="text-xl font-bold text-green-800 mb-3 flex items-center gap-2">
                    <CheckCircle2 size={24} className="text-green-600" />
                    Analysis Complete!
                  </h3>
                  <div className="bg-white/60 rounded p-3 border-l-4 border-green-500">
                    <p className="text-sm font-medium text-gray-800"><strong>Recommendation:</strong></p>
                    <p className="text-sm text-gray-700 mt-1">{analysisResults.recommendation}</p>
                  </div>
                </div>

                {/* Weather Highlights */}
                <div className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border border-orange-200 shadow-md">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Average Weather Conditions</h3>
                  <p className="text-xs text-gray-600 mb-4 italic">Mean values calculated from NASA satellite observations over the selected period</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/70 p-4 rounded-lg text-center shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-2xl font-bold text-orange-600">{analysisResults.weather_highlights.average_temperature}</div>
                      <div className="text-sm font-medium text-gray-700 mt-1">Avg Temperature</div>
                      <div className="text-xs text-gray-500 mt-1">2 meters above ground</div>
                    </div>
                    <div className="bg-white/70 p-4 rounded-lg text-center shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-2xl font-bold text-blue-600">{analysisResults.weather_highlights.average_humidity}</div>
                      <div className="text-sm font-medium text-gray-700 mt-1">Avg Humidity</div>
                      <div className="text-xs text-gray-500 mt-1">Relative humidity %</div>
                    </div>
                    <div className="bg-white/70 p-4 rounded-lg text-center shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-2xl font-bold text-green-600">{analysisResults.weather_highlights.average_wind_speed}</div>
                      <div className="text-sm font-medium text-gray-700 mt-1">Avg Wind Speed</div>
                      <div className="text-xs text-gray-500 mt-1">10 meters above ground</div>
                    </div>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="p-6 bg-gradient-to-br from-red-50 via-purple-50 to-blue-50 rounded-lg border border-red-200 shadow-md">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Extreme Weather Risk Assessment</h3>
                  <p className="text-xs text-gray-600 mb-4 italic">
                    Number of days with extreme conditions based on statistical thresholds (95th percentile for hot/windy/wet, 5th for cold)
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-white/80 p-4 rounded-lg text-center shadow-sm hover:shadow-lg transition-all hover:scale-105">
                      <div className="text-3xl mb-2">🔥</div>
                      <div className="text-3xl font-bold text-red-600">{analysisResults.risk_assessment.very_hot_days}</div>
                      <div className="text-xs font-semibold text-gray-700 mt-2">Very Hot Days</div>
                      <div className="text-xs text-gray-500 mt-1">Temp {'>'} 95th percentile</div>
                    </div>
                    <div className="bg-white/80 p-4 rounded-lg text-center shadow-sm hover:shadow-lg transition-all hover:scale-105">
                      <div className="text-3xl mb-2">❄️</div>
                      <div className="text-3xl font-bold text-blue-600">{analysisResults.risk_assessment.very_cold_days}</div>
                      <div className="text-xs font-semibold text-gray-700 mt-2">Very Cold Days</div>
                      <div className="text-xs text-gray-500 mt-1">Temp {'<'} 5th percentile</div>
                    </div>
                    <div className="bg-white/80 p-4 rounded-lg text-center shadow-sm hover:shadow-lg transition-all hover:scale-105">
                      <div className="text-3xl mb-2">🌪️</div>
                      <div className="text-3xl font-bold text-green-600">{analysisResults.risk_assessment.very_windy_days}</div>
                      <div className="text-xs font-semibold text-gray-700 mt-2">Very Windy Days</div>
                      <div className="text-xs text-gray-500 mt-1">Wind {'>'} 95th percentile</div>
                    </div>
                    <div className="bg-white/80 p-4 rounded-lg text-center shadow-sm hover:shadow-lg transition-all hover:scale-105">
                      <div className="text-3xl mb-2">🌧️</div>
                      <div className="text-3xl font-bold text-cyan-600">{analysisResults.risk_assessment.very_wet_days}</div>
                      <div className="text-xs font-semibold text-gray-700 mt-2">Very Wet Days</div>
                      <div className="text-xs text-gray-500 mt-1">Rain {'>'} 95th percentile</div>
                    </div>
                    <div className="bg-white/80 p-4 rounded-lg text-center shadow-sm hover:shadow-lg transition-all hover:scale-105">
                      <div className="text-3xl mb-2">😰</div>
                      <div className="text-3xl font-bold text-purple-600">{analysisResults.risk_assessment.uncomfortable_days}</div>
                      <div className="text-xs font-semibold text-gray-700 mt-2">Uncomfortable Days</div>
                      <div className="text-xs text-gray-500 mt-1">High heat index</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-amber-50 rounded border border-amber-300">
                    <p className="text-xs text-amber-900">
                      <strong>What this means:</strong> These counts show historically rare weather events. Higher numbers suggest 
                      more frequent extreme conditions during your selected period. Use this to assess outdoor activity risks.
                    </p>
                  </div>
                </div>

                {/* Overview */}
                <div className="p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-300 shadow-md">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Analysis Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/60 p-3 rounded border-l-4 border-blue-500">
                      <div className="text-xs text-gray-500 font-semibold uppercase">Location</div>
                      <div className="text-sm font-bold text-gray-800 mt-1">{analysisResults.overview.location}</div>
                    </div>
                    <div className="bg-white/60 p-3 rounded border-l-4 border-green-500">
                      <div className="text-xs text-gray-500 font-semibold uppercase">Time Period</div>
                      <div className="text-sm font-bold text-gray-800 mt-1">{analysisResults.overview.date_range}</div>
                    </div>
                    <div className="bg-white/60 p-3 rounded border-l-4 border-purple-500">
                      <div className="text-xs text-gray-500 font-semibold uppercase">Sample Size</div>
                      <div className="text-sm font-bold text-gray-800 mt-1">{analysisResults.overview.total_days} days analyzed</div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-600 italic text-center">
                    Data source: NASA POWER Project - Powered by satellite observations and weather station measurements
                  </div>
                </div>
              </div>
            )}

            {/* Charts */}
            {charts && (
              <div className="mt-8 space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-lg border border-blue-200 shadow-lg">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Time Series Analysis</h3>
                  <p className="text-xs text-gray-600 mb-4 italic">
                    Visual representation of weather variables over time showing trends, patterns, and seasonal variations
                  </p>
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <img 
                      src={`data:image/png;base64,${charts.weather_chart}`}
                      alt="Weather Time Series Chart - Temperature, Humidity, Wind Speed, and Precipitation over time"
                      className="w-full h-auto rounded"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Look for patterns: Do extreme events cluster in certain seasons? Are conditions changing over time?
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200 shadow-lg">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Statistical Distribution Analysis</h3>
                  <p className="text-xs text-gray-600 mb-4 italic">
                    Probability distributions and risk metrics showing how often extreme conditions occur
                  </p>
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <img 
                      src={`data:image/png;base64,${charts.statistics_chart}`}
                      alt="Statistical Distribution Chart - Risk assessment and probability analysis"
                      className="w-full h-auto rounded"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Use these statistics to estimate the likelihood of adverse conditions for planning outdoor activities
                  </p>
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