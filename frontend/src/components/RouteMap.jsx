import React, { useEffect, useRef } from 'react';
import { STOP_TYPES } from '../utils/hosConstants';

/**
 * RouteMap — Renders an interactive Leaflet map showing
 * the driving route with stop markers.
 */
export default function RouteMap({ route, stops = [] }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    // Clean up previous map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const L = window.L;
    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([39.8283, -98.5795], 5); // Center of US

    mapInstanceRef.current = map;

    // Dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Draw route polyline
    if (route?.geometry?.length > 0) {
      const coords = route.geometry.map(([lon, lat]) => [lat, lon]);
      const polyline = L.polyline(coords, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.8,
        smoothFactor: 1,
      }).addTo(map);

      // Add glow effect
      L.polyline(coords, {
        color: '#3b82f6',
        weight: 10,
        opacity: 0.15,
        smoothFactor: 1,
      }).addTo(map);

      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    }

    // Add stop markers
    stops.forEach((stop, idx) => {
      if (!stop.coordinates || stop.coordinates.length < 2) return;

      const [lat, lon] = stop.coordinates;
      const config = STOP_TYPES[stop.type] || { label: stop.type, color: '#64748b' };

      // Custom circular marker
      const markerHtml = `
        <div style="
          width: 28px; height: 28px;
          background: ${config.color};
          border: 3px solid rgba(255,255,255,0.9);
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 0 2px ${config.color}40;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px;
          color: white;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
        ">${idx + 1}</div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([lat, lon], { icon }).addTo(map);

      // Popup content
      const popupContent = `
        <div style="font-family: Inter, sans-serif; min-width: 180px;">
          <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px; color: #e2e8f0;">
            ${config.label}
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">
            ${stop.location}
          </div>
          ${stop.mile_marker > 0 ? `
            <div style="font-size: 11px; color: #64748b;">
              Mile ${Math.round(stop.mile_marker)}
            </div>
          ` : ''}
          ${stop.remarks ? `
            <div style="font-size: 10px; color: #475569; margin-top: 4px; font-style: italic;">
              ${stop.remarks}
            </div>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'dark-popup',
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [route, stops]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <h2 className="text-lg font-semibold text-white">Route Map</h2>
      </div>
      <div
        ref={mapRef}
        className="w-full rounded-xl border border-slate-700/50 overflow-hidden"
        style={{ height: '400px' }}
      />
    </div>
  );
}
