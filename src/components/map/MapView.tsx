import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  onMapClick?: (latlng: LatLng) => void;
  onMapLongPress?: (latlng: LatLng) => void;
  children?: React.ReactNode;
}

// Default center: Valencia, Spain
const DEFAULT_CENTER: [number, number] = [39.4699, -0.3763];
const DEFAULT_ZOOM = 13;

function MapEventHandler({
  onMapClick,
  onMapLongPress,
}: {
  onMapClick?: (latlng: LatLng) => void;
  onMapLongPress?: (latlng: LatLng) => void;
}) {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const pressStart = useRef<LatLng | null>(null);

  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    },
    mousedown: (e) => {
      if (onMapLongPress) {
        pressStart.current = e.latlng;
        longPressTimer.current = setTimeout(() => {
          if (pressStart.current) {
            onMapLongPress(pressStart.current);
          }
        }, 500);
      }
    },
    mouseup: () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      pressStart.current = null;
    },
    mousemove: () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    },
  });

  return null;
}

function LocationButton() {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleLocationClick = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.setView(
          [position.coords.latitude, position.coords.longitude],
          15
        );
        setLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <button
      onClick={handleLocationClick}
      disabled={locating}
      className="absolute bottom-4 right-4 z-[1000] p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      aria-label="Center on my location"
    >
      {locating ? (
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg
          className="w-5 h-5 text-gray-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      )}
    </button>
  );
}

export function MapView({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  onMapClick,
  onMapLongPress,
  children,
}: MapViewProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEventHandler
          onMapClick={onMapClick}
          onMapLongPress={onMapLongPress}
        />
        <LocationButton />
        {children}
      </MapContainer>
    </div>
  );
}
