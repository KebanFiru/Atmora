// LeafletMap.tsx (Marker selector için)

"use client";

import { useMemo, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Use a simple div-based HTML for the marker icon to avoid server-side rendering APIs
import MarkerSelector from './MarkerSelector';
import SquareSelector from './SquareSelector';

const iconMarkup = '<div style="width:32px;height:32px;border-radius:50%;background:#ef4444;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white"></div>';

const markerIcon = L.divIcon({
  html: iconMarkup,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});


interface LeafletMapProps {
  mode: 'marker' | 'square';
}

const LeafletMap: React.FC<LeafletMapProps> = ({ mode }) => {
  const [markerPosition, setMarkerPosition] = useState<[number, number]>([37.7749, -122.4194]);

  const today = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // NASA GIBS WMTS (VIIRS true color). Use 'best' tile set and GoogleMapsCompatible tileMatrix
  const layer = 'VIIRS_SNPP_CorrectedReflectance_TrueColor';
  const tileMatrix = 'GoogleMapsCompatible_Level9';
  const nasaUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${today}/${tileMatrix}/{z}/{y}/{x}.jpg`;

  return (
    <MapContainer
      center={markerPosition}
      zoom={13}
      scrollWheelZoom={true}
      className="h-[100vh] w-full z-0"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='Imagery: NASA GIBS'
        url={nasaUrl}
        maxZoom={9}
        crossOrigin="anonymous"
      />
      {/* fallback OSM tiles in case NASA tiles 404 */}
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {mode === 'marker' ? (
        <MarkerSelector
          position={markerPosition}
          setPosition={setMarkerPosition}
          icon={markerIcon}
        />
      ) : (
        <SquareSelector icon={markerIcon} />
      )}
    </MapContainer>
  );
};

export default LeafletMap;
