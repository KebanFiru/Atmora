'use client';

import React from 'react';
import { MapPin, Circle, RectangleHorizontal } from 'lucide-react';

// Custom Pentagon Icon Component
const PentagonIcon = ({ size = 22, strokeWidth = 2, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 2L22 9L18 21H6L2 9L12 2Z" />
  </svg>
);

interface DrawingToolbarProps {
  selectedTool: 'marker' | 'square' | 'circle' | 'rectangle' | null;
  onToolSelect: (tool: 'marker' | 'square' | 'circle' | 'rectangle' | null) => void;
}

const DrawingToolbar: React.FC<DrawingToolbarProps> = ({ selectedTool, onToolSelect }) => {
  const tools = [
    { id: 'marker', icon: MapPin, label: 'Point Marker', color: 'red' },
    { id: 'circle', icon: Circle, label: 'Circle Tool', color: 'blue' },
    { id: 'rectangle', icon: RectangleHorizontal, label: 'Rectangle Tool', color: 'green' },
    { id: 'square', icon: PentagonIcon, label: 'Pentagon Tool', color: 'purple' }
  ] as const;

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl px-6 py-4 shadow-xl border border-gray-200/30">
        <div className="flex items-center gap-4">
          {tools.map((tool) => {
            const IconComponent = tool.icon;
            const isSelected = selectedTool === tool.id;
            
            return (
              <button
                key={tool.id}
                onClick={() => onToolSelect(isSelected ? null : tool.id)}
                className={`
                  relative p-4 rounded-xl transition-all duration-300 group
                  ${isSelected 
                    ? `bg-${tool.color}-500 text-white shadow-lg shadow-${tool.color}-200 scale-105` 
                    : 'hover:bg-gray-50 text-gray-600 hover:scale-102'
                  }
                `}
                title={tool.label}
              >
                <IconComponent size={22} strokeWidth={isSelected ? 2.5 : 2} />
                
                {/* Active indicator */}
                {isSelected && (
                  <div className={`absolute -top-1 -right-1 w-3 h-3 bg-${tool.color}-400 rounded-full animate-ping`}></div>
                )}
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-gray-900/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap backdrop-blur-sm">
                  <div className="font-medium">{tool.label}</div>
                  <div className="text-xs opacity-70 mt-0.5">
                    {isSelected ? 'Click to deselect' : 'Click to select'}
                  </div>
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900/90"></div>
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Tool Status */}
        <div className="mt-3 pt-3 border-t border-gray-200/50">
          <div className="text-center">
            <div className="text-xs font-medium text-gray-600">
              {selectedTool ? `${tools.find(t => t.id === selectedTool)?.label} Active` : 'Select Tool'}
            </div>
            {selectedTool && (
              <div className="text-xs text-gray-500 mt-0.5">
                Click map to interact
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawingToolbar;