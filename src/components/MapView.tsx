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
  hoveredPropertyId?: string | null;
}

// A component to automatically fit bounds to markers
function MapBounds({ properties }: { properties: Property[] }) {
  const map = useMap();

  useEffect(() => {
    if (properties.length === 0) return;
    
    // Calcula os limites (bounds) de todos os imóveis para centralizar o mapa
    const validCoords = properties
      .filter(p => p.lat && p.lng)
      .map(p => [p.lat, p.lng] as [number, number]);
      
    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [map, properties]);

  return null;
}

import MarkerClusterGroup from 'react-leaflet-cluster';

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

const createCustomClusterIcon = (cluster: any) => {
  return L.divIcon({
    html: `<div class="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center font-bold shadow-lg border-2 border-white dark:border-gray-800 text-sm hover:scale-110 transition-transform">${cluster.getChildCount()}</div>`,
    className: 'custom-marker-cluster',
    iconSize: L.point(40, 40, true),
  });
};

const createHoveredIcon = () => {
  return L.divIcon({
    html: `<div class="bg-indigo-600 rounded-full w-4 h-4 shadow-[0_0_15px_rgba(79,70,229,0.8)] border-2 border-white animate-pulse"></div>`,
    className: 'custom-hover-marker',
    iconSize: L.point(16, 16, true),
  });
};

// Ícone para imóveis com localização APROXIMADA (apenas bairro)
const approximateIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [1, -28],
  shadowSize: [33, 33],
  className: 'opacity-50'
});

export default function MapView({ properties, onPropertyClick, hoveredPropertyId }: MapViewProps) {
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
        
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createCustomClusterIcon}
          maxClusterRadius={60}
        >
          {properties.map(property => {
            // 1. Determinar coordenadas: Real (do geocoding) vs Fallback (da tabela mockada de zonas)
            let lat: number;
            let lng: number;
            let isApproximate: boolean;

            if (property.lat && property.lng) {
              // Coordenadas reais vindas do geocoding
              const spreadAmount = property.precision === 'street' ? 0.002 : 0.015;
              lat = jitter(property.lat, spreadAmount);
              lng = jitter(property.lng, spreadAmount);
              isApproximate = property.precision === 'neighborhood';
            } else {
              // Fallback: tabela mockada de zonas (imóveis antigos sem geocoding)
              const baseCoord = zoneCoordinates[property.zone] || defaultCenter;
              lat = jitter(baseCoord[0]);
              lng = jitter(baseCoord[1]);
              isApproximate = true;
            }

            // 2. Determinar ícone: Hovered > Approximate > Normal
            let icon;
            if (property.id === hoveredPropertyId) {
              icon = createHoveredIcon();
            } else if (isApproximate) {
              icon = approximateIcon;
            } else {
              icon = customIcon;
            }

            return (
              <Marker 
                key={property.id} 
                position={[lat, lng]} 
                icon={icon}
                zIndexOffset={property.id === hoveredPropertyId ? 1000 : 0}
              >
                <Popup className="custom-popup">
                  <div 
                      className="w-48 cursor-pointer flex flex-col gap-2"
                      onClick={() => onPropertyClick(property)}
                  >
                    {isApproximate && (
                      <div className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-1 rounded-md text-center">
                        📍 Localização aproximada
                      </div>
                    )}
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
        </MarkerClusterGroup>
        <MapBounds properties={properties} />
      </MapContainer>
    </div>
  );
}
