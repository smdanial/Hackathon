"use client";

import { MapContainer, Marker, Polyline, TileLayer, Tooltip } from "react-leaflet";
import L from "leaflet";
import type { BusRoute } from "@/lib/mockBusRoutes";
import type { LatLng } from "@/lib/calculateDistance";

// Custom markers as plain colored dots with a white ring — matches the
// dashboard palette and avoids Leaflet's default (broken-under-bundlers) icon.
const busIcon = L.divIcon({
  className: "campusease-bus-marker",
  html: `<div style="width:22px;height:22px;border-radius:9999px;background:#4f46e5;border:3px solid #ffffff;box-shadow:0 0 0 4px rgba(79,70,229,0.25),0 2px 8px rgba(15,23,42,0.35);"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const studentIcon = L.divIcon({
  className: "campusease-student-marker",
  html: `<div style="width:18px;height:18px;border-radius:9999px;background:#0ea5e9;border:3px solid #ffffff;box-shadow:0 0 0 4px rgba(14,165,233,0.25),0 2px 8px rgba(15,23,42,0.35);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const startIcon = L.divIcon({
  className: "campusease-bus-marker",
  html: `<div style="width:16px;height:16px;border-radius:9999px;background:#22c55e;border:3px solid #ffffff;box-shadow:0 2px 8px rgba(15,23,42,0.35);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const endIcon = L.divIcon({
  className: "campusease-bus-marker",
  html: `<div style="width:16px;height:16px;border-radius:9999px;background:#ef4444;border:3px solid #ffffff;box-shadow:0 2px 8px rgba(15,23,42,0.35);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

interface BusMapProps {
  /** The route whose path and stops are drawn. */
  route: BusRoute;
  /** The bus's current live position (null while offline). */
  bus: LatLng | null;
  /** The viewer's own position from the browser geolocation API. */
  student: LatLng | null;
  /** Whether the bus is actively sharing a recent fix (drives the badge). */
  live: boolean;
}

/**
 * Leaflet map for one bus route: draws the full path as a polyline, pins the
 * origin and destination, the bus's live position, and the viewer's own
 * position. Rendered only on the client (see the dynamic import in
 * BusTracker) because Leaflet touches window/document directly.
 */
export default function BusMap({ route, bus, student, live }: BusMapProps) {
  const start = route.waypoints[0];
  const end = route.waypoints[route.waypoints.length - 1];
  // Center the view between the two ends so the whole route fits.
  const center: [number, number] = [
    (start.lat + end.lat) / 2,
    (start.lng + end.lng) / 2,
  ];
  const path: [number, number][] = route.waypoints.map((p) => [p.lat, p.lng]);

  return (
    <div className="relative isolate overflow-hidden rounded-2xl shadow-soft ring-1 ring-slate-200/60">
      <MapContainer center={center} zoom={11} className="z-0 h-[420px] w-full sm:h-[480px]">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline
          positions={path}
          pathOptions={{ color: "#4f46e5", weight: 5, opacity: 0.85 }}
        />
        <Marker position={[start.lat, start.lng]} icon={startIcon}>
          <Tooltip direction="right" offset={[8, 0]}>
            Start · {route.name}
          </Tooltip>
        </Marker>
        <Marker position={[end.lat, end.lng]} icon={endIcon}>
          <Tooltip direction="left" offset={[-8, 0]}>
            NITER (Savar)
          </Tooltip>
        </Marker>
        {bus ? (
          <Marker position={[bus.lat, bus.lng]} icon={busIcon}>
            <Tooltip direction="top" offset={[0, -12]}>
              Campus bus
            </Tooltip>
          </Marker>
        ) : null}
        {student ? (
          <Marker position={[student.lat, student.lng]} icon={studentIcon}>
            <Tooltip direction="bottom" offset={[0, 12]}>
              You
            </Tooltip>
          </Marker>
        ) : null}
      </MapContainer>

      {/* Live/offline badge — pointer-events-none so map interactions pass through */}
      <div
        className={`pointer-events-none absolute right-4 top-4 z-[500] flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold shadow-soft backdrop-blur ${
          live ? "text-ink" : "text-zinc-500"
        }`}
      >
        <span className="relative flex h-2 w-2">
          {live ? (
            <>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </>
          ) : (
            <span className="relative inline-flex h-2 w-2 rounded-full bg-zinc-400" />
          )}
        </span>
        {live ? "Live" : "Offline"}
      </div>
    </div>
  );
}
