'use client';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// Perbaikan Icon Leaflet yang sering hilang di Next.js
const icon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapPickerProps {
  coords: { lat: number; lng: number };
  setCoords: (coords: { lat: number; lng: number }) => void;
  radius: number;
}

export default function MapPicker({ coords, setCoords, radius }: MapPickerProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Komponen internal untuk menangani klik peta
  function LocationMarker() {
    useMapEvents({
      click(e) {
        setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      },
    });
    return null;
  }

  if (!isMounted) return null;

  return (
    <MapContainer
      center={[coords.lat, coords.lng]}
      zoom={15}
      style={{ height: '100%', width: '100%', zIndex: 1 }}
      scrollWheelZoom={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <LocationMarker />
      <Marker position={[coords.lat, coords.lng]} icon={icon} />
      <Circle
        center={[coords.lat, coords.lng]}
        radius={radius}
        pathOptions={{
          fillColor: '#3b82f6',
          color: '#2563eb',
          weight: 2,
          opacity: 0.5,
          fillOpacity: 0.2
        }}
      />
    </MapContainer>
  );
}