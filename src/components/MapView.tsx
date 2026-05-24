'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Property } from '../types/property';

// Fix Leaflet's default icon path issues with Next.js
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapViewProps {
  properties: Property[];
  onPropertyClick: (property: Property) => void;
}

// A component to automatically fit bounds to markers
function MapBounds({ properties }: { properties: Property[] }) {
  const map = useMap();

  useEffect(() => {
    if (properties.length === 0) return;
    
    // Create a bounding box from property coordinates
    // Note: Since we don't have exact lat/lng from scrapers, we'll need to use a geocoder.
    // For now, we center on Rio de Janeiro.
    // In the future, the geocoding logic will pass exact lat/lng.
  }, [map, properties]);

  return null;
}

// Mapa aproximado das zonas do RJ para geocodificação temporária
const zoneCoordinates: Record<string, [number, number]> = {
  'Zona Sul': [-22.9734, -43.1979],
  'Zona Norte': [-22.8686, -43.2982],
  'Zona Oeste': [-22.9234, -43.5181],
  'Zona Sudoeste': [-22.9841, -43.3769],
  'Centro': [-22.9110, -43.1818],
  'Niterói': [-22.8833, -43.1036],
  'São Gonçalo': [-22.8269, -43.0538],
  'Baixada': [-22.7533, -43.4608],
  'Geral': [-22.9068, -43.1729],
};

// Add random jitter to coordinates so markers don't overlap exactly
const jitter = (coord: number, spread = 0.02) => coord + (Math.random() - 0.5) * spread;

export default function MapView({ properties, onPropertyClick }: MapViewProps) {
  const defaultCenter: [number, number] = [-22.9068, -43.1729]; // Rio Center

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-md border border-border">
      <MapContainer 
        center={defaultCenter} 
        zoom={11} 
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />
        
        {properties.map(property => {
          // If property has exact coordinates, use them. Otherwise, fall back to zone.
          // TODO: Implement actual geocoding via OpenStreetMap Nominatim in the backend.
          const baseCoord = zoneCoordinates[property.zone] || defaultCenter;
          const lat = jitter(baseCoord[0]);
          const lng = jitter(baseCoord[1]);

          return (
            <Marker key={property.id} position={[lat, lng]} icon={customIcon}>
              <Popup className="custom-popup">
                <div 
                    className="w-48 cursor-pointer flex flex-col gap-2"
                    onClick={() => onPropertyClick(property)}
                >
                  {property.image && (
                    <img 
                      src={property.image} 
                      alt={property.title} 
                      className="w-full h-24 object-cover rounded-md"
                    />
                  )}
                  <h3 className="font-bold text-sm leading-tight text-gray-900">{property.title}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-primary">R$ {property.price}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{property.neighborhood}</span>
                  </div>
                  <button className="mt-2 w-full bg-primary text-primary-foreground text-xs font-semibold py-1.5 rounded-md hover:opacity-90">
                    Ver Detalhes
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
        <MapBounds properties={properties} />
      </MapContainer>
    </div>
  );
}
