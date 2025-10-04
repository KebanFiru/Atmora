'use client';

import React, { useEffect, useState } from 'react';

interface LeafletMapProps {
  onLocationSelect: (longitude: number, latitude: number, geometry?: any) => void;
  drawingMode: 'point' | 'circle' | 'rectangle' | 'polygon' | null;
  isDarkMode: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

// Component that handles all Leaflet functionality
function MapComponent({ onLocationSelect, drawingMode, isDarkMode, zoom, onZoomChange }: LeafletMapProps) {
  const [mapComponents, setMapComponents] = useState<any>(null);
  const [selectedPoint, setSelectedPoint] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    // Dynamic import of react-leaflet
    Promise.all([
      import('react-leaflet'),
      import('leaflet')
    ]).then(([reactLeaflet, leaflet]) => {
      setMapComponents({ ...reactLeaflet, leaflet });
    });
  }, []);

  if (!mapComponents) {
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

  const { MapContainer, TileLayer, Marker, Popup, useMapEvents } = mapComponents;

  // Map events component
  function MapEvents() {
    const map = useMapEvents({
      click(e: any) {
        if (drawingMode === 'point') {
          const { lat, lng } = e.latlng;
          console.log('Map clicked at:', { lat, lng });
          setSelectedPoint({ lat, lng });
          onLocationSelect(lng, lat);
        }
      },
      zoomend() {
        const newZoom = map.getZoom();
        onZoomChange(newZoom);
      }
    });
    return null;
  }

  const tileLayerUrl = isDarkMode 
    ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
    : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";

  return (
    <div className="relative w-full h-screen">
      <MapContainer
        center={[39.0, 35.0]} // Turkey coordinates
        zoom={zoom}
        className="w-full h-full"
        zoomControl={false} // We'll use custom controls
      >
        <TileLayer
          attribution="&copy; Esri"
          url={tileLayerUrl}
        />
        
        <MapEvents />

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
      </MapContainer>

      {/* Status overlay */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
        <div className={`px-4 py-2 rounded-full backdrop-blur-sm border ${
          isDarkMode 
            ? 'bg-gray-800/90 border-gray-700 text-gray-300' 
            : 'bg-white/90 border-gray-200 text-gray-700'
        }`}>
          <div className="text-sm font-medium">
            {drawingMode ? `${drawingMode.toUpperCase()} Selection Mode` : 'Select a drawing tool to start'}
          </div>
        </div>
      </div>

      {/* Zoom level display */}
      <div className={`absolute bottom-4 left-4 px-3 py-2 rounded-lg backdrop-blur-sm text-sm z-[1000] ${
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
}

const LeafletMap: React.FC<LeafletMapProps> = ({ 
  onLocationSelect, 
  drawingMode, 
  isDarkMode, 
  zoom, 
  onZoomChange 
}) => {
  const [isClient, setIsClient] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLocationSelect = (longitude: number, latitude: number) => {
    setSelectedPoint({ lat: latitude, lng: longitude });
    onLocationSelect(longitude, latitude);
  };

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
    <div className="relative w-full h-screen">
      <MapContainer
        center={[39.0, 35.0]} // Turkey coordinates
        zoom={zoom}
        className="w-full h-full"
        zoomControl={false} // We'll use custom controls
      >
        <TileLayer
          attribution="&copy; Esri"
          url={tileLayerUrl}
        />
        
        <MapEvents 
          onLocationSelect={handleLocationSelect}
          drawingMode={drawingMode}
          onZoomChange={onZoomChange}
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
      </MapContainer>

      {/* Status overlay */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
        <div className={`px-4 py-2 rounded-full backdrop-blur-sm border ${
          isDarkMode 
            ? 'bg-gray-800/90 border-gray-700 text-gray-300' 
            : 'bg-white/90 border-gray-200 text-gray-700'
        }`}>
          <div className="text-sm font-medium">
            {drawingMode ? `${drawingMode.toUpperCase()} Selection Mode` : 'Select a drawing tool to start'}
          </div>
        </div>
      </div>

      {/* Zoom level display */}
      <div className={`absolute bottom-4 left-4 px-3 py-2 rounded-lg backdrop-blur-sm text-sm z-[1000] ${
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