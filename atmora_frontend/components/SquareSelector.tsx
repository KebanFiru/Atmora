'use client';

import { useState } from 'react';
import { Polygon, useMapEvents, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';

type LatLng = [number, number];

interface SquareSelectorProps {
  icon?: L.Icon | L.DivIcon;
  onShapeComplete?: (center: [number, number], geometry?: any) => void;
}

// Convex Hull algorithm to ensure convex polygons
const convexHull = (points: LatLng[]): LatLng[] => {
  if (points.length < 3) return points;
  
  let bottom = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i][0] < points[bottom][0] || 
        (points[i][0] === points[bottom][0] && points[i][1] < points[bottom][1])) {
      bottom = i;
    }
  }
  
  [points[0], points[bottom]] = [points[bottom], points[0]];
  
  const p0 = points[0];
  const sortedPoints = points.slice(1).sort((a, b) => {
    const angleA = Math.atan2(a[0] - p0[0], a[1] - p0[1]);
    const angleB = Math.atan2(b[0] - p0[0], b[1] - p0[1]);
    return angleA - angleB;
  });
  
  return [p0, ...sortedPoints];
};

// Calculate polygon centroid (center of mass)
const calculatePolygonCentroid = (points: LatLng[]): LatLng => {
  if (points.length === 0) return [0, 0];
  if (points.length === 1) return points[0];
  if (points.length === 2) return [(points[0][0] + points[1][0]) / 2, (points[0][1] + points[1][1]) / 2];
  
  let area = 0;
  let centroidLat = 0;
  let centroidLng = 0;
  
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const crossProduct = points[i][0] * points[j][1] - points[j][0] * points[i][1];
    area += crossProduct;
    centroidLat += (points[i][0] + points[j][0]) * crossProduct;
    centroidLng += (points[i][1] + points[j][1]) * crossProduct;
  }
  
  area *= 0.5;
  if (Math.abs(area) < 1e-10) {
    const sumLat = points.reduce((sum, point) => sum + point[0], 0);
    const sumLng = points.reduce((sum, point) => sum + point[1], 0);
    return [sumLat / points.length, sumLng / points.length];
  }
  
  centroidLat /= (6 * area);
  centroidLng /= (6 * area);
  
  return [centroidLat, centroidLng];
};

// Calculate polygon area
const calculatePolygonArea = (points: LatLng[]): number => {
  if (points.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i][0] * points[j][1];
    area -= points[j][0] * points[i][1];
  }
  area = Math.abs(area) / 2;
  
  const degreeToKm = 111;
  return area * degreeToKm * degreeToKm;
};

const SquareSelector = ({ icon, onShapeComplete }: SquareSelectorProps) => {
  const [points, setPoints] = useState<LatLng[]>([]);
  const [cursorPosition, setCursorPosition] = useState<LatLng | null>(null);

  function ClickHandler() {
    useMapEvents({
      click(e) {
        if (points.length < 8) {
          const newPoint: LatLng = [e.latlng.lat, e.latlng.lng];
          const newPoints = [...points, newPoint];
          
          if (newPoints.length >= 3) {
            const convexPoints = convexHull([...newPoints]);
            setPoints(convexPoints);
          } else {
            setPoints(newPoints);
          }
        } else {
          alert('Maximum 8 points selected. Right-click to finalize or reset.');
        }
      },
      contextmenu(e) {
        e.originalEvent.preventDefault(); // Prevent default context menu
        
        // If we have at least 3 points, finalize the polygon
        if (points.length >= 3) {
          const polygonCenter = calculatePolygonCentroid(points);
          
          // Calculate bounding box from points
          const lats = points.map(p => p[0]);
          const lons = points.map(p => p[1]);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLon = Math.min(...lons);
          const maxLon = Math.max(...lons);
          
          if (onShapeComplete) {
            onShapeComplete(polygonCenter, { 
              type: 'square', 
              bounds: [[minLat, minLon], [maxLat, maxLon]]
            });
          }
          
          // Optional: Clear points after completion or keep them
          // setPoints([]); // Uncomment to clear after completion
        } else if (points.length > 0) {
          // If less than 3 points, just reset
          setPoints([]);
        }
      },
      mousemove(e) {
        setCursorPosition([e.latlng.lat, e.latlng.lng]);
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
      
      {/* Corner markers */}
      {points.map((pos, idx) => (
        <Marker key={idx} position={pos} icon={icon}>
          <Popup>
            <div className="p-2">
              <div className="flex items-center mb-2">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  points.length === 5 ? 'bg-green-500' : 'bg-purple-500'
                }`}></div>
                <span className="font-semibold text-gray-800">Corner {idx + 1}</span>
              </div>
              <div className="text-sm text-gray-600">
                <div>📍 {pos[0].toFixed(6)}°, {pos[1].toFixed(6)}°</div>
                <div className="mt-1 text-xs">
                  {points.length}/8 points • {points.length === 5 ? 'Pentagon ✨' : `${Math.max(0, 5 - points.length)} more for pentagon`}
                </div>
                {points.length >= 3 && (
                  <div className="mt-2 text-xs font-medium text-purple-600 bg-purple-50 p-1 rounded">
                    Right-click to finalize
                  </div>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
      
      {/* Cursor preview */}
      {cursorPosition && points.length < 8 && (
        <>
          <Circle
            center={cursorPosition}
            radius={10}
            pathOptions={{
              color: '#8b5cf6',
              fillColor: '#8b5cf6',
              fillOpacity: 0.3,
              weight: 2,
              opacity: 0.8,
              dashArray: '3, 3'
            }}
          />
          
          {points.length > 0 && (
            <Polyline
              positions={[points[points.length - 1], cursorPosition]}
              pathOptions={{
                color: '#8b5cf6',
                weight: 2,
                opacity: 0.6,
                dashArray: '5, 5'
              }}
            />
          )}
          
          {points.length >= 3 && (
            <Polygon
              positions={[...points, cursorPosition]}
              pathOptions={{
                color: '#8b5cf6',
                fillColor: '#8b5cf6',
                fillOpacity: points.length === 4 ? 0.15 : 0.1,
                weight: points.length === 4 ? 3 : 2,
                opacity: points.length === 4 ? 0.8 : 0.6,
                dashArray: '5, 5'
              }}
            />
          )}
        </>
      )}
      
      {/* Final polygon */}
      {points.length >= 3 && (
        <Polygon 
          positions={[...points, points[0]]} 
          pathOptions={{ 
            color: points.length === 5 ? '#10b981' : '#8b5cf6',
            fillColor: points.length === 5 ? '#10b981' : '#8b5cf6',
            fillOpacity: points.length === 5 ? 0.25 : 0.2,
            weight: points.length === 5 ? 4 : 3,
            opacity: 0.8
          }}
        >
          <Popup>
            <div className="p-2">
              <div className="flex items-center mb-2">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  points.length === 5 ? 'bg-green-500' : 'bg-purple-500'
                }`}></div>
                <span className="font-semibold text-gray-800">Selected Area</span>
              </div>
              <div className="text-sm text-gray-600">
                <div className={`font-semibold mb-1 ${
                  points.length === 5 ? 'text-green-700' : 'text-purple-700'
                }`}>🎯 Center Coordinates:</div>
                {(() => {
                  const centroid = calculatePolygonCentroid(points);
                  const area = calculatePolygonArea(points);
                  return (
                    <>
                      <div>📍 Lat: {centroid[0].toFixed(6)}°</div>
                      <div>📍 Lng: {centroid[1].toFixed(6)}°</div>
                      <div className={`mt-2 p-2 rounded border-l-2 ${
                        points.length === 5 
                          ? 'bg-green-50 border-green-400' 
                          : 'bg-purple-50 border-purple-400'
                      }`}>
                        <div className={`text-xs font-medium ${
                          points.length === 5 ? 'text-green-800' : 'text-purple-800'
                        }`}>Area Details:</div>
                        <div>📐 Area: {area.toFixed(2)} km²</div>
                        <div>🔹 Points: {points.length}/8</div>
                        <div>{points.length === 5 ? '✨ Perfect Pentagon!' : `${Math.max(0, 5 - points.length)} more for pentagon`}</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </Popup>
        </Polygon>
      )}
      
      {/* Connecting lines */}
      {points.length > 1 && points.length < 3 && (
        <Polyline
          positions={points}
          pathOptions={{
            color: '#8b5cf6',
            weight: 2,
            opacity: 0.8
          }}
        />
      )}
    </>
  );
};

export default SquareSelector;
