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
          // 4 nokta dolduğunda seçim resetlenebilir veya ek işlem yapılabilir
          alert('Zaten 4 nokta seçildi. Sıfırlamak için haritaya sağ tıklayın.');
        }
      },
      contextmenu() {
        // Sağ tıklayınca seçim sıfırlanıyor
        setPoints([]);
      },
    });
    return null;
  }

  return (
    <div className="h-[100vh] w-full">
      <MapContainer
        center={[41.015137, 28.979530]} // İstanbul merkez
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler />

        {/* Tıklanan noktalar marker olarak gösterilir */}
        {points.map((pos, idx) => (
          <Marker key={idx} position={pos}>
            <Popup>{`Nokta ${idx + 1}: [${pos[0].toFixed(4)}, ${pos[1].toFixed(4)}]`}</Popup>
          </Marker>
        ))}

        {/* 4 nokta seçildiyse polygon çiz */}
        {points.length === 4 && <Polygon positions={[...points, points[0]]} pathOptions={{ color: 'blue' }} />}
      </MapContainer>
      <div className="p-2 text-center bg-gray-100">
        <p>Kullanıcı 4 nokta tıklayarak alan seçiyor.</p>
        <p>Sağ tıklama ile seçim sıfırlanır.</p>
      </div>
    </div>
  );
};

export default SquareSelector;
