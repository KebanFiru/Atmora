'use client';

import { useState } from 'react';
import LeafletMap from './LeafletMap';
import SquareSelector from './SquareSelector';

export default function SelectorSwitch() {
  const [mode, setMode] = useState<'marker' | 'square'>('marker');

  return (
    <div className="flex flex-col h-screen">
      <div className="p-4 bg-gray-100 flex gap-4 justify-center">
        <button
          onClick={() => setMode('marker')}
          className={`px-4 py-2 rounded font-semibold ${mode === 'marker' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
        >
          Marker Selector
        </button>
        <button
          onClick={() => setMode('square')}
          className={`px-4 py-2 rounded font-semibold ${mode === 'square' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
        >
          Square Selector
        </button>
      </div>

      <div className="flex-grow">
        {mode === 'marker' ? <LeafletMap /> : <SquareSelector />}
      </div>
    </div>
  );
}
