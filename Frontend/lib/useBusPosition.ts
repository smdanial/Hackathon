"use client";

import { useEffect, useRef, useState } from "react";
import type { BusRoute } from "./mockBusRoutes";

export interface BusPosition {
  lat: number;
  lng: number;
  /** Index of the waypoint the bus is currently at (useful for debugging). */
  waypointIndex: number;
}

/** How often the bus position is refreshed (ms). */
export const BUS_POLL_INTERVAL_MS = 3000;

/**
 * The single function that "talks to the backend". Today it simulates the bus
 * driving along the route by advancing one waypoint per poll, wrapping back to
 * the start when it reaches the end. When the real Django REST endpoint exists,
 * replace only this body with a fetch() call (plus whatever shape the API
 * returns) — the hook and every component consuming it stay unchanged.
 */
async function fetchNextPosition(
  route: BusRoute,
  waypointIndex: number
): Promise<BusPosition> {
  // Simulated network latency, so swapping in a real fetch() changes the
  // timing characteristics as little as possible.
  await new Promise((resolve) => setTimeout(resolve, 250));

  const nextIndex = (waypointIndex + 1) % route.waypoints.length;
  const next = route.waypoints[nextIndex];
  return { lat: next.lat, lng: next.lng, waypointIndex: nextIndex };
}

/** Position object for a given waypoint index on a route. */
function toPosition(route: BusRoute, waypointIndex: number): BusPosition {
  const point = route.waypoints[waypointIndex];
  return { lat: point.lat, lng: point.lng, waypointIndex };
}

/**
 * Polls a route's waypoints and returns the bus's current simulated position.
 * Starts at the first waypoint immediately, then advances every
 * BUS_POLL_INTERVAL_MS, looping back to the start when it reaches the end.
 */
export function useBusPosition(route: BusRoute | undefined) {
  const [position, setPosition] = useState<BusPosition | null>(() =>
    route ? toPosition(route, 0) : null
  );
  // Remember which route the position belongs to so a route switch resets it.
  const [positionRouteId, setPositionRouteId] = useState(route?.id);
  // Ref so the interval callback reads the latest index without a stale closure.
  const waypointIndexRef = useRef(0);

  // Reset to the first waypoint when the route changes. Adjusted during render
  // (the documented React pattern for deriving state from props), so no effect
  // calls setState synchronously — same approach as the Navbar's route change.
  if (positionRouteId !== route?.id) {
    setPositionRouteId(route?.id);
    setPosition(route ? toPosition(route, 0) : null);
  }

  useEffect(() => {
    if (!route) return;

    let cancelled = false;
    waypointIndexRef.current = 0;

    const tick = async () => {
      const next = await fetchNextPosition(route, waypointIndexRef.current);
      if (cancelled) return;
      waypointIndexRef.current = next.waypointIndex;
      setPosition(next);
    };

    const timer = setInterval(tick, BUS_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [route]);

  return position;
}
