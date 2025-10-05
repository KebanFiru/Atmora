'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, AlertCircle, CheckCircle2, Calendar, TrendingUp } from 'lucide-react';

interface PredictionFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: { longitude: number; latitude: number } | null;
}

interface PredictionResult {
  predictions: Array<{
    date: string;
    temperature: number;
    wind_speed: number;
    precipitation: number;
    humidity: number;
  }>;
  accuracy_score: number;
  confidence_level: string;
  days_from_2024: number;
  target_date: string;
  location: {
    latitude: number;
    longitude: number;
  };
  summary: {
    temperature: {
      value: number;
      description: string;
      unit: string;
    };
    wind_speed: {
      value: number;
      description: string;
      unit: string;
    };
    precipitation: {
      value: number;
      description: string;
      unit: string;
    };
    humidity: {
      value: number;
      unit: string;
    };
    overall_condition: string;
    accuracy_bar: {
      score: number;
      color: string;
      confidence: string;
    };
    warning: string;
  };
}

interface ProgressResponse {
  task_id: string;
  progress: number;
  status: string;
  elapsed_time: number;
  completed?: boolean;
  result?: PredictionResult;
  error?: string;
}

const PredictionForm: React.FC<PredictionFormProps> = ({ 
  isOpen, 
  onClose, 
  selectedLocation
}) => {
  const [targetDate, setTargetDate] = useState(() => {
    // Default to 30 days from now
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });
  const [horizon, setHorizon] = useState(1);
  const [isPredicting, setIsPredicting] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [predictionResults, setPredictionResults] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = 'http://localhost:5000/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) return;

    setIsPredicting(true);
    setError(null);
    setPredictionResults(null);

    try {
      // Start prediction
      const response = await fetch(`${API_BASE_URL}/prediction/forecast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          targetDate: targetDate,
          horizon: horizon,
          climate_type: "mediterranean"  // Akdeniz iklimi
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Prediction failed');
      }

      const data = await response.json();
      setCurrentTaskId(data.task_id);
      
      // Start polling for progress
      pollProgress(data.task_id);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed');
      setIsPredicting(false);
    }
  };

  const pollProgress = async (taskId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/prediction/progress/${taskId}`);
        
        if (!response.ok) {
          throw new Error('Failed to get progress');
        }

        const progressData: ProgressResponse = await response.json();
        setProgress(progressData);

        if (progressData.completed) {
          clearInterval(pollInterval);
          setIsPredicting(false);
          
          if (progressData.result) {
            setPredictionResults(progressData.result);
          }
        }

        if (progressData.error) {
          clearInterval(pollInterval);
          setError(progressData.error);
          setIsPredicting(false);
        }

      } catch (err) {
        clearInterval(pollInterval);
        setError(err instanceof Error ? err.message : 'Failed to get progress');
        setIsPredicting(false);
      }
    }, 2000);
  };

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Get max date (1 year from now)
  const getMaxDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split('T')[0];
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentTaskId && !isPredicting) {
        fetch(`${API_BASE_URL}/prediction/cleanup/${currentTaskId}`, {
          method: 'DELETE'
        }).catch(console.error);
      }
    };
  }, [currentTaskId, isPredicting]);

  if (!isOpen) return null;

  // Get accuracy bar color class
  const getAccuracyColorClass = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Get accuracy icon
  const getAccuracyIcon = (level: string) => {
    if (level === 'high') return '✅';
    if (level === 'medium') return '⚠️';
    return '❌';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="bg-black/20 backdrop-blur-sm absolute inset-0" onClick={onClose} />
      
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 w-full max-w-4xl mx-4 relative max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Sparkles size={28} className="text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-800">Weather Prediction</h2>
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
              <div className="mb-6 p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                <h3 className="font-semibold text-gray-800 mb-2">📍 Selected Location</h3>
                <p className="text-gray-600 mb-2">
                  Latitude: {selectedLocation.latitude.toFixed(4)}°, 
                  Longitude: {selectedLocation.longitude.toFixed(4)}°
                </p>
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <p className="text-sm font-medium text-purple-700">
                    🌊 Climate Type: <span className="font-bold">Mediterranean (Akdeniz İklimi)</span>
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Predictions based on 4-year historical data from Mediterranean region
                  </p>
                </div>
              </div>
            )}

            {/* Prediction Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    min={getMinDate()}
                    max={getMaxDate()}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be in the future (max 1 year)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prediction Horizon (days)
                  </label>
                  <input
                    type="number"
                    value={horizon}
                    min="1"
                    max="90"
                    onChange={(e) => setHorizon(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Number of days to predict (1-90)</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={!selectedLocation || isPredicting}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all font-medium shadow-lg"
              >
                {isPredicting ? (
                  <>
                    <Loader2 size={20} className="inline mr-2 animate-spin" />
                    Predicting...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} className="inline mr-2" />
                    Predict Weather
                  </>
                )}
              </button>
            </form>

            {/* Progress Display */}
            {isPredicting && progress && (
              <div className="mt-8 p-6 bg-purple-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  <Loader2 size={20} className="inline mr-2 animate-spin" />
                  Prediction in Progress
                </h3>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{progress.status}</span>
                    <span>{progress.progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.progress}%` }}
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
                  Prediction Error
                </h3>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Prediction Results */}
            {predictionResults && (
              <div className="mt-8 space-y-6">
                {/* Success Header */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    <CheckCircle2 size={20} className="inline mr-2" />
                    Prediction Complete!
                  </h3>
                  <p className="text-sm text-gray-700">
                    Target Date: <span className="font-bold">{predictionResults.target_date}</span> ({predictionResults.days_from_2024} days from training data)
                  </p>
                </div>

                {/* Accuracy Bar */}
                <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {getAccuracyIcon(predictionResults.summary.accuracy_bar.confidence)} Prediction Accuracy
                  </h3>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span className="font-medium">Confidence Level: {predictionResults.summary.accuracy_bar.confidence.toUpperCase()}</span>
                      <span className="font-bold">{predictionResults.summary.accuracy_bar.score.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div 
                        className={`${getAccuracyColorClass(predictionResults.summary.accuracy_bar.score)} h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                        style={{ width: `${predictionResults.summary.accuracy_bar.score}%` }}
                      >
                        <span className="text-white text-xs font-bold">{predictionResults.summary.accuracy_bar.score.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 italic">
                    {predictionResults.summary.warning}
                  </p>
                </div>

                {/* Weather Prediction Summary */}
                <div className="p-6 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    <TrendingUp size={20} className="inline mr-2" />
                    Predicted Conditions
                  </h3>
                  <p className="text-lg font-medium text-gray-700 mb-6">
                    {predictionResults.summary.overall_condition}
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Temperature */}
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-3xl font-bold text-orange-600 mb-1">
                        {predictionResults.summary.temperature.value}{predictionResults.summary.temperature.unit}
                      </div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Temperature</div>
                      <div className="text-xs text-gray-500">{predictionResults.summary.temperature.description}</div>
                    </div>

                    {/* Wind Speed */}
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {predictionResults.summary.wind_speed.value}{predictionResults.summary.wind_speed.unit}
                      </div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Wind Speed</div>
                      <div className="text-xs text-gray-500">{predictionResults.summary.wind_speed.description}</div>
                    </div>

                    {/* Precipitation */}
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        {predictionResults.summary.precipitation.value}{predictionResults.summary.precipitation.unit}
                      </div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Precipitation</div>
                      <div className="text-xs text-gray-500">{predictionResults.summary.precipitation.description}</div>
                    </div>

                    {/* Humidity */}
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-3xl font-bold text-cyan-600 mb-1">
                        {predictionResults.summary.humidity.value}{predictionResults.summary.humidity.unit}
                      </div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Humidity</div>
                      <div className="text-xs text-gray-500">relative humidity</div>
                    </div>
                  </div>
                </div>

                {/* Multi-day Predictions */}
                {predictionResults.predictions.length > 1 && (
                  <div className="p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Extended Forecast ({predictionResults.predictions.length} days)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b-2 border-gray-300">
                            <th className="text-left py-2 px-3">Date</th>
                            <th className="text-center py-2 px-3">Temp (°C)</th>
                            <th className="text-center py-2 px-3">Wind (m/s)</th>
                            <th className="text-center py-2 px-3">Precip (mm)</th>
                            <th className="text-center py-2 px-3">Humidity (%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {predictionResults.predictions.map((day, idx) => (
                            <tr key={idx} className="border-b border-gray-200 hover:bg-white">
                              <td className="py-2 px-3 font-medium">{day.date}</td>
                              <td className="text-center py-2 px-3">{day.temperature.toFixed(1)}</td>
                              <td className="text-center py-2 px-3">{day.wind_speed.toFixed(1)}</td>
                              <td className="text-center py-2 px-3">{day.precipitation.toFixed(1)}</td>
                              <td className="text-center py-2 px-3">{day.humidity.toFixed(1)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Prediction Metadata */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg text-xs text-gray-600 border border-purple-200">
                  <p className="mb-1">
                    <span className="font-medium">🌊 Climate Type:</span> Mediterranean (Akdeniz İklimi)
                  </p>
                  <p className="mb-1">
                    <span className="font-medium">📊 Model:</span> HistGradientBoostingRegressor with 4-year historical training
                  </p>
                  <p className="mb-1">
                    <span className="font-medium">📅 Training Period:</span> Jan 2020 - Dec 2024 (İtalya/İngiltere verisi)
                  </p>
                  <p>
                    <span className="font-medium">⚠️ Accuracy Note:</span> Accuracy decreases by ~1% every 3 days from Dec 31, 2024
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

export default PredictionForm;
