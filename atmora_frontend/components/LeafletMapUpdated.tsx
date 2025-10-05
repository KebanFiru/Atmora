'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

const MarkerSelector = dynamic(() => import('./MarkerSelector'), { ssr: false });
const SquareSelector = dynamic(() => import('./SquareSelector'), { ssr: false });
const CircleSelector = dynamic(() => import('./CircleSelector'), { ssr: false });
const RectangleSelector = dynamic(() => import('./RectangleSelector'), { ssr: false });

interface LeafletMapUpdatedProps {
  onLocationSelect: (longitude: number, latitude: number, geometry?: any) => void;
  mode: 'marker' | 'square' | 'circle' | 'rectangle' | null;
  isDarkMode: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  rainLayerEnabled?: boolean;
  rainLayerOpacity?: number;
}

const MapComponent: React.FC<LeafletMapUpdatedProps> = ({ 
  onLocationSelect, 
  mode, 
  isDarkMode, 
  zoom, 
  onZoomChange,
  rainLayerEnabled = false,
  rainLayerOpacity = 0.6
}) => {
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([39.0, 35.0]); // Turkey center
  const [L, setL] = useState<any>(null);
  const [markerIcon, setMarkerIcon] = useState<any>(null);
  const [reactLeaflet, setReactLeaflet] = useState<any>(null);
  const [rainViewerLayer, setRainViewerLayer] = useState<any>(null);
  const [map, setMap] = useState<any>(null);

  useEffect(() => {
    const loadLeaflet = async () => {
      const [leafletModule, reactLeafletModule, ReactDOMServer] = await Promise.all([
        import('leaflet'),
        import('react-leaflet'),
        import('react-dom/server')
      ]);

      if (typeof window !== 'undefined') {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const L = leafletModule.default;
      
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const iconMarkup = ReactDOMServer.renderToStaticMarkup(
        React.createElement(MapPin, { size: 32, color: "red" })
      );

      const icon = L.divIcon({
        html: iconMarkup,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      setL(L);
      setMarkerIcon(icon);
      setReactLeaflet(reactLeafletModule);
    };

    loadLeaflet();
  }, []);

  const handleLocationSelect = (longitude: number, latitude: number, geometry?: any) => {
    onLocationSelect(longitude, latitude, geometry);
  };

  const handleMarkerPositionChange = (pos: [number, number]) => {
    setMarkerPosition(pos);
    handleLocationSelect(pos[1], pos[0]); 
  };

  const handleShapeSelect = (center: [number, number], geometry?: any) => {
    handleLocationSelect(center[1], center[0], geometry);
  };

  useEffect(() => {
    if (!L || !map) return;

    if (rainLayerEnabled) {
      fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then(response => response.json())
        .then(data => {
          if (data.radar && data.radar.past && data.radar.past.length > 0) {
            const latestFrame = data.radar.past[data.radar.past.length - 1];
            const tileUrl = `https://tilecache.rainviewer.com${latestFrame.path}/256/{z}/{x}/{y}/2/1_1.png`;
            
            if (rainViewerLayer) {
              map.removeLayer(rainViewerLayer);
            }

            const newLayer = L.tileLayer(tileUrl, {
              opacity: rainLayerOpacity,
              zIndex: 1000,
              attribution: 'RainViewer'
            });
            
            newLayer.addTo(map);
            setRainViewerLayer(newLayer);
          }
        })
        .catch(error => console.error('RainViewer API error:', error));
    } else {
      if (rainViewerLayer) {
        map.removeLayer(rainViewerLayer);
        setRainViewerLayer(null);
      }
    }

    return () => {
      if (rainViewerLayer) {
        map.removeLayer(rainViewerLayer);
      }
    };
  }, [rainLayerEnabled, L, map]);

  useEffect(() => {
    if (rainViewerLayer) {
      rainViewerLayer.setOpacity(rainLayerOpacity);
    }
  }, [rainLayerOpacity, rainViewerLayer]);

  // Don't render until Leaflet is loaded
  if (!L || !markerIcon || !reactLeaflet) {
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

  const { MapContainer, TileLayer, useMapEvents, useMap } = reactLeaflet;

  // Map events component for zoom tracking
  const MapEvents = React.memo(() => {
    const mapInstance = useMapEvents({
      zoomend() {
        const newZoom = mapInstance.getZoom();
        console.log('Map zoomend event:', newZoom);
        onZoomChange(newZoom);
      }
    });

    // Store map instance
    React.useEffect(() => {
      setMap(mapInstance);
    }, [mapInstance]);

    // Update map zoom when zoom prop changes
    React.useEffect(() => {
      if (mapInstance && mapInstance.getZoom() !== zoom) {
        // Ensure zoom level is within bounds
        const clampedZoom = Math.max(2, Math.min(18, zoom));
        console.log('Updating map zoom from', mapInstance.getZoom(), 'to', clampedZoom);
        mapInstance.setZoom(clampedZoom, { animate: true });
      }
    }, [zoom, mapInstance]);

    return null;
  });

  const tileLayerUrl = isDarkMode 
    ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
    : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";

  return (
    <div className="relative w-full h-screen z-0">
      <MapContainer
        center={markerPosition}
        zoom={zoom}
        className="w-full h-full"
        zoomControl={false} 
        minZoom={2} 
        maxZoom={18}
        maxBounds={[
          [-90, -180], 
          [90, 180] 
        ]}
        maxBoundsViscosity={1.0} 
      >
        <TileLayer
          attribution="&copy; Esri"
          url={tileLayerUrl}
          key={tileLayerUrl}
        />

        <MapEvents />
        
        {/* Render appropriate selector based on mode */}
        {mode === 'marker' && (
          <MarkerSelector
            position={markerPosition}
            setPosition={handleMarkerPositionChange}
            icon={markerIcon}
          />
        )}
        
        {mode === 'square' && (
          <SquareSelector
            icon={markerIcon}
            onShapeComplete={handleShapeSelect}
          />
        )}

        {mode === 'circle' && (
          <CircleSelector
            icon={markerIcon}
            onShapeComplete={handleShapeSelect}
          />
        )}

        {mode === 'rectangle' && (
          <RectangleSelector
            icon={markerIcon}
            onShapeComplete={handleShapeSelect}
          />
        )}
      </MapContainer>



      {/* Zoom level display */}
      <div className={`absolute bottom-6 left-6 px-4 py-2.5 rounded-xl backdrop-blur-md text-sm z-[5] shadow-lg border transition-all ${
        isDarkMode 
          ? 'bg-gray-900/95 border-gray-700/50 text-gray-200' 
          : 'bg-white/95 border-gray-300/30 text-gray-700'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
          <div className="flex flex-col">
            <span className="text-xs font-medium opacity-60">Map View</span>
            <span className="text-sm font-bold">Zoom {zoom}</span>
          </div>
        </div>
      </div>
    </div>
  );
};


const LeafletMapUpdated: React.FC<LeafletMapUpdatedProps> = (props) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

 
  if (!isClient) {
    return (
      <div className={`w-full h-screen flex items-center justify-center ${
        props.isDarkMode ? 'bg-gray-900 text-white' : 'bg-blue-50 text-gray-800'
      }`}>
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Loading Interactive Map...</div>
          <div className="text-sm opacity-75">Initializing Esri World Map</div>
        </div>
      </div>
    );
  }

  return <MapComponent {...props} />;
};

export default LeafletMapUpdated;