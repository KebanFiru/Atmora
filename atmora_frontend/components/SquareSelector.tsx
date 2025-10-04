'use client';

import { useState } from 'react';
import { MapContainer, TileLayer, Polygon, useMapEvents, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

type LatLng = [number, number];


const SquareSelector = () => {
  const [points, setPoints] = useState<LatLng[]>([]);

  // Harita tıklamalarını yakalayan component
  function ClickHandler() {
    useMapEvents({
      click(e) {
        if (points.length < 4) {
          setPoints((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
        } else {
          alert('Zaten 4 nokta seçildi. Sıfırlamak için haritaya sağ tıklayın.');
        }
      },
      contextmenu() {
        setPoints([]);
      },
    });
    return null;
  }

  return (
    <>
      <ClickHandler />
      {/* Tıklanan noktalar marker olarak gösterilir */}
      {points.map((pos, idx) => (
        <Marker key={idx} position={pos}>
          <Popup>{`Nokta ${idx + 1}: [${pos[0].toFixed(4)}, ${pos[1].toFixed(4)}]`}</Popup>
        </Marker>
      ))}
      {/* 4 nokta seçildiyse polygon çiz */}
      {points.length === 4 && <Polygon positions={[...points, points[0]]} pathOptions={{ color: 'blue' }} />}
    </>
  );
};

export default SquareSelector;
