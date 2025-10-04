'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, Calendar } from 'lucide-react';
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

interface TimeScrollerProps {
  onDateChange?: (date: Date) => void;
  onConfirm?: (date: Date) => void;
}

const START = new Date(2024, 0, 1);
const END = new Date(2024, 11, 31);
const TOTAL = differenceInCalendarDays(END, START) + 1;

const TimeScroller: React.FC<TimeScrollerProps> = ({ onDateChange, onConfirm }) => {
  const [index, setIndex] = useState<number>(Math.floor(TOTAL / 2));
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    onDateChange?.(addDays(START, index));
  }, [index, onDateChange]);

  // Pointer handlers
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = (e.clientY - rect.top) / rect.height;
      const clamped = Math.max(0, Math.min(1, pct));
      const newIndex = Math.round(clamped * (TOTAL - 1));
      setIndex(newIndex);
    };

    const onPointerUp = () => {
      if (isDragging) setIsDragging(false);
      pointerIdRef.current = null;
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [isDragging]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    pointerIdRef.current = e.pointerId;
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const dir = e.deltaY > 0 ? 1 : -1;
    setIndex((i) => Math.max(0, Math.min(TOTAL - 1, i + dir)));
  };

  const handleConfirm = () => {
    onConfirm?.(addDays(START, index));
  };

  const selectedDate = addDays(START, index);

  return (
    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-[9999]">
      <div className="bg-white/90 dark:bg-black/60 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden w-56">
        {/* Date Display */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 text-center">
          <div className="flex items-center justify-center mb-2">
            <Calendar size={18} className="text-gray-600 dark:text-gray-300 mr-2" />
            <span className="font-semibold text-gray-800 dark:text-gray-100">Date Selector</span>
          </div>
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {format(selectedDate, 'MMM d, yyyy')}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-300">
            {format(selectedDate, 'EEEE')}
          </div>
        </div>

        {/* Scroll Track */}
        <div className="relative p-4">
          <div
            ref={containerRef}
            className={`w-16 h-80 relative mx-auto overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onPointerDown={handlePointerDown}
            onWheel={handleWheel}
            style={{ userSelect: 'none' }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-lg" />

            {/* ticks */}
            <div className="absolute inset-0">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="absolute left-2 right-2 border-t border-gray-300 dark:border-gray-600" style={{ top: `${(i / 23) * 100}%` }} />
              ))}
            </div>

            {/* knob */}
            <div
              className="absolute left-1 right-1 h-8 rounded-full shadow-lg border-2 border-white transform transition-transform"
              style={{ top: `${(index / (TOTAL - 1)) * (100 - 4)}%`, transform: isDragging ? 'scale(1.06)' : 'scale(1)' }}
            >
              <div className="w-full h-full bg-gradient-to-b from-blue-400 to-blue-600 rounded-full" />
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleConfirm}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Check size={16} />
            Confirm
          </button>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-transparent text-xs text-gray-600 dark:text-gray-300 text-center">
          <div>Drag or scroll to change date</div>
        </div>
      </div>
    </div>
  );
};

export default TimeScroller;