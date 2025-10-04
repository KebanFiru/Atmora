'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Square as SquareIcon, ChevronDown, ChevronUp } from 'lucide-react';

const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false });

export default function SelectorSelector() {
  const [mode, setMode] = useState<'marker' | 'square'>('marker');
  const [isBarOpen, setIsBarOpen] = useState<boolean>(true);

  return (
    <div className="relative w-full h-screen">
      <div className="absolute inset-0">
        <LeafletMap mode={mode} />
      </div>

      {/* Bottom sliding buttons container */}
      <div className="fixed left-1/2 bottom-0 -translate-x-1/2 z-[9999] pointer-events-none">
        <div
          className="flex gap-6 items-end justify-center pb-16" 
          style={{ transform: `translateY(${isBarOpen ? '0' : '120%'})`, transition: 'transform 320ms ease' }}
        >
          <button
            onClick={() => setMode('marker')}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 min-w-[120px] rounded-2xl shadow-xl backdrop-blur-md border border-white/10 bg-black/90 ${mode === 'marker' ? 'ring-2 ring-blue-400' : ''}`}
          >
            <span className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center">
              <MapPin size={16} color="#93c5fd" />
            </span>
            <span className="text-white text-base font-semibold">Marker</span>
          </button>

          <button
            onClick={() => setMode('square')}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 min-w-[120px] rounded-2xl shadow-xl backdrop-blur-md border border-white/10 bg-black/90 ${mode === 'square' ? 'ring-2 ring-green-300' : ''}`}
          >
            <span className="w-8 h-8 rounded-full bg-green-900 flex items-center justify-center">
              <SquareIcon size={16} color="#bbf7d0" />
            </span>
            <span className="text-white text-base font-semibold">Square</span>
          </button>
        </div>
      </div>

      {/* Bottom center toggle (smaller) */}
      <div className="fixed left-1/2 bottom-4 -translate-x-1/2 z-[10000] pointer-events-auto">
        <button
          onClick={() => setIsBarOpen((s) => !s)}
          className="w-10 h-10 rounded-full bg-white/95 dark:bg-black/80 backdrop-blur-md shadow-lg flex items-center justify-center border border-white/40 transform transition-transform duration-300"
        >
          {isBarOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>
    </div>
  );
}
