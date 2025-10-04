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
    <div className="absolute top-6 left-6 flex flex-col gap-3 z-20">
      {/* Zoom Controls */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/30 overflow-hidden">
        <button
          onClick={() => {
            console.log('Zoom In button clicked');
            onZoomIn();
          }}
          className="w-14 h-14 flex items-center justify-center hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 border-b border-gray-200/50 group"
          title="Zoom In"
        >
          <Plus size={22} className="text-gray-700 group-hover:text-blue-600 group-hover:scale-110 transition-all" strokeWidth={2.5} />
        </button>
        <button
          onClick={() => {
            console.log('Zoom Out button clicked');
            onZoomOut();
          }}
          className="w-14 h-14 flex items-center justify-center hover:bg-blue-50 active:bg-blue-100 transition-all duration-200 group"
          title="Zoom Out"
        >
          <Minus size={22} className="text-gray-700 group-hover:text-blue-600 group-hover:scale-110 transition-all" strokeWidth={2.5} />
        </button>
      </div>

      {/* Theme Toggle */}
      <button
        onClick={onToggleDarkMode}
        className={`
          w-14 h-14 rounded-2xl shadow-xl border transition-all duration-500 group relative overflow-hidden
          ${isDarkMode 
            ? 'bg-gray-900/95 border-gray-700/50 text-amber-400 hover:bg-gray-800/95' 
            : 'bg-white/95 border-gray-200/30 text-gray-700 hover:bg-gray-50'
          }
          backdrop-blur-md flex items-center justify-center
        `}
        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        <div className="relative z-10">
          {isDarkMode ? (
            <Sun size={22} className="group-hover:scale-110 group-hover:rotate-45 transition-all duration-300" strokeWidth={2.5} />
          ) : (
            <Moon size={22} className="group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300" strokeWidth={2.5} />
          )}
        </div>
        
        {/* Background animation */}
        <div className={`absolute inset-0 transition-all duration-500 ${isDarkMode ? 'bg-gradient-to-br from-amber-400/10 to-orange-500/10' : 'bg-gradient-to-br from-blue-400/10 to-purple-500/10'} opacity-0 group-hover:opacity-100`}></div>
      </button>
    </div>
  );
};

export default MapControls;