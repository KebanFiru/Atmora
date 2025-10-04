'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

interface LeafletMapProps {
  onLocationSelect: (longitude: number, latitude: number, geometry?: any) => void;
  drawingMode: 'point' | 'circle' | 'rectangle' | 'polygon' | null;
  isDarkMode: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

// Create a dynamic wrapper for the entire map to avoid SSR issues
const DynamicMap = dynamic(() => import('./LeafletMapInner'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-blue-50">
      <div className="text-center">
        <div className="text-xl font-semibold mb-2">Loading Interactive Map...</div>
        <div className="text-sm opacity-75">Initializing Esri World Map</div>
      </div>
    </div>
  )
});

const LeafletMap: React.FC<LeafletMapProps> = (props) => {
  return <DynamicMap {...props} />;
};

export default LeafletMap;