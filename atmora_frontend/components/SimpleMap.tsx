'use client';

import React from 'react';

interface SimpleMapProps {
  onLocationSelect: (longitude: number, latitude: number, geometry?: any) => void;
  drawingMode: 'point' | 'circle' | 'rectangle' | 'polygon' | null;
  isDarkMode: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

const SimpleMap: React.FC<SimpleMapProps> = ({ onLocationSelect, drawingMode, isDarkMode, zoom, onZoomChange }) => {
  console.log('SimpleMap rendering with:', { drawingMode, isDarkMode, zoom });
  
  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    console.log('Map clicked in mode:', drawingMode);
    if (drawingMode === 'point') {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 360;
      const y = ((rect.height - (event.clientY - rect.top)) / rect.height - 0.5) * 180;
      console.log('Selected coordinates:', { x, y });
      onLocationSelect(x, y);
    }
  };

  return (
    <div 
      className={`w-full h-screen cursor-crosshair transition-colors duration-300 relative ${
        isDarkMode ? 'bg-gray-900' : 'bg-blue-50'
      }`}
      onClick={handleMapClick}
      style={{
        backgroundImage: isDarkMode 
          ? `
            radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 40%),
            radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 40%),
            radial-gradient(circle at 40% 40%, rgba(17, 24, 39, 1) 0%, rgba(17, 24, 39, 1) 100%)
          `
          : `
            radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.2) 0%, transparent 40%),
            radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.2) 0%, transparent 40%),
            radial-gradient(circle at 40% 40%, rgba(239, 246, 255, 1) 0%, rgba(219, 234, 254, 1) 100%)
          `
      }}
    >
      {/* Simulated map features */}
      <div className="absolute inset-0">
        {/* Simulated coastlines */}
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d="M10,20 Q30,15 50,25 T90,30 L90,100 L10,100 Z"
            fill={isDarkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.3)"}
            stroke={isDarkMode ? "rgba(59, 130, 246, 0.4)" : "rgba(59, 130, 246, 0.5)"}
            strokeWidth="0.2"
          />
          <path
            d="M20,60 Q40,55 60,65 T80,70"
            fill="none"
            stroke={isDarkMode ? "rgba(34, 197, 94, 0.4)" : "rgba(34, 197, 94, 0.6)"}
            strokeWidth="0.3"
          />
        </svg>

        {/* Simulated cities - size changes with zoom */}
        <div className="absolute top-1/3 left-1/4">
          <div 
            className={`rounded-full ${isDarkMode ? 'bg-yellow-400' : 'bg-red-500'} opacity-60 transition-all duration-300`}
            style={{ 
              width: `${Math.max(2, zoom * 0.8)}px`, 
              height: `${Math.max(2, zoom * 0.8)}px` 
            }}
          ></div>
        </div>
        <div className="absolute top-1/2 right-1/3">
          <div 
            className={`rounded-full ${isDarkMode ? 'bg-yellow-400' : 'bg-red-500'} opacity-60 transition-all duration-300`}
            style={{ 
              width: `${Math.max(2, zoom * 0.8)}px`, 
              height: `${Math.max(2, zoom * 0.8)}px` 
            }}
          ></div>
        </div>
        <div className="absolute bottom-1/3 left-1/2">
          <div 
            className={`rounded-full ${isDarkMode ? 'bg-yellow-400' : 'bg-red-500'} opacity-60 transition-all duration-300`}
            style={{ 
              width: `${Math.max(2, zoom * 0.8)}px`, 
              height: `${Math.max(2, zoom * 0.8)}px` 
            }}
          ></div>
        </div>
      </div>

      {/* Status display */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
        <div className={`px-4 py-2 rounded-full backdrop-blur-sm border ${
          isDarkMode 
            ? 'bg-gray-800/80 border-gray-700 text-gray-300' 
            : 'bg-white/80 border-gray-200 text-gray-700'
        }`}>
          <div className="text-sm font-medium">
            {drawingMode ? `${drawingMode.toUpperCase()} Selection Mode` : 'Click a drawing tool to start'}
          </div>
        </div>
      </div>
      
      {/* Grid overlay for coordinates - opacity changes with zoom */}
      <div 
        className="absolute inset-0 transition-opacity duration-300"
        style={{ opacity: Math.min(0.3, zoom * 0.02) }}
      >
        <div className="grid grid-cols-20 grid-rows-12 h-full">
          {Array.from({ length: 240 }).map((_, i) => (
            <div key={i} className={`border ${isDarkMode ? 'border-gray-600' : 'border-gray-400'}`} />
          ))}
        </div>
      </div>

      {/* Zoom level display */}
      <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-lg backdrop-blur-sm text-sm ${
        isDarkMode 
          ? 'bg-gray-800/80 border border-gray-700 text-gray-300' 
          : 'bg-white/80 border border-gray-200 text-gray-700'
      }`}>
        Turkey Region - Zoom Level: {zoom}
      </div>
    </div>
  );
};

export default SimpleMap;