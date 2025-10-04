'use client';

import React, { useEffect, useRef, useState } from 'react';

interface EsriMapProps {
  onLocationSelect: (longitude: number, latitude: number, geometry?: any) => void;
  drawingMode: 'point' | 'circle' | 'rectangle' | 'polygon' | null;
  isDarkMode: boolean;
}

const EsriMap: React.FC<EsriMapProps> = ({ onLocationSelect, drawingMode, isDarkMode }) => {
  const mapDiv = useRef<HTMLDivElement>(null);
  const [mapView, setMapView] = useState<any>(null);
  const [drawTool, setDrawTool] = useState<any>(null);
  const [graphicsLayer, setGraphicsLayer] = useState<any>(null);

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapDiv.current || mapView) return;

      try {
        // Dynamically import ArcGIS modules
        const [Map, MapView, GraphicsLayer, Draw, Graphic, Point] = await Promise.all([
          import('@arcgis/core/Map'),
          import('@arcgis/core/views/MapView'),
          import('@arcgis/core/layers/GraphicsLayer'),
          import('@arcgis/core/views/draw/Draw'),
          import('@arcgis/core/Graphic'),
          import('@arcgis/core/geometry/Point')
        ]);

        // Initialize map
        const map = new Map.default({
          basemap: isDarkMode ? 'dark-gray-vector' : 'streets-navigation-vector'
        });

        // Create graphics layer for selections
        const gLayer = new GraphicsLayer.default();
        map.add(gLayer);
        setGraphicsLayer(gLayer);

        // Initialize map view
        const view = new MapView.default({
          container: mapDiv.current,
          map: map,
          center: [35, 39], // Turkey coordinates
          zoom: 6,
          ui: {
            components: [] // Remove default UI components
          }
        });

        setMapView(view);

        // Initialize draw tools
        const draw = new Draw.default({
          view: view
        });
        setDrawTool(draw);

        // Add click handler for point selection
        view.on('click', (event: any) => {
          if (drawingMode === 'point') {
            const point = view.toMap(event);
            if (point && point.longitude !== null && point.latitude !== null && 
                point.longitude !== undefined && point.latitude !== undefined) {
              addPointGraphic(point.longitude as number, point.latitude as number, gLayer, Graphic.default, Point.default);
              onLocationSelect(point.longitude as number, point.latitude as number);
            }
          }
        });

      } catch (error) {
        console.error('Error loading ArcGIS modules:', error);
      }
    };

    initializeMap();
  }, []);

  // Update basemap when dark mode changes
  useEffect(() => {
    if (mapView && mapView.map) {
      mapView.map.basemap = isDarkMode ? 'dark-gray-vector' : 'streets-navigation-vector';
    }
  }, [isDarkMode, mapView]);

  const addPointGraphic = async (longitude: number, latitude: number, layer: any, Graphic: any, Point: any) => {
    if (!layer) return;

    const point = new Point({
      longitude,
      latitude
    });

    const graphic = new Graphic({
      geometry: point,
      symbol: {
        type: 'simple-marker',
        color: [255, 255, 255],
        outline: {
          color: [0, 150, 255],
          width: 2
        },
        size: 10
      }
    });

    layer.removeAll();
    layer.add(graphic);
  };

  const zoomIn = () => {
    if (mapView) {
      mapView.zoom += 1;
    }
  };

  const zoomOut = () => {
    if (mapView) {
      mapView.zoom -= 1;
    }
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={mapDiv} className="w-full h-full" />
      
      {/* Zoom Controls - Top Left */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <button
          onClick={zoomIn}
          className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
        >
          +
        </button>
        <button
          onClick={zoomOut}
          className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
        >
          −
        </button>
      </div>
    </div>
  );
};

export default EsriMap;