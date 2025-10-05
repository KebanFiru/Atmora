'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, Calendar, ChevronUp, ChevronDown, Users } from 'lucide-react';

interface TimeScrollerProps {
  onDateChange: (date: Date) => void;
  onConfirm: (date: Date) => void;
  selectedGeometry?: {
    type: 'marker' | 'circle' | 'square' | 'rectangle';
    center?: { lat: number; lon: number };
    radius?: number;
    bounds?: [[number, number], [number, number]];
  } | null;
  onPopulationRequest?: (date: Date) => void;
}

const TimeScroller: React.FC<TimeScrollerProps> = ({ 
  onDateChange, 
  onConfirm,
  selectedGeometry,
  onPopulationRequest 
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const handleDateSelect = (year: number, month: number, day: number) => {
    const newDate = new Date(year, month, day);
    setTempDate(newDate);
  };

  const handleConfirm = () => {
    setSelectedDate(tempDate);
    onDateChange(tempDate);
    onConfirm(tempDate);
    setIsOpen(false);
  };

  const quickDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
    onDateChange(newDate);
  };

  const handlePopulationClick = () => {
    if (!selectedGeometry) {
      alert('Please select an area on the map first (using Circle, Square, or Rectangle tool)');
      return;
    }

    if (selectedGeometry.type === 'marker') {
      alert('Population analysis requires an area selection.\nPlease use Circle, Square, or Rectangle tool instead of single marker.');
      return;
    }

    if (onPopulationRequest) {
      onPopulationRequest(selectedDate);
    }
  };

  const canRequestPopulation = selectedGeometry && selectedGeometry.type !== 'marker';

  return (
    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden min-w-[180px]">
        {/* Current Date Display */}
        <div 
          className="p-4 text-center cursor-pointer hover:bg-gray-50/80 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-center mb-2">
            <Calendar size={18} className="text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">Selected Date</span>
          </div>
          
          <div className="text-lg font-bold text-gray-900">
            {selectedDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
          
          <div className="text-xs text-gray-500 mt-1">
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
          </div>
          
          <ChevronDown 
            size={16} 
            className={`mx-auto mt-2 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>

        {/* Quick Actions */}
        <div className="px-4 pb-3 flex gap-2">
          <button
            onClick={() => quickDateChange(-7)}
            className="flex-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            -7d
          </button>
          <button
            onClick={() => quickDateChange(-1)}
            className="flex-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            -1d
          </button>
          <button
            onClick={() => quickDateChange(1)}
            className="flex-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            +1d
          </button>
          <button
            onClick={() => quickDateChange(7)}
            className="flex-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            +7d
          </button>
        </div>

        {/* Date Picker (Expandable) */}
        {isOpen && (
          <div className="border-t border-gray-200/50 p-4 bg-gray-50/50">
            {/* Year/Month Selector */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <select
                value={tempDate.getFullYear()}
                onChange={(e) => handleDateSelect(parseInt(e.target.value), tempDate.getMonth(), tempDate.getDate())}
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              
              <select
                value={tempDate.getMonth()}
                onChange={(e) => handleDateSelect(tempDate.getFullYear(), parseInt(e.target.value), tempDate.getDate())}
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {months.map((month, idx) => (
                  <option key={idx} value={idx}>{month}</option>
                ))}
              </select>
            </div>
            
            {/* Day Selector */}
            <div className="grid grid-cols-7 gap-1 mb-3">
              {Array.from({ length: getDaysInMonth(tempDate.getFullYear(), tempDate.getMonth()) }, (_, i) => i + 1).map(day => (
                <button
                  key={day}
                  onClick={() => handleDateSelect(tempDate.getFullYear(), tempDate.getMonth(), day)}
                  className={`p-1.5 text-xs rounded transition-colors ${
                    tempDate.getDate() === day 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white hover:bg-blue-50 text-gray-700 border border-gray-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            
            {/* Apply Button */}
            <button
              onClick={handleConfirm}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Check size={16} />
              Apply Date
            </button>
          </div>
        )}

        {/* Bring Population Button */}
        <div className="p-4 border-t border-gray-200/50">
          <button
            onClick={handlePopulationClick}
            disabled={!canRequestPopulation}
            className={`w-full py-2.5 px-4 rounded-lg transition-all duration-200 font-medium flex items-center justify-center gap-2 ${
              canRequestPopulation
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md hover:shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title={
              !selectedGeometry
                ? 'Select an area first'
                : selectedGeometry.type === 'marker'
                ? 'Use area tools (Circle, Square, Rectangle)'
                : 'Get population data for selected area'
            }
          >
            <Users size={18} />
            <span className="text-sm">Bring Population</span>
          </button>
          {!canRequestPopulation && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Select an area using Circle, Square, or Rectangle tool
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeScroller;