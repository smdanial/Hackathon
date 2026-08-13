"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "./api";
import { authHeaders } from "./auth";

/** How often the student page re-checks the bus position (ms). */
export const BUS_POLL_INTERVAL_MS = 5000;

/** Shape of the Django endpoint response (snake_case). */
interface ApiBusLocation {
  route: string;
  latitude: number | null;
  longitude: number | null;
  last_updated: string | null;
  is_active: boolean;
}

export interface BusLocationState {
  lat: number | null;
  lng: number | null;
  /** When the driver last shared a fix, as an ISO string (null = never). */
  lastUpdated: string | null;
  /** True while the driver is actively sharing. */
  isActive: boolean;
  /** Active AND the fix is fresh (< 2 min old) at the last poll. */
  live: boolean;
}

const OFFLINE: BusLocationState = {
  lat: null,
  lng: null,
  lastUpdated: null,
  isActive: false,
  live: false,
};

/** A bus fix is "recent" if shared within the last 2 minutes. */
const STALE_AFTER_MS = 2 * 60 * 1000;

/**
 * Polls GET /api/bus/location/<route>/ every BUS_POLL_INTERVAL_MS and returns
 * the bus's current live position for that route. A route with no fix yet, or
 * whose driver stopped sharing, comes back as the offline state.
 */
export function useBusLocation(routeId: string): BusLocationState {
  const [state, setState] = useState<BusLocationState>(OFFLINE);

  useEffect(() => {
    let cancelled = false;

    const fetchLocation = async () => {
      try {
        const data = await apiRequest<ApiBusLocation>(
          `/bus/location/${routeId}/`,
          { headers: authHeaders() }
        );
        if (!cancelled) {
          // Recency is judged at poll time (the hook is the single source of
          // truth); the next poll refreshes it within a few seconds.
          const fresh =
            data.is_active &&
            data.last_updated !== null &&
            Date.now() - new Date(data.last_updated).getTime() < STALE_AFTER_MS;
          setState({
            lat: data.latitude,
            lng: data.longitude,
            lastUpdated: data.last_updated,
            isActive: data.is_active,
            live: fresh,
          });
        }
      } catch {
        // Network hiccup or a revoked session — keep the last known state so
        // the map doesn't flicker; the next poll retries automatically.
      }
    };

    fetchLocation();
    const timer = setInterval(fetchLocation, BUS_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [routeId]);

  return state;
}
