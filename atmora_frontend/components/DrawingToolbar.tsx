'use client';

import React from 'react';
import { MapPin, Circle, Square, Pentagon } from 'lucide-react';

interface DrawingToolbarProps {
  selectedTool: 'point' | 'circle' | 'rectangle' | 'polygon' | null;
  onToolSelect: (tool: 'point' | 'circle' | 'rectangle' | 'polygon' | null) => void;
}

const DrawingToolbar: React.FC<DrawingToolbarProps> = ({ selectedTool, onToolSelect }) => {
  const tools = [
    { id: 'point', icon: MapPin, label: 'Point' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'polygon', icon: Pentagon, label: 'Polygon' }
  ] as const;

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
      <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-3 shadow-2xl border border-white/20">
        <div className="flex items-center gap-2">
          {tools.map((tool) => {
            const IconComponent = tool.icon;
            const isSelected = selectedTool === tool.id;
            
            return (
              <button
                key={tool.id}
                onClick={() => onToolSelect(isSelected ? null : tool.id)}
                className={`
                  p-3 rounded-full transition-all duration-200 group relative
                  ${isSelected 
                    ? 'bg-blue-600 text-white shadow-lg scale-110' 
                    : 'hover:bg-gray-100 text-gray-700'
                  }
                `}
                title={tool.label}
              >
                <IconComponent size={20} />
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  {tool.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DrawingToolbar;