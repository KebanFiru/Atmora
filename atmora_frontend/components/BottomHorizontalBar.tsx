"use client";

import React, { useState } from 'react';
import { MapPin, Square } from 'lucide-react';

export default function BottomHorizontalBar() {
  const [mode, setMode] = useState<'marker' | 'square'>('marker');
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="fixed left-1/2 bottom-8 -translate-x-1/2 z-[9998] pointer-events-auto">
      <div
        className="flex items-center gap-4 py-2 px-4 rounded-2xl backdrop-blur-md bg-white/60 dark:bg-black/60 border border-white/20 shadow-lg transition-transform"
        style={{ transform: `translateY(${isOpen ? '0' : '140%'})` }}
      >
        <button onClick={() => setMode('marker')} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${mode === 'marker' ? 'bg-white/30' : 'bg-transparent'}`}>
          <span className="rounded-full w-8 h-8 flex items-center justify-center bg-blue-100">
            <MapPin size={18} color="#2563eb" />
          </span>
          <span className="text-sm font-medium text-gray-800 dark:text-white">Marker Selection</span>
        </button>

        <button onClick={() => setMode('square')} className={`flex items-center gap-2 px-4 py-2 rounded-lg ${mode === 'square' ? 'bg-white/30' : 'bg-transparent'}`}>
          <span className="rounded-full w-8 h-8 flex items-center justify-center bg-green-100">
            <Square size={18} color="#16a34a" />
          </span>
          <span className="text-sm font-medium text-gray-800 dark:text-white">Square Selector</span>
        </button>
      </div>
    </div>
  );
}
