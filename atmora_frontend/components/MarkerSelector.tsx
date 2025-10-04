'use client';

import { Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useState, useEffect } from 'react';

interface MarkerSelectorProps {
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
  icon?: L.Icon | L.DivIcon;
}

export default function MarkerSelector({ position, setPosition, icon }: MarkerSelectorProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<[number, number] | null>(null);

  useMapEvents({
    click(e) {
      const newPosition: [number, number] = [e.latlng.lat, e.latlng.lng];
      
      // Start animation
      setIsAnimating(true);
      
      // Update position immediately
      setPosition(newPosition);
      
      // Stop animation after brief delay
      setTimeout(() => {
        setIsAnimating(false);
      }, 500);
    },
    mousemove(e) {
      // Continuously update cursor position for preview
      setCursorPosition([e.latlng.lat, e.latlng.lng]);
    },
    mouseout() {
      // Hide cursor preview when mouse leaves map
      setCursorPosition(null);
    }
  });

  return (
    <>
      {/* Main Marker */}
      <Marker position={position} icon={icon}>
        <Popup className="custom-popup">
          <div className="p-2">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
              <span className="font-semibold text-gray-800">Selected Location</span>
            </div>
            <div className="text-sm text-gray-600">
              <div className="font-semibold text-red-700 mb-1">🎯 Point Coordinates:</div>
              <div>📍 Latitude: {position[0].toFixed(6)}°</div>
              <div>📍 Longitude: {position[1].toFixed(6)}°</div>
            </div>
            <div className="mt-2 text-xs text-blue-600 font-medium">
              Click anywhere to move marker
            </div>
          </div>
        </Popup>
      </Marker>

      {/* Cursor Following Preview - Transparent Flag */}
      {cursorPosition && (
        <>
          {/* Flag pole */}
          <Circle
            center={cursorPosition}
            radius={2}
            pathOptions={{
              color: '#8b5cf6',
              fillColor: '#8b5cf6',
              fillOpacity: 0.8,
              weight: 2,
              opacity: 1
            }}
          />
          
          {/* Flag base circle */}
          <Circle
            center={cursorPosition}
            radius={25}
            pathOptions={{
              color: '#ef4444',
              fillColor: '#ef4444',
              fillOpacity: 0.15,
              weight: 2,
              opacity: 0.6,
              dashArray: '8, 4'
            }}
          />
          
          {/* Flag shadow/area */}
          <Circle
            center={cursorPosition}
            radius={12}
            pathOptions={{
              color: '#dc2626',
              fillColor: '#dc2626',
              fillOpacity: 0.3,
              weight: 1,
              opacity: 0.8
            }}
          />
          
          {/* Inner dot */}
          <Circle
            center={cursorPosition}
            radius={3}
            pathOptions={{
              color: '#ffffff',
              fillColor: '#ef4444',
              fillOpacity: 0.9,
              weight: 2,
              opacity: 1
            }}
          />
        </>
      )}

      {/* Accuracy Circle around main marker */}
      <Circle
        center={position}
        radius={50}
        pathOptions={{
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.1,
          weight: 1,
          opacity: 0.4
        }}
      />

      {/* Click animation */}
      {isAnimating && (
        <Circle
          center={position}
          radius={100}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            weight: 2,
            opacity: 0.6
          }}
          className="animate-ping"
        />
      )}
    </>
  );
}
