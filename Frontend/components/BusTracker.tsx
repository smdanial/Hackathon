"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Building2,
  Bus,
  ContactRound,
  MapPin,
  Navigation,
  Phone,
  Radio,
  UserRound,
} from "lucide-react";
import { BUS_ROUTES, type BusRoute } from "@/lib/mockBusRoutes";
import { useBusLocation } from "@/lib/useBusPosition";
import { formatDistance, haversineKm, type LatLng } from "@/lib/calculateDistance";

// Leaflet touches window/document directly, so the map must never be
// server-rendered — this dynamic import with ssr:false is the standard
// client-only boundary for browser libraries in the App Router.
const BusMap = dynamic(() => import("@/components/BusMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center rounded-2xl glass text-sm font-medium text-slate-600 shadow-soft sm:h-[480px]">
      Loading map…
    </div>
  ),
});

/** "01712-345678" → "tel:+8801712345678" (BD numbers drop the leading 0). */
const telHref = (phone: string) => `tel:+880${phone.replace(/\D/g, "").slice(1)}`;

/** Human message for each geolocation error code. */
function geoErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return "Location permission was denied. Allow location access to see how far the bus is.";
    case 2:
      return "Couldn't get your location right now. Try again in a moment.";
    case 3:
      return "Location request timed out. Check your connection and refresh.";
    default:
      return "Your location is unavailable, so distance can't be calculated.";
  }
}

interface BusTrackerProps {
  /** Route to show on load, driven by the ?route= query param (defaults to Farmgate). */
  initialRoute?: BusRoute;
}

/**
 * Bus Tracker page shell: route selector tabs + live map + distance badge.
 * The bus position is polled from the Django backend every few seconds; the
 * viewer's own position comes from the browser's geolocation API.
 */
export default function BusTracker({ initialRoute = BUS_ROUTES[0] }: BusTrackerProps) {
  const [route, setRoute] = useState<BusRoute>(initialRoute);
  const bus = useBusLocation(route.id);

  // Viewer's own position (used for the "X km away" badge and the map dot).
  const [studentPos, setStudentPos] = useState<LatLng | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      // Deferred so the state update doesn't happen synchronously in the
      // effect body (the lint rule's "cascading render" concern).
      const id = window.setTimeout(
        () => setGeoError("Geolocation is not supported by this browser."),
        0
      );
      return () => window.clearTimeout(id);
    }
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setStudentPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGeoError(null);
      },
      (err) => {
        if (!cancelled) setGeoError(geoErrorMessage(err.code));
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const selectRoute = (next: BusRoute) => {
    setRoute(next);
    // Keep the URL in sync so refreshes and navbar links stay consistent.
    window.history.replaceState(null, "", `?route=${next.id}`);
  };

  // Live iff the driver is sharing AND the fix is fresh (< 2 min old). The
  // recency check runs in the polling hook, so nothing here calls Date.now()
  // during render.
  const live = bus.live;

  const busPos: LatLng | null =
    live && bus.lat !== null && bus.lng !== null ? { lat: bus.lat, lng: bus.lng } : null;

  const distanceKm =
    busPos && studentPos ? haversineKm(studentPos, busPos) : null;

  const pill = (active: boolean) =>
    `flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
      active
        ? "bg-primary text-white shadow-soft"
        : "text-slate-600 hover:bg-white/70 hover:text-ink"
    }`;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary-dark shadow-card">
            <Bus className="h-7 w-7" />
          </span>
          <div>
            <h1 className="font-heading text-3xl font-bold text-ink sm:text-4xl">
              Bus Tracker
            </h1>
            <p className="mt-1 text-sm text-slate-700 sm:text-base">
              Follow the campus buses on their way to NITER, Savar.
            </p>
          </div>
        </div>

        {/* Route selector */}
        <div
          role="tablist"
          aria-label="Campus bus routes"
          className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full glass p-1.5 shadow-card"
        >
          {BUS_ROUTES.map((r) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={route.id === r.id}
              onClick={() => selectRoute(r)}
              className={pill(route.id === r.id)}
            >
              <MapPin className="h-4 w-4 shrink-0" />
              {r.name}
            </button>
          ))}
        </div>
      </header>

      {/* Status + distance badge */}
      {live ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-4 shadow-soft backdrop-blur">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-soft">
            <Bus className="h-6 w-6" />
          </span>
          <div>
            {distanceKm !== null ? (
              <>
                <p className="font-heading text-lg font-bold text-emerald-900">
                  Bus is {formatDistance(distanceKm)} away
                </p>
                <p className="text-sm font-medium text-emerald-700">
                  {route.name} · location updated moments ago
                </p>
              </>
            ) : (
              <>
                <p className="font-heading text-lg font-bold text-emerald-900">
                  Bus is on the way
                </p>
                <p className="text-sm font-medium text-emerald-700">
                  {route.name} · enable location access to see how far away it is.
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-4 shadow-soft backdrop-blur">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 text-white shadow-soft">
            <Radio className="h-6 w-6" />
          </span>
          <div>
            <p className="font-heading text-lg font-bold text-amber-900">
              Bus is currently offline
            </p>
            <p className="text-sm font-medium text-amber-700">
              Location not available for {route.name} — the driver has not started
              sharing yet.
            </p>
          </div>
        </div>
      )}

      {/* Map + supporting copy */}
      <div className="flex flex-col gap-3">
        {/* Key by route id so switching routes remounts the map at its own center */}
        <BusMap key={route.id} route={route} bus={busPos} student={studentPos} live={live} />

        {geoError ? (
          <p className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            <Navigation className="mt-0.5 h-4 w-4 shrink-0" />
            {geoError}
          </p>
        ) : null}

        <p className="flex items-center gap-2 text-sm text-slate-600">
          <Radio className="h-4 w-4 shrink-0 text-primary-dark" />
          Position is shared live by the bus driver — the map refreshes every few
          seconds.
        </p>

        {/* Driver & supervisor contacts — always visible, updates with the selected route */}
        <section
          aria-label={`Driver and supervisor for ${route.name}`}
          className="rounded-2xl glass p-5 shadow-soft ring-1 ring-white/60 sm:p-6"
        >
          <h2 className="flex items-center gap-3 font-heading text-lg font-semibold text-ink">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary-dark shadow-card">
              <ContactRound className="h-5 w-5" />
            </span>
            Driver &amp; Supervisor
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              {
                label: "Driver",
                name: route.driverName,
                phone: route.driverPhone,
                icon: UserRound,
              },
              {
                label: "Supervisor",
                name: route.supervisorName,
                phone: route.supervisorPhone,
                icon: Building2,
              },
            ].map(({ label, name, phone, icon: Icon }) => (
              <div key={label} className="rounded-xl bg-white/70 p-4 shadow-card backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-light text-primary-dark">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-heading text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                      {label}
                    </p>
                    <p className="truncate font-medium text-ink">{name}</p>
                  </div>
                </div>
                <a
                  href={telHref(phone)}
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-primary-dark shadow-card transition-all duration-200 hover:bg-primary hover:text-white active:scale-95"
                >
                  <Phone className="h-4 w-4" />
                  {phone}
                </a>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
