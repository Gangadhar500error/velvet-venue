"use client";

import { useEffect, useRef, useState } from "react";
import type { Workspace } from "../data/workspaces";
import { CITY_CENTERS, getVenueCoords } from "./cityMapCoords";

interface VenueMapProps {
  venues: Workspace[];
  citySlug: string;
  highlightedId: string | null;
  onPinClick: (venueId: string) => void;
  className?: string;
}

function loadScript(src: string, id: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.id = id;
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

function loadCss(href: string, id: string) {
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function pinHtml(active: boolean, price: number) {
  const bg = active ? "#6A1830" : "#C89B3C";
  const label = `₹${Math.round(price / 1000)}k`;
  return `<div style="background:${bg};color:#fff;padding:4px 8px;border-radius:999px;font:600 11px/1.2 system-ui,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.25);white-space:nowrap;border:2px solid #fff;transform:translateY(-4px)">${label}</div>`;
}

export default function VenueMap({
  venues,
  citySlug,
  highlightedId,
  onPinClick,
  className = "",
}: VenueMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());
  const [ready, setReady] = useState(false);
  const [engine, setEngine] = useState<"google" | "leaflet" | null>(null);
  const onPinClickRef = useRef(onPinClick);
  onPinClickRef.current = onPinClick;

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let leafletMap: any = null;

    async function init() {
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      const center = CITY_CENTERS[citySlug] || CITY_CENTERS.hyderabad;

      if (key) {
        try {
          await loadScript(
            `https://maps.googleapis.com/maps/api/js?key=${key}`,
            "vv-google-maps"
          );
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const g = (window as any).google;
          if (cancelled || !containerRef.current || !g?.maps) return;
          const map = new g.maps.Map(containerRef.current, {
            center,
            zoom: 12,
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });
          mapRef.current = map;
          setEngine("google");
          setReady(true);
          return;
        } catch {
          /* leaflet fallback */
        }
      }

      loadCss("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", "vv-leaflet-css");
      await loadScript(
        "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
        "vv-leaflet-js"
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (window as any).L;
      if (cancelled || !containerRef.current || !L) return;

      leafletMap = L.map(containerRef.current, { zoomControl: true }).setView(
        [center.lat, center.lng],
        12
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(leafletMap);

      mapRef.current = leafletMap;
      setEngine("leaflet");
      setReady(true);
      setTimeout(() => leafletMap.invalidateSize(), 120);
    }

    init();

    return () => {
      cancelled = true;
      markersRef.current.clear();
      if (leafletMap) {
        try {
          leafletMap.remove();
        } catch {
          /* ignore */
        }
      }
      mapRef.current = null;
    };
  }, [citySlug]);

  useEffect(() => {
    if (!ready || !mapRef.current || !engine) return;
    const center = CITY_CENTERS[citySlug] || CITY_CENTERS.hyderabad;

    if (engine === "google") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = (window as any).google;
      const map = mapRef.current;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current.clear();

      const bounds = new g.maps.LatLngBounds();
      venues.forEach((venue) => {
        const pos = getVenueCoords(citySlug, venue.id, venue.area);
        bounds.extend(pos);
        const active = venue.id === highlightedId;
        const marker = new g.maps.Marker({
          position: pos,
          map,
          title: venue.name,
          label: {
            text: `₹${Math.round(venue.price / 1000)}k`,
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: "600",
          },
          icon: {
            path: g.maps.SymbolPath.CIRCLE,
            scale: active ? 14 : 12,
            fillColor: active ? "#6A1830" : "#C89B3C",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });
        marker.addListener("click", () => onPinClickRef.current(venue.id));
        markersRef.current.set(venue.id, marker);
      });

      if (venues.length > 0) map.fitBounds(bounds, 48);
      else {
        map.setCenter(center);
        map.setZoom(12);
      }
      return;
    }

    // leaflet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    const map = mapRef.current;
    markersRef.current.forEach((m) => {
      try {
        map.removeLayer(m);
      } catch {
        /* ignore */
      }
    });
    markersRef.current.clear();

    const latLngs: [number, number][] = [];
    venues.forEach((venue) => {
      const pos = getVenueCoords(citySlug, venue.id, venue.area);
      latLngs.push([pos.lat, pos.lng]);
      const active = venue.id === highlightedId;
      const icon = L.divIcon({
        className: "vv-map-pin",
        html: pinHtml(active, venue.price),
        iconSize: [64, 32],
        iconAnchor: [32, 32],
      });
      const marker = L.marker([pos.lat, pos.lng], { icon }).addTo(map);
      marker.on("click", () => onPinClickRef.current(venue.id));
      marker.bindPopup(
        `<div style="min-width:160px">
          <strong style="font-size:13px">${venue.name}</strong>
          <div style="font-size:12px;color:#555;margin-top:4px">${venue.area}</div>
          <div style="font-size:12px;margin-top:4px">★ ${venue.rating} · from ₹${venue.price.toLocaleString("en-IN")}</div>
        </div>`
      );
      markersRef.current.set(venue.id, marker);
    });

    if (latLngs.length > 0) {
      map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40], maxZoom: 14 });
    } else {
      map.setView([center.lat, center.lng], 12);
    }
    setTimeout(() => map.invalidateSize?.(), 100);
  }, [ready, engine, venues, citySlug, highlightedId]);

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      <div ref={containerRef} className="absolute inset-0 h-full w-full z-0" />
      {!ready && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-gray-500 bg-gray-100">
          Loading map…
        </div>
      )}
    </div>
  );
}
