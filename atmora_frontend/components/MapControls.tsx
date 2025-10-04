'use client';

import React from 'react';
import { Plus, Minus, Sun, Moon } from 'lucide-react';

interface MapControlsProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({ 
  isDarkMode, 
  onToggleDarkMode, 
  onZoomIn, 
  onZoomOut 
}) => {
  return (
    <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
      {/* Zoom Controls */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 overflow-hidden">
        <button
          onClick={onZoomIn}
          className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition-colors border-b border-gray-200"
          title="Zoom In"
        >
          <Plus size={20} className="text-gray-700" />
        </button>
        <button
          onClick={onZoomOut}
          className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition-colors"
          title="Zoom Out"
        >
          <Minus size={20} className="text-gray-700" />
        </button>
      </div>

      {/* Theme Toggle */}
      <button
        onClick={onToggleDarkMode}
        className={`
          w-12 h-12 rounded-lg shadow-lg border transition-all duration-300
          ${isDarkMode 
            ? 'bg-gray-800/90 border-gray-700 text-yellow-400 hover:bg-gray-700/90' 
            : 'bg-white/90 border-white/20 text-gray-700 hover:bg-gray-100'
          }
          backdrop-blur-sm flex items-center justify-center
        `}
        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </div>
  );
};

export default MapControls;