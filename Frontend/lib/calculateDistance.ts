/** Straight-line distance helpers for the Bus Tracker. */

export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

/**
 * Great-circle (Haversine) distance between two coordinates, in kilometers.
 * Good enough for the "bus is X km away" badge — the route is along roads,
 * so the real distance is a bit longer than this straight line.
 */
export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(s));
}

/**
 * Format a distance in kilometers for display: "450 m" when under 1 km,
 * otherwise "2.4 km" (one decimal).
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.max(1, Math.round(km * 1000))} m`;
  }
  return `${km.toFixed(1)} km`;
}
