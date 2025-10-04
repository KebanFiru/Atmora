'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle, Rectangle, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LeafletMapProps {
  onLocationSelect: (longitude: number, latitude: number, geometry?: any) => void;
  drawingMode: 'point' | 'circle' | 'rectangle' | 'polygon' | null;
  isDarkMode: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

// Map events component with drawing support
const MapEvents = React.memo(({ onLocationSelect, drawingMode, onZoomChange, onShapeCreated, onPreviewUpdate }: {
  onLocationSelect: (lng: number, lat: number) => void;
  drawingMode: 'point' | 'circle' | 'rectangle' | 'polygon' | null;
  onZoomChange: (zoom: number) => void;
  onShapeCreated: (shape: any) => void;
  onPreviewUpdate: (preview: any) => void;
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<L.LatLng | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<L.LatLng[]>([]);
  const [mousePosition, setMousePosition] = useState<L.LatLng | null>(null);

  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      
      if (drawingMode === 'point') {
        console.log('Point selected at:', { lat, lng });
        onLocationSelect(lng, lat);
        onShapeCreated({ type: 'point', center: [lat, lng] });
        onPreviewUpdate(null);
      } 
      else if (drawingMode === 'circle') {
        if (!isDrawing) {
          setStartPoint(e.latlng);
          setIsDrawing(true);
          console.log('Circle center selected at:', { lat, lng });
          // Show center marker
          onPreviewUpdate({ 
            type: 'circle-center', 
            center: [lat, lng] 
          });
        } else {
          const radius = startPoint!.distanceTo(e.latlng);
          console.log('Circle completed:', { center: [startPoint!.lat, startPoint!.lng], radius });
          onLocationSelect(startPoint!.lng, startPoint!.lat);
          onShapeCreated({ 
            type: 'circle', 
            center: [startPoint!.lat, startPoint!.lng], 
            radius: radius 
          });
          setIsDrawing(false);
          setStartPoint(null);
          onPreviewUpdate(null);
        }
      }
      else if (drawingMode === 'rectangle') {
        if (!isDrawing) {
          setStartPoint(e.latlng);
          setIsDrawing(true);
          console.log('Rectangle start point selected at:', { lat, lng });
          // Show start corner marker
          onPreviewUpdate({ 
            type: 'rectangle-start', 
            start: [lat, lng] 
          });
        } else {
          const bounds = L.latLngBounds(startPoint!, e.latlng);
          console.log('Rectangle completed:', { bounds: bounds.toBBoxString() });
          const center = bounds.getCenter();
          onLocationSelect(center.lng, center.lat);
          onShapeCreated({ 
            type: 'rectangle', 
            bounds: [[bounds.getSouth(), bounds.getWest()], [bounds.getNorth(), bounds.getEast()]]
          });
          setIsDrawing(false);
          setStartPoint(null);
          onPreviewUpdate(null);
        }
      }
      else if (drawingMode === 'polygon') {
        if (polygonPoints.length === 0) {
          console.log('Starting polygon at:', { lat, lng });
          const newPoints = [e.latlng];
          setPolygonPoints(newPoints);
          onPreviewUpdate({ 
            type: 'polygon-points', 
            points: newPoints.map(p => [p.lat, p.lng]) 
          });
        } else {
          const newPoints = [...polygonPoints, e.latlng];
          setPolygonPoints(newPoints);
          console.log('Added polygon point:', { lat, lng, totalPoints: newPoints.length });
          onPreviewUpdate({ 
            type: 'polygon-points', 
            points: newPoints.map(p => [p.lat, p.lng]) 
          });
        }
      }
    },
    mousemove(e) {
      setMousePosition(e.latlng);
      
      // Update preview based on current drawing state
      if (drawingMode === 'circle' && isDrawing && startPoint) {
        const radius = startPoint.distanceTo(e.latlng);
        onPreviewUpdate({ 
          type: 'circle-preview', 
          center: [startPoint.lat, startPoint.lng], 
          radius: radius,
          mousePos: [e.latlng.lat, e.latlng.lng]
        });
      }
      else if (drawingMode === 'rectangle' && isDrawing && startPoint) {
        const bounds = L.latLngBounds(startPoint, e.latlng);
        onPreviewUpdate({ 
          type: 'rectangle-preview', 
          start: [startPoint.lat, startPoint.lng],
          end: [e.latlng.lat, e.latlng.lng],
          bounds: [[bounds.getSouth(), bounds.getWest()], [bounds.getNorth(), bounds.getEast()]]
        });
      }
      else if (drawingMode === 'polygon' && polygonPoints.length > 0) {
        onPreviewUpdate({ 
          type: 'polygon-preview', 
          points: polygonPoints.map(p => [p.lat, p.lng]),
          mousePos: [e.latlng.lat, e.latlng.lng]
        });
      }
    },
    dblclick(e) {
      if (drawingMode === 'polygon' && polygonPoints.length >= 2) {
        // Don't add the double-click point, just finish the polygon
        console.log('Polygon completed with', polygonPoints.length, 'points');
        const center = polygonPoints.reduce((acc, point) => {
          acc.lat += point.lat;
          acc.lng += point.lng;
          return acc;
        }, { lat: 0, lng: 0 });
        center.lat /= polygonPoints.length;
        center.lng /= polygonPoints.length;
        
        onLocationSelect(center.lng, center.lat);
        onShapeCreated({ 
          type: 'polygon', 
          points: polygonPoints.map(p => [p.lat, p.lng]),
          center: [center.lat, center.lng]
        });
        setPolygonPoints([]);
        onPreviewUpdate(null);
      }
    },
    zoomend() {
      const newZoom = map.getZoom();
      onZoomChange(newZoom);
    }
  });

  // Reset drawing state when mode changes
  useEffect(() => {
    if (drawingMode !== 'polygon') {
      setPolygonPoints([]);
    }
    if (drawingMode !== 'circle' && drawingMode !== 'rectangle') {
      setIsDrawing(false);
      setStartPoint(null);
    }
  }, [drawingMode]);

  return null;
});

const LeafletMap: React.FC<LeafletMapProps> = ({ 
  onLocationSelect, 
  drawingMode, 
  isDarkMode, 
  zoom, 
  onZoomChange 
}) => {
  const [isClient, setIsClient] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<{lat: number, lng: number} | null>(null);
  const [drawnShapes, setDrawnShapes] = useState<any[]>([]);
  const [previewShape, setPreviewShape] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLocationSelect = (longitude: number, latitude: number) => {
    setSelectedPoint({ lat: latitude, lng: longitude });
    onLocationSelect(longitude, latitude);
  };

  const handleShapeCreated = (shape: any) => {
    // Clear previous shapes when creating a new one
    setDrawnShapes([{ ...shape, id: Date.now() }]);
  };

  const clearShapes = () => {
    setDrawnShapes([]);
    setSelectedPoint(null);
    setPreviewShape(null);
  };

  const handlePreviewUpdate = (preview: any) => {
    setPreviewShape(preview);
  };

  // Clear shapes when drawing mode changes
  useEffect(() => {
    if (drawingMode) {
      clearShapes();
    }
  }, [drawingMode]);

  // Don't render map on server side
  if (!isClient) {
    return (
      <div className={`w-full h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-blue-50 text-gray-800'
      }`}>
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Loading Interactive Map...</div>
          <div className="text-sm opacity-75">Initializing Esri World Map</div>
        </div>
      </div>
    );
  }

  const tileLayerUrl = isDarkMode 
    ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
    : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";

  return (
    <div className="relative w-full h-screen z-0">
      <MapContainer
        center={[39.0, 35.0]} // Turkey coordinates
        zoom={zoom}
        className="w-full h-full"
        zoomControl={false} // We'll use custom controls
      >
        <TileLayer
          attribution="&copy; Esri"
          url={tileLayerUrl}
          key={tileLayerUrl} // Only re-render tile layer when URL changes
        />
        
        <MapEvents 
          onLocationSelect={handleLocationSelect}
          drawingMode={drawingMode}
          onZoomChange={onZoomChange}
          onShapeCreated={handleShapeCreated}
          onPreviewUpdate={handlePreviewUpdate}
        />

        {/* Show selected point */}
        {selectedPoint && (
          <Marker position={[selectedPoint.lat, selectedPoint.lng]}>
            <Popup>
              <div className="text-center">
                <div className="font-semibold">Selected Location</div>
                <div className="text-sm">
                  Lat: {selectedPoint.lat.toFixed(4)}<br/>
                  Lng: {selectedPoint.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Render drawn shapes */}
        {drawnShapes.map((shape) => {
          if (shape.type === 'circle') {
            return (
              <Circle
                key={shape.id}
                center={shape.center}
                radius={shape.radius}
                pathOptions={{
                  color: isDarkMode ? '#3b82f6' : '#1d4ed8',
                  fillColor: isDarkMode ? '#3b82f6' : '#1d4ed8',
                  fillOpacity: 0.2,
                  weight: 2
                }}
              >
                <Popup>
                  <div className="text-center">
                    <div className="font-semibold">Circle Area</div>
                    <div className="text-sm">
                      Center: {shape.center[0].toFixed(4)}, {shape.center[1].toFixed(4)}<br/>
                      Radius: {(shape.radius / 1000).toFixed(2)} km
                    </div>
                  </div>
                </Popup>
              </Circle>
            );
          } else if (shape.type === 'rectangle') {
            return (
              <Rectangle
                key={shape.id}
                bounds={shape.bounds}
                pathOptions={{
                  color: isDarkMode ? '#10b981' : '#059669',
                  fillColor: isDarkMode ? '#10b981' : '#059669',
                  fillOpacity: 0.2,
                  weight: 2
                }}
              >
                <Popup>
                  <div className="text-center">
                    <div className="font-semibold">Rectangle Area</div>
                    <div className="text-sm">
                      SW: {shape.bounds[0][0].toFixed(4)}, {shape.bounds[0][1].toFixed(4)}<br/>
                      NE: {shape.bounds[1][0].toFixed(4)}, {shape.bounds[1][1].toFixed(4)}
                    </div>
                  </div>
                </Popup>
              </Rectangle>
            );
          } else if (shape.type === 'polygon') {
            return (
              <Polygon
                key={shape.id}
                positions={shape.points}
                pathOptions={{
                  color: isDarkMode ? '#f59e0b' : '#d97706',
                  fillColor: isDarkMode ? '#f59e0b' : '#d97706',
                  fillOpacity: 0.2,
                  weight: 2
                }}
              >
                <Popup>
                  <div className="text-center">
                    <div className="font-semibold">Polygon Area</div>
                    <div className="text-sm">
                      Center: {shape.center[0].toFixed(4)}, {shape.center[1].toFixed(4)}<br/>
                      Points: {shape.points.length}
                    </div>
                  </div>
                </Popup>
              </Polygon>
            );
          }
          return null;
        })}

        {/* Render preview shapes */}
        {previewShape && (
          <>
            {previewShape.type === 'circle-center' && (
              <Marker position={previewShape.center}>
                <Popup>Circle Center - Click to set radius</Popup>
              </Marker>
            )}
            
            {previewShape.type === 'circle-preview' && (
              <>
                <Marker position={previewShape.center}>
                  <Popup>Circle Center</Popup>
                </Marker>
                <Circle
                  center={previewShape.center}
                  radius={previewShape.radius}
                  pathOptions={{
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.1,
                    weight: 2,
                    dashArray: '5, 5'
                  }}
                />
                <Marker position={previewShape.mousePos} opacity={0.7}>
                  <Popup>Radius: {(previewShape.radius / 1000).toFixed(2)} km</Popup>
                </Marker>
              </>
            )}

            {previewShape.type === 'rectangle-start' && (
              <Marker position={previewShape.start}>
                <Popup>Rectangle Start - Click opposite corner</Popup>
              </Marker>
            )}

            {previewShape.type === 'rectangle-preview' && (
              <>
                <Marker position={previewShape.start}>
                  <Popup>Start Corner</Popup>
                </Marker>
                <Rectangle
                  bounds={previewShape.bounds}
                  pathOptions={{
                    color: '#10b981',
                    fillColor: '#10b981',
                    fillOpacity: 0.1,
                    weight: 2,
                    dashArray: '5, 5'
                  }}
                />
                <Marker position={previewShape.end} opacity={0.7}>
                  <Popup>End Corner</Popup>
                </Marker>
              </>
            )}

            {previewShape.type === 'polygon-points' && (
              <>
                {previewShape.points.map((point: [number, number], index: number) => (
                  <Marker key={index} position={point}>
                    <Popup>Point {index + 1}</Popup>
                  </Marker>
                ))}
                {previewShape.points.length >= 2 && (
                  <Polygon
                    positions={previewShape.points}
                    pathOptions={{
                      color: '#f59e0b',
                      fillColor: '#f59e0b',
                      fillOpacity: 0.1,
                      weight: 2,
                      dashArray: '5, 5'
                    }}
                  />
                )}
              </>
            )}

            {previewShape.type === 'polygon-preview' && (
              <>
                {previewShape.points.map((point: [number, number], index: number) => (
                  <Marker key={index} position={point}>
                    <Popup>Point {index + 1}</Popup>
                  </Marker>
                ))}
                {previewShape.points.length >= 1 && previewShape.mousePos && (
                  <>
                    <Polygon
                      positions={[...previewShape.points, previewShape.mousePos]}
                      pathOptions={{
                        color: '#f59e0b',
                        fillColor: '#f59e0b',
                        fillOpacity: 0.05,
                        weight: 2,
                        dashArray: '10, 5'
                      }}
                    />
                    <Marker position={previewShape.mousePos} opacity={0.5}>
                      <Popup>
                        {previewShape.points.length >= 2 
                          ? 'Double-click to finish polygon' 
                          : 'Next Point - Click to add'
                        }
                      </Popup>
                    </Marker>
                  </>
                )}
              </>
            )}
          </>
        )}
      </MapContainer>

      {/* Status overlay */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[5]">
        <div className={`px-4 py-2 rounded-full backdrop-blur-sm border ${
          isDarkMode 
            ? 'bg-gray-800/90 border-gray-700 text-gray-300' 
            : 'bg-white/90 border-gray-200 text-gray-700'
        }`}>
          <div className="text-sm font-medium">
            {drawingMode === 'point' && 'Click anywhere to select a point'}
            {drawingMode === 'circle' && (previewShape?.type === 'circle-center' ? 'Now click to set radius' : 'Click to set circle center')}
            {drawingMode === 'rectangle' && (previewShape?.type === 'rectangle-start' ? 'Click opposite corner' : 'Click first corner')}
            {drawingMode === 'polygon' && (
              previewShape?.points?.length > 0 
                ? `${previewShape.points.length} points added` 
                : 'Click to start polygon'
            )}
            {!drawingMode && 'Select a drawing tool to start'}
          </div>
          
          {/* Double-click reminder for polygon */}
          {drawingMode === 'polygon' && previewShape?.points?.length >= 2 && (
            <div className={`text-xs mt-1 px-2 py-1 rounded-md animate-pulse ${
              isDarkMode 
                ? 'bg-orange-900/50 text-orange-200' 
                : 'bg-orange-100/80 text-orange-700'
            }`}>
              💡 Double-click to finish polygon
            </div>
          )}
        </div>
      </div>

      {/* Polygon finish button */}
      {drawingMode === 'polygon' && previewShape?.points?.length >= 3 && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[5]">
          <button
            onClick={() => {
              const polygonPoints = previewShape.points.map((p: [number, number]) => ({ lat: p[0], lng: p[1] }));
              const center = polygonPoints.reduce((acc: {lat: number, lng: number}, point: {lat: number, lng: number}) => {
                acc.lat += point.lat;
                acc.lng += point.lng;
                return acc;
              }, { lat: 0, lng: 0 });
              center.lat /= polygonPoints.length;
              center.lng /= polygonPoints.length;
              
              handleLocationSelect(center.lng, center.lat);
              handleShapeCreated({ 
                type: 'polygon', 
                points: previewShape.points,
                center: [center.lat, center.lng]
              });
            }}
            className={`px-4 py-2 rounded-lg backdrop-blur-sm border transition-all animate-pulse ${
              isDarkMode 
                ? 'bg-green-800/90 border-green-700 text-green-200 hover:bg-green-700/90' 
                : 'bg-green-100/90 border-green-200 text-green-700 hover:bg-green-200/90'
            }`}
          >
            <div className="text-sm font-medium">✓ Finish Polygon ({previewShape.points.length} points)</div>
          </button>
        </div>
      )}

      {/* Clear shapes button */}
      {drawnShapes.length > 0 && (
        <div className="absolute top-4 right-4 z-[5]">
          <button
            onClick={clearShapes}
            className={`p-2 rounded-lg backdrop-blur-sm border transition-all ${
              isDarkMode 
                ? 'bg-red-800/90 border-red-700 text-red-200 hover:bg-red-700/90' 
                : 'bg-red-100/90 border-red-200 text-red-700 hover:bg-red-200/90'
            }`}
          >
            <div className="text-sm font-medium">Clear All ({drawnShapes.length})</div>
          </button>
        </div>
      )}

      {/* Zoom level display */}
      <div className={`absolute bottom-4 left-4 px-3 py-2 rounded-lg backdrop-blur-sm text-sm z-[5] ${
        isDarkMode 
          ? 'bg-gray-800/90 border border-gray-700 text-gray-300' 
          : 'bg-white/90 border border-gray-200 text-gray-700'
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>Esri World Map - Zoom: {zoom}</span>
        </div>
      </div>
    </div>
  );
};

export default LeafletMap;