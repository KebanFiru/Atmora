'use client';

import React, { useState } from 'react';

export default function TestPage() {
  const [zoomLevel, setZoomLevel] = useState(6);
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Map Test Page</h1>
        
        <div className="mb-4 flex gap-4">
          <button 
            onClick={() => setZoomLevel(prev => prev + 1)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Zoom In ({zoomLevel})
          </button>
          <button 
            onClick={() => setZoomLevel(prev => Math.max(1, prev - 1))}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Zoom Out
          </button>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Toggle {isDarkMode ? 'Light' : 'Dark'} Mode
          </button>
        </div>

        <div className="border-4 border-red-500 w-full h-96 bg-yellow-100">
          <div className={`w-full h-full ${isDarkMode ? 'bg-gray-900' : 'bg-blue-100'} flex items-center justify-center text-2xl`}>
            <div>
              <div>Map Container</div>
              <div>Zoom: {zoomLevel}</div>
              <div>Mode: {isDarkMode ? 'Dark' : 'Light'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}