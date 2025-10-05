'use client';

import { useState } from 'react';
import { Rectangle, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

type LatLng = [number, number];
type Bounds = [[number, number], [number, number]];

interface RectangleSelectorProps {
  icon?: L.Icon | L.DivIcon;
  onShapeComplete?: (center: [number, number], geometry?: any) => void;
}

const RectangleSelector = ({ icon, onShapeComplete }: RectangleSelectorProps) => {
  const [startPoint, setStartPoint] = useState<LatLng | null>(null);
  const [endPoint, setEndPoint] = useState<LatLng | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<LatLng | null>(null);

  const createBounds = (start: LatLng, end: LatLng): Bounds => {
    const minLat = Math.min(start[0], end[0]);
    const maxLat = Math.max(start[0], end[0]);
    const minLng = Math.min(start[1], end[1]);
    const maxLng = Math.max(start[1], end[1]);
    
    return [[minLat, minLng], [maxLat, maxLng]];
  };

  const calculateCenter = (start: LatLng, end: LatLng): LatLng => {
    const centerLat = (start[0] + end[0]) / 2;
    const centerLng = (start[1] + end[1]) / 2;
    return [centerLat, centerLng];
  };

  const calculateArea = (start: LatLng, end: LatLng): number => {
    // Approximate area calculation in km²
    const latDiff = Math.abs(start[0] - end[0]);
    const lngDiff = Math.abs(start[1] - end[1]);
    // Rough conversion: 1 degree ≈ 111 km
    const width = lngDiff * 111 * Math.cos((start[0] + end[0]) / 2 * Math.PI / 180);
    const height = latDiff * 111;
    return width * height;
  };

  function ClickHandler() {
    useMapEvents({
      click(e) {
        const newPos: LatLng = [e.latlng.lat, e.latlng.lng];
        
        if (!startPoint) {
          // First click - set start point
          setStartPoint(newPos);
          setIsDrawing(true);
        } else if (isDrawing) {
          // Second click - finalize rectangle
          setEndPoint(newPos);
          setIsDrawing(false);
          
          // Calculate and notify parent about center
          const rectCenter = calculateCenter(startPoint, newPos);
          if (onShapeComplete) {
            onShapeComplete(rectCenter, { type: 'rectangle', bounds: createBounds(startPoint, newPos) });
          }
        } else {
          // Reset and start new rectangle
          setStartPoint(newPos);
          setEndPoint(null);
          setIsDrawing(true);
        }
      },
      contextmenu() {
        // Right click to reset
        setStartPoint(null);
        setEndPoint(null);
        setIsDrawing(false);
      },
      mousemove(e) {
        setCursorPosition([e.latlng.lat, e.latlng.lng]);
        
        if (startPoint && isDrawing) {
          setEndPoint([e.latlng.lat, e.latlng.lng]);
        }
      },
      mouseout() {
        setCursorPosition(null);
      },
    });
    return null;
  }

  const bounds = startPoint && endPoint ? createBounds(startPoint, endPoint) : null;

  return (
    <>
      <ClickHandler />
      
      {/* Corner markers for completed rectangle */}
      {startPoint && endPoint && !isDrawing && (
        <>
          <Marker position={startPoint} icon={icon}>
            <Popup>
              <div className="p-2">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="font-semibold text-gray-800">Corner</span>
                </div>
                <div className="text-sm text-gray-600">
                  <div>📍 {startPoint[0].toFixed(6)}°, {startPoint[1].toFixed(6)}°</div>
                </div>
              </div>
            </Popup>
          </Marker>
          <Marker position={endPoint} icon={icon}>
            <Popup>
              <div className="p-2">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="font-semibold text-gray-800">Corner</span>
                </div>
                <div className="text-sm text-gray-600">
                  <div>📍 {endPoint[0].toFixed(6)}°, {endPoint[1].toFixed(6)}°</div>
                </div>
              </div>
            </Popup>
          </Marker>
        </>
      )}

      {/* Start point marker (only during drawing) */}
      {startPoint && isDrawing && (
        <Marker position={startPoint} icon={icon}>
          <Popup>
            <div className="p-2">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="font-semibold text-gray-800">Rectangle Corner</span>
              </div>
              <div className="text-sm text-gray-600">
                <div>📍 Lat: {startPoint[0].toFixed(6)}°</div>
                <div>📍 Lng: {startPoint[1].toFixed(6)}°</div>
              </div>
              <div className="mt-2 text-xs text-green-600 font-medium">
                Click to set opposite corner
              </div>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Rectangle */}
      {bounds && (
        <Rectangle
          bounds={bounds}
          pathOptions={{
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: isDrawing ? 0.2 : 0.3,
            weight: isDrawing ? 2 : 3,
            opacity: 0.8,
            dashArray: isDrawing ? '5, 5' : undefined
          }}
        >
          {startPoint && endPoint && !isDrawing && (() => {
            const center = calculateCenter(startPoint, endPoint);
            const area = calculateArea(startPoint, endPoint);
            return (
              <Popup>
                <div className="p-2">
                  <div className="flex items-center mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="font-semibold text-gray-800">Selected Area</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="font-semibold text-green-700 mb-1">🎯 Center Coordinates:</div>
                    <div>📍 Lat: {center[0].toFixed(6)}°</div>
                    <div>📍 Lng: {center[1].toFixed(6)}°</div>
                    <div className="mt-2 p-2 bg-green-50 rounded border-l-2 border-green-400">
                      <div className="text-xs text-green-800 font-medium">Area Details:</div>
                      <div>📐 Area: {area.toFixed(2)} km²</div>
                      <div>📏 Width: {Math.abs(startPoint[1] - endPoint[1]).toFixed(4)}°</div>
                      <div>📏 Height: {Math.abs(startPoint[0] - endPoint[0]).toFixed(4)}°</div>
                    </div>
                  </div>
                </div>
              </Popup>
            );
          })()}
        </Rectangle>
      )}

      {/* Cursor preview */}
      {cursorPosition && !startPoint && (
        <Rectangle
          bounds={[
            [cursorPosition[0] - 0.01, cursorPosition[1] - 0.01],
            [cursorPosition[0] + 0.01, cursorPosition[1] + 0.01]
          ]}
          pathOptions={{
            color: '#10b981',
            fillColor: '#10b981',
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

export default RectangleSelector;