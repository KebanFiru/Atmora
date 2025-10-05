'use client';

import React from 'react';
import { Cloud, TreePine, Sparkles } from 'lucide-react';

interface HeaderButtonsProps {
  onWeatherClick: () => void;
  onClimateClick: () => void;
  onPredictionClick: () => void;
}

const HeaderButtons: React.FC<HeaderButtonsProps> = ({ onWeatherClick, onClimateClick, onPredictionClick }) => {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
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

        <button
          onClick={onPredictionClick}
          className="bg-gradient-to-r from-purple-100 to-pink-100 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg border border-white/20 hover:from-purple-200 hover:to-pink-200 transition-all duration-200 group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-200 rounded-full group-hover:bg-purple-300 transition-colors">
              <Sparkles size={24} className="text-purple-600" />
            </div>
            <span className="font-semibold text-gray-800">Prediction</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default HeaderButtons;