import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Complaint, LocationData } from '../../types';
import { formatCategoryLabel } from '../../utils/formatters';

// Fix Leaflet default icon path issues in Vite
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface CivicMapProps {
  center?: [number, number];
  zoom?: number;
  complaints?: Complaint[];
  selectedLocation?: LocationData | null;
  onSelectLocation?: (loc: { lat: number; lng: number; address?: string }) => void;
  interactiveSelection?: boolean;
  height?: string;
  onComplaintClick?: (complaint: Complaint) => void;
  onMarkerClick?: (complaint: Complaint) => void;
}

const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'pothole':
    case 'road_blockage':
      return '#ea580c'; // Amber / Orange
    case 'flood':
    case 'drainage':
      return '#0284c7'; // Blue
    case 'garbage':
      return '#16a34a'; // Green
    case 'broken_street_light':
    case 'electricity':
      return '#ca8a04'; // Yellow
    case 'water_leakage':
      return '#2563eb'; // Deep Blue
    case 'landslide':
      return '#dc2626'; // Red
    default:
      return '#475569'; // Slate
  }
};

const createMarkerIcon = (color: string, isResolved = false) => {
  const html = `
    <div style="
      width: 28px;
      height: 28px;
      background-color: ${isResolved ? '#10b981' : color};
      border: 2.5px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 11px;
      font-weight: bold;
    ">
      ${isResolved ? '✓' : '●'}
    </div>
  `;
  return L.divIcon({
    html,
    className: 'civic-marker-custom',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

export const CivicMap: React.FC<CivicMapProps> = ({
  center = [18.7512, 73.8643], // Default: Khed Gram Panchayat, Pune District
  zoom = 13,
  complaints = [],
  selectedLocation,
  onSelectLocation,
  interactiveSelection = false,
  height = '420px',
  onComplaintClick,
  onMarkerClick,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const selectionMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
      });

      // Use OpenStreetMap standard tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | CivicConnect GIS',
        maxZoom: 19,
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;

      if (interactiveSelection && onSelectLocation) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          onSelectLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
        });
      }
    }

    return () => {
      // Clean up map instance on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center when prop changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center[0], center[1], zoom]);

  // Update selected location pin (e.g. for Issue Reporting Wizard)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (selectionMarkerRef.current) {
      selectionMarkerRef.current.remove();
      selectionMarkerRef.current = null;
    }

    if (selectedLocation) {
      const pinIcon = L.divIcon({
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background-color: #dc2626;
            border: 3px solid #ffffff;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px rgba(220,38,38,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 10px; height: 10px; background: #ffffff; border-radius: 50%; transform: rotate(45deg);"></div>
          </div>
        `,
        className: 'civic-selection-pin',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([selectedLocation.latitude, selectedLocation.longitude], {
        icon: pinIcon,
        draggable: Boolean(interactiveSelection && onSelectLocation),
      }).addTo(mapInstanceRef.current);

      if (interactiveSelection && onSelectLocation) {
        marker.on('dragend', (e) => {
          const newPos = (e.target as L.Marker).getLatLng();
          onSelectLocation({ lat: newPos.lat, lng: newPos.lng });
        });
      }

      if (selectedLocation.address) {
        marker.bindPopup(`<strong>Selected Geotag</strong><br/>${selectedLocation.address}`).openPopup();
      }

      selectionMarkerRef.current = marker;
    }
  }, [selectedLocation, interactiveSelection, onSelectLocation]);

  // Render complaint markers
  useEffect(() => {
    if (!markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    complaints.forEach((c) => {
      if (!c.location?.latitude || !c.location?.longitude) return;

      const isResolved = c.status === 'Resolved';
      const color = getCategoryColor(c.category);
      const marker = L.marker([c.location.latitude, c.location.longitude], {
        icon: createMarkerIcon(color, isResolved),
      });

      const popupContent = `
        <div style="font-family: var(--font-sans, sans-serif); min-width: 220px; max-width: 260px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 11px; font-weight: 700; font-family: monospace; color: #1e3a8a;">
              ${c.ticketNumber}
            </span>
            <span style="
              font-size: 10px;
              font-weight: 700;
              padding: 2px 6px;
              border-radius: 9999px;
              background-color: ${isResolved ? '#d1fae5' : '#fef3c7'};
              color: ${isResolved ? '#065f46' : '#92400e'};
            ">
              ${c.status.toUpperCase()}
            </span>
          </div>
          <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px; line-height: 1.3;">
            ${c.title}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
            📍 ${c.location.ward || c.location.address}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            <span>Category: <strong>${formatCategoryLabel(c.category)}</strong></span>
            <span>👍 <strong>${c.upvotesCount}</strong></span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      if (onComplaintClick || onMarkerClick) {
        marker.on('click', () => {
          onComplaintClick?.(c);
          onMarkerClick?.(c);
        });
      }

      markersLayerRef.current?.addLayer(marker);
    });
  }, [complaints, onComplaintClick, onMarkerClick]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Map Legend Floating Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(4px)',
          padding: '6px 10px',
          borderRadius: 'var(--radius-md)',
          fontSize: '11px',
          zIndex: 400,
          border: '1px solid rgba(0,0,0,0.1)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ea580c', display: 'inline-block' }}></span>
          Roads/Potholes
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0284c7', display: 'inline-block' }}></span>
          Water/Drainage
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
          Resolved
        </span>
      </div>
    </div>
  );
};
