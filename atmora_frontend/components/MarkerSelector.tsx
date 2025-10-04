'use client';

import { Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

interface MarkerSelectorProps {
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
  icon?: L.Icon | L.DivIcon;
}

export default function MarkerSelector({ position, setPosition, icon }: MarkerSelectorProps) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return (
    <Marker position={position} icon={icon}>
      <Popup>
        Marker konumu: [{position[0].toFixed(4)}, {position[1].toFixed(4)}]
      </Popup>
    </Marker>
  );
}
