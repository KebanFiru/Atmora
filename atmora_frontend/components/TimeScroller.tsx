'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, Calendar } from 'lucide-react';

interface TimeScrollerProps {
  onDateChange: (date: Date) => void;
  onConfirm: (date: Date) => void;
}

const TimeScroller: React.FC<TimeScrollerProps> = ({ onDateChange, onConfirm }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef(0);
  const startDateRef = useRef(new Date());

  // Generate date range (1 year from now)
  const generateDates = () => {
    const dates = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 180); // 6 months back
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dates = generateDates();
  const currentIndex = dates.findIndex(date => 
    date.toDateString() === selectedDate.toDateString()
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startPosRef.current = e.clientY;
    startDateRef.current = selectedDate;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const deltaY = e.clientY - startPosRef.current;
    const daysDelta = Math.round(deltaY / 20); // 20px per day
    
    const newIndex = Math.max(0, Math.min(dates.length - 1, 
      dates.findIndex(date => date.toDateString() === startDateRef.current.toDateString()) + daysDelta
    ));
    
    const newDate = dates[newIndex];
    setSelectedDate(newDate);
    onDateChange(newDate);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const direction = e.deltaY > 0 ? 1 : -1;
    const newIndex = Math.max(0, Math.min(dates.length - 1, currentIndex + direction));
    const newDate = dates[newIndex];
    setSelectedDate(newDate);
    onDateChange(newDate);
  };

  const handleConfirm = () => {
    onConfirm(selectedDate);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
      };
    }
  }, [isDragging]);

  return (
    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        {/* Date Display */}
        <div className="p-4 border-b border-gray-200 text-center">
          <div className="flex items-center justify-center mb-2">
            <Calendar size={20} className="text-gray-600 mr-2" />
            <span className="font-semibold text-gray-800">Date Selector</span>
          </div>
          <div className="text-lg font-bold text-blue-600">
            {selectedDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </div>
          <div className="text-sm text-gray-500">
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
          </div>
        </div>

        {/* Scroll Track */}
        <div className="relative">
          <div
            ref={scrollRef}
            className={`w-16 h-80 relative overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onWheel={handleWheel}
            style={{ userSelect: 'none' }}
          >
            {/* Background Track */}
            <div className="absolute inset-x-0 top-0 bottom-0 bg-gradient-to-b from-gray-100 via-gray-200 to-gray-100" />
            
            {/* Tick Marks */}
            <div className="absolute inset-0">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute left-2 right-2 border-t border-gray-400"
                  style={{ top: `${(i / 19) * 100}%` }}
                />
              ))}
            </div>

            {/* Handle */}
            <div
              className="absolute left-1 right-1 h-8 bg-blue-600 rounded-full shadow-lg border-2 border-white transition-all duration-150"
              style={{
                top: `${(currentIndex / (dates.length - 1)) * (100 - 10)}%`,
                transform: isDragging ? 'scale(1.1)' : 'scale(1)'
              }}
            >
              <div className="w-full h-full bg-gradient-to-b from-blue-400 to-blue-600 rounded-full" />
            </div>

            {/* Center Line */}
            <div className="absolute left-0 right-0 top-1/2 transform -translate-y-0.5 h-0.5 bg-blue-600 opacity-50" />
          </div>

          {/* Lock Mechanism Visual */}
          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-gray-400 via-gray-600 to-gray-400" />
          <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-gray-400 via-gray-600 to-gray-400" />
        </div>

        {/* Confirm Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleConfirm}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Check size={16} />
            Onayla
          </button>
        </div>

        {/* Instructions */}
        <div className="p-3 bg-gray-50 text-xs text-gray-600 text-center">
          <div>Scroll or drag to change date</div>
          <div>Click confirm to apply</div>
        </div>
      </div>
    </div>
  );
};

export default TimeScroller;