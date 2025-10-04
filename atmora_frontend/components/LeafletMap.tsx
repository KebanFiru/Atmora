'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
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

// Map events component
function MapEvents({ onLocationSelect, drawingMode, onZoomChange }: {
  onLocationSelect: (lng: number, lat: number) => void;
  drawingMode: 'point' | 'circle' | 'rectangle' | 'polygon' | null;
  onZoomChange: (zoom: number) => void;
}) {
  const map = useMapEvents({
    click(e) {
      if (drawingMode === 'point') {
        const { lat, lng } = e.latlng;
        console.log('Map clicked at:', { lat, lng });
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
        key={`${isDarkMode}-${zoom}`} // Force re-render on theme change
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