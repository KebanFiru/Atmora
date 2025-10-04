"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

interface RangeDate {
  start: Date;
  end: Date;
}

const RANGE: RangeDate = {
  start: new Date(2024, 0, 1),
  end: new Date(2024, 11, 31),
};

const TOTAL_DAYS = differenceInCalendarDays(RANGE.end, RANGE.start) + 1;

export default function VerticalDateSlider() {
  const [days, setDays] = useState<number>(Math.floor(TOTAL_DAYS / 2));
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(format(addDays(RANGE.start, days), 'yyyy-MM-dd'));

  const railRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setInputValue(format(addDays(RANGE.start, days), 'yyyy-MM-dd'));
  }, [days]);

  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

  const pointerToDays = useCallback((clientY: number) => {
    const rail = railRef.current;
    if (!rail) return days;
    const rect = rail.getBoundingClientRect();
    // percent from top
    const pct = clamp((clientY - rect.top) / rect.height, 0, 1);
    // invert so top is 0 days and bottom is max days
    const inv = pct; // we map top->0
    const d = Math.round(inv * (TOTAL_DAYS - 1));
    return d;
  }, [days]);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const d = pointerToDays(e.clientY);
      setDays(d);
    };
    const onPointerUp = () => {
      if (isDragging) setIsDragging(false);
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [isDragging, pointerToDays]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const handleInputChange = (v: string) => {
    setInputValue(v);
    // try parse immediate
    try {
      const parsed = parseISO(v);
      if (!isNaN(parsed.getTime())) {
        const diff = differenceInCalendarDays(parsed, RANGE.start);
        if (diff >= 0 && diff < TOTAL_DAYS) {
          setDays(diff);
        }
      }
    } catch (err) {
      // ignore
    }
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    setInputValue(format(addDays(RANGE.start, days), 'yyyy-MM-dd'));
  };

  const knobPct = (days / (TOTAL_DAYS - 1)) * 100;

  return (
    <div className="fixed right-6 top-1/2 z-[9999] -translate-y-1/2 flex items-center pointer-events-auto">
      <div className="relative flex items-center" style={{ height: 320 }}>
        {/* date box to left of knob */}
        <div
          className="absolute -right-28 px-3 py-2 rounded-lg bg-white/70 dark:bg-black/60 backdrop-blur-md border border-white/30 shadow-md text-sm text-gray-800 dark:text-white z-50"
          style={{ top: `calc(${knobPct}% - 18px)` }}
        >
          {!isEditing ? (
            <div onClick={() => setIsEditing(true)} className="cursor-text select-none">
              {format(addDays(RANGE.start, days), 'MMM d, yyyy')}
            </div>
          ) : (
            <input
              autoFocus
              className="bg-transparent outline-none text-sm w-32"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleInputBlur}
            />
          )}
        </div>

        {/* rail */}
        <div ref={railRef} className="w-2 h-full bg-gray-200/60 rounded-lg" style={{ height: 320 }}>
          {/* knob */}
          <div
            onPointerDown={handlePointerDown}
            className={`absolute -right-4 w-7 h-7 rounded-full bg-gradient-to-b from-white to-gray-200 dark:from-gray-800 dark:to-black shadow-md border border-white/20 cursor-grab`} 
            style={{ top: `calc(${knobPct}% - 12px)` }}
          />
        </div>
      </div>
    </div>
  );
}
