'use client';

import { useState } from 'react';
import { Circle, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

type LatLng = [number, number];

interface CircleSelectorProps {
  icon?: L.Icon | L.DivIcon;
}

const CircleSelector = ({ icon }: CircleSelectorProps) => {
  const [center, setCenter] = useState<LatLng | null>(null);
  const [radius, setRadius] = useState<number>(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<LatLng | null>(null);

  const calculateDistance = (pos1: LatLng, pos2: LatLng): number => {
    const R = 6371000; // Earth's radius in meters
    const lat1 = pos1[0] * Math.PI / 180;
    const lat2 = pos2[0] * Math.PI / 180;
    const deltaLat = (pos2[0] - pos1[0]) * Math.PI / 180;
    const deltaLng = (pos2[1] - pos1[1]) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  function ClickHandler() {
    useMapEvents({
      click(e) {
        const newPos: LatLng = [e.latlng.lat, e.latlng.lng];
        
        if (!center) {
          // First click - set center
          setCenter(newPos);
          setIsDrawing(true);
        } else if (isDrawing) {
          // Second click - finalize circle
          const finalRadius = calculateDistance(center, newPos);
          setRadius(finalRadius);
          setIsDrawing(false);
        } else {
          // Reset and start new circle
          setCenter(newPos);
          setRadius(0);
          setIsDrawing(true);
        }
      },
      contextmenu() {
        // Right click to reset
        setCenter(null);
        setRadius(0);
        setIsDrawing(false);
      },
      mousemove(e) {
        setCursorPosition([e.latlng.lat, e.latlng.lng]);
        
        if (center && isDrawing) {
          const previewRadius = calculateDistance(center, [e.latlng.lat, e.latlng.lng]);
          setRadius(previewRadius);
        }
      },
      mouseout() {
        setCursorPosition(null);
      },
    });
    return null;
  }

  return (
    <>
      <ClickHandler />
      


      {/* Circle */}
      {center && radius > 0 && (
        <Circle
          center={center}
          radius={radius}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: isDrawing ? 0.2 : 0.3,
            weight: isDrawing ? 2 : 3,
            opacity: 0.8,
            dashArray: isDrawing ? '5, 5' : undefined
          }}
        >
          <Popup>
            <div className="p-2">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="font-semibold text-gray-800">Selected Area</span>
              </div>
              <div className="text-sm text-gray-600">
                <div className="font-semibold text-blue-700 mb-1">🎯 Center Coordinates:</div>
                <div>📍 Lat: {center[0].toFixed(6)}°</div>
                <div>📍 Lng: {center[1].toFixed(6)}°</div>
                <div className="mt-2 p-2 bg-blue-50 rounded border-l-2 border-blue-400">
                  <div className="text-xs text-blue-800 font-medium">Area Details:</div>
                  <div>🔵 Radius: {(radius / 1000).toFixed(2)} km</div>
                  <div>📐 Area: {(Math.PI * Math.pow(radius / 1000, 2)).toFixed(2)} km²</div>
                </div>
              </div>
            </div>
          </Popup>
        </Circle>
      )}

      {/* Cursor preview */}
      {cursorPosition && !center && (
        <Circle
          center={cursorPosition}
          radius={100}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            weight: 2,
            opacity: 0.6,
            dashArray: '3, 3'
          }}
        />
      )}
    </>
  );
};

export default CircleSelector;