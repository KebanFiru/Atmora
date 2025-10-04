'use client'; 

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});


const LeafletMap: React.FC = () => {
  return (
    <div className="h-[100vh] w-full rounded-lg shadow-lg overflow-hidden">
      <MapContainer
        center={[0,0]}
        zoom={8}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
      <TileLayer
        attribution="Tiles &copy; Esri &mdash; Source: Esri, HERE, Garmin, USGS, EPA, NPS"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
      />
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
