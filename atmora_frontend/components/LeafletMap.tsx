// LeafletMap.tsx (Marker selector için)

'use client';

import { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { MapPin } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';

import MarkerSelector from './MarkerSelector';

const iconMarkup = ReactDOMServer.renderToStaticMarkup(
  <MapPin size={32} color="red" />
);

const markerIcon = L.divIcon({
  html: iconMarkup,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const LeafletMap: React.FC = () => {
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([37.7749, -122.4194]);

  return (
    <MapContainer
      center={markerPosition}
      zoom={13}
      scrollWheelZoom={true}
      className="h-[100vh] w-full"
    >
      <TileLayer
        attribution="Tiles &copy; Esri"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
      />
      <MarkerSelector
        position={markerPosition}
        setPosition={setMarkerPosition}
        icon={markerIcon}
      />
    </MapContainer>
  );
};

export default LeafletMap;
