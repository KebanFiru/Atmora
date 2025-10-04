'use client';

import React from 'react';
import { Cloud, TreePine } from 'lucide-react';

interface HeaderButtonsProps {
  onWeatherClick: () => void;
  onClimateClick: () => void;
}

const HeaderButtons: React.FC<HeaderButtonsProps> = ({ onWeatherClick, onClimateClick }) => {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
      <div className="flex gap-4">
        <button
          onClick={onWeatherClick}
          className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg border border-white/20 hover:bg-white transition-all duration-200 group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
              <Cloud size={24} className="text-blue-600" />
            </div>
            <span className="font-semibold text-gray-800">Weather</span>
          </div>
        </button>

        <button
          onClick={onClimateClick}
          className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg border border-white/20 hover:bg-white transition-all duration-200 group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
              <TreePine size={24} className="text-green-600" />
            </div>
            <span className="font-semibold text-gray-800">Climate</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default HeaderButtons;