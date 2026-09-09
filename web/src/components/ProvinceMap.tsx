'use client';
import { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Product } from '@/lib/types';

// MapLibre + CARTO positron — the estate standard (conflict-tracker, geopolitics,
// HCMC, chonburi, UNL). No access token, so the map cannot break on a revoked key.
const TILE_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

// Chiang Mai centre
const CM_CENTER: [number, number] = [98.9817, 18.7904];
const CM_ZOOM = 10;
const CM_MIN_ZOOM = 9;

interface Props {
  products: Product[];
  height?: string;
  interactive?: boolean;
}

export default function ProvinceMap({ products, height = '48dvh', interactive = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    import('maplibre-gl').then(mod => {
      if (cancelled || !containerRef.current) return;
      const maplibregl = mod.default;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: TILE_STYLE,
        center: CM_CENTER,
        zoom: CM_ZOOM,
        minZoom: CM_MIN_ZOOM,   // §11.9 — no world-copy repetition
        renderWorldCopies: false,
        interactive,
        // CARTO and OpenStreetMap require attribution; compact keeps it to one corner mark.
        attributionControl: { compact: true },
      });

      mapRef.current = map;

      map.on('load', () => {
        if (cancelled) return;
        setLoaded(true);

        // Add product markers
        products.forEach(p => {
          if (typeof p.lat !== 'number' || typeof p.lon !== 'number') return;

          const el = document.createElement('div');
          el.style.cssText = `
            width: 10px; height: 10px;
            background: #f59e0b;
            border: 1.5px solid #1a1410;
            cursor: pointer;
          `;

          const popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: true,
            offset: 10,
            maxWidth: '200px',
          }).setHTML(
            `<div style="font-family:'IBM Plex Sans Thai',sans-serif;font-size:11px;line-height:1.5;">
              <strong>${p.name_th}</strong><br>
              <span style="opacity:.6">${p.district_th}</span>
            </div>`
          );

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([p.lon, p.lat])
            .setPopup(popup)
            .addTo(map);

          markersRef.current.push(marker);
        });
      });

      map.on('error', () => setError(true));
    }).catch(() => setError(true));

    return () => {
      cancelled = true;
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="province-map-wrap" style={{ height }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {!loaded && !error && (
        <div className="map-loading thai">กำลังโหลดแผนที่เชียงใหม่…</div>
      )}
      {error && (
        <div className="map-loading" style={{ flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '24px', opacity: 0.3 }}>◈</span>
          <span className="thai" style={{ fontSize: '11px', opacity: 0.5 }}>แผนที่ไม่พร้อมใช้งาน</span>
        </div>
      )}
    </div>
  );
}
