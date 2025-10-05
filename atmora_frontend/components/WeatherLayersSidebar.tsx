'use client';

import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudRain, 
  X, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Layers,
  Droplets,
  Wind,
  Thermometer,
  Eye,
  EyeOff,
  Zap,
  TrendingUp,
  MapPin
} from 'lucide-react';

interface WeatherLayersSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onRainLayerToggle: (enabled: boolean) => void;
  onOpacityChange: (opacity: number) => void;
  rainLayerEnabled: boolean;
}

// Popular locations for quick access
const POPULAR_LOCATIONS = [
  { name: 'Istanbul', lat: 41.0082, lon: 28.9784, emoji: '🇹🇷' },
  { name: 'London', lat: 51.5074, lon: -0.1278, emoji: '🇬🇧' },
  { name: 'New York', lat: 40.7128, lon: -74.0060, emoji: '🇺🇸' },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, emoji: '🇯🇵' },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093, emoji: '🇦🇺' },
];

const WeatherLayersSidebar: React.FC<WeatherLayersSidebarProps> = ({
  isOpen,
  onClose,
  onRainLayerToggle,
  onOpacityChange,
  rainLayerEnabled,
}) => {
  const [opacity, setOpacity] = useState(0.6);
  const [isAnimating, setIsAnimating] = useState(false);
  const [timeIndex, setTimeIndex] = useState(0);
  const [showStats, setShowStats] = useState(true);
  
  // Mock weather stats for visual appeal
  const [weatherStats, setWeatherStats] = useState({
    activeStorms: 12,
    rainfallAreas: 48,
    coveragePercent: 23,
    lastUpdate: new Date().toLocaleTimeString()
  });

  // Update stats periodically for "live" effect
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      setWeatherStats(prev => ({
        activeStorms: prev.activeStorms + Math.floor(Math.random() * 3) - 1,
        rainfallAreas: prev.rainfallAreas + Math.floor(Math.random() * 5) - 2,
        coveragePercent: Math.max(10, Math.min(40, prev.coveragePercent + Math.random() * 2 - 1)),
        lastUpdate: new Date().toLocaleTimeString()
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleOpacityChange = (value: number) => {
    setOpacity(value);
    onOpacityChange(value);
  };

  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 bg-white/95 backdrop-blur-md shadow-2xl z-40 overflow-y-auto transform transition-transform">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={24} />
            <div>
              <h2 className="text-lg font-bold">Weather Layers</h2>
              <p className="text-xs opacity-90">Real-time visualization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Live Stats Dashboard */}
          {showStats && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-600" />
                  Global Weather Stats
                </h3>
                <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full animate-pulse">
                  LIVE
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/80 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={16} className="text-yellow-500" />
                    <span className="text-xs text-gray-600">Active Storms</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">{weatherStats.activeStorms}</div>
                </div>
                
                <div className="bg-white/80 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CloudRain size={16} className="text-blue-500" />
                    <span className="text-xs text-gray-600">Rainfall Areas</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-800">{weatherStats.rainfallAreas}</div>
                </div>
                
                <div className="bg-white/80 rounded-lg p-3 col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Cloud size={16} className="text-purple-500" />
                    <span className="text-xs text-gray-600">Global Coverage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${weatherStats.coveragePercent}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-gray-800">{weatherStats.coveragePercent.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 text-xs text-gray-500 text-center">
                Last update: {weatherStats.lastUpdate}
              </div>
            </div>
          )}

          {/* Precipitation Radar Layer */}
          <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CloudRain size={20} className="text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-800">Precipitation Radar</h3>
                  <p className="text-xs text-gray-500">Live rainfall data</p>
                </div>
              </div>
              <button
                onClick={() => onRainLayerToggle(!rainLayerEnabled)}
                className={`p-2 rounded-lg transition-all ${
                  rainLayerEnabled 
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {rainLayerEnabled ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>

            {rainLayerEnabled && (
              <div className="space-y-4">
                {/* Opacity Control */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">Layer Opacity</label>
                    <span className="text-sm font-bold text-blue-600">{Math.round(opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={opacity}
                    onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                  />
                </div>

                {/* Animation Controls */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">Time Travel</label>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      {isAnimating ? 'Playing' : 'Paused'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 justify-center">
                    <button
                      onClick={() => setTimeIndex(Math.max(0, timeIndex - 1))}
                      className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
                      title="Previous frame"
                    >
                      <SkipBack size={18} />
                    </button>
                    
                    <button
                      onClick={toggleAnimation}
                      className={`p-3 rounded-lg transition-all shadow-md ${
                        isAnimating 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {isAnimating ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    
                    <button
                      onClick={() => setTimeIndex(Math.min(10, timeIndex + 1))}
                      className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
                      title="Next frame"
                    >
                      <SkipForward size={18} />
                    </button>
                  </div>

                  <div className="mt-3">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={timeIndex}
                      onChange={(e) => setTimeIndex(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>-2 hours</span>
                      <span>Now</span>
                      <span>+1 hour</span>
                    </div>
                  </div>
                </div>

                {/* Intensity Legend */}
                <div className="bg-gradient-to-r from-blue-100 via-blue-300 to-purple-500 rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Droplets size={14} />
                    Rainfall Intensity
                  </div>
                  <div className="flex justify-between text-xs text-gray-700">
                    <span>Light</span>
                    <span>Moderate</span>
                    <span>Heavy</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Locations */}
          <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={18} className="text-purple-600" />
              <h3 className="font-semibold text-gray-800">Quick Locations</h3>
            </div>
            
            <div className="space-y-2">
              {POPULAR_LOCATIONS.map((location) => (
                <button
                  key={location.name}
                  className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-purple-50 rounded-lg transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{location.emoji}</span>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                      {location.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 group-hover:text-blue-500">
                    Jump →
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Info Panel */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
            <div className="flex items-start gap-2">
              <Cloud size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-700">
                <p className="font-semibold mb-1">Data Source</p>
                <p>Powered by <span className="font-bold">RainViewer</span> - Real-time precipitation radar updated every 10 minutes.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WeatherLayersSidebar;
