"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Building2, Bus, ContactRound, MapPin, Phone, Radio, UserRound } from "lucide-react";
import { BUS_ROUTES, type BusRoute } from "@/lib/mockBusRoutes";

// Leaflet touches window/document directly, so the map must never be
// server-rendered — this dynamic import with ssr:false is the standard
// client-only boundary for browser libraries in the App Router.
const BusMap = dynamic(() => import("@/components/BusMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center rounded-2xl bg-card text-sm font-medium text-slate-600 shadow-soft sm:h-[480px]">
      Loading map…
    </div>
  ),
});

/** "01712-345678" → "tel:+8801712345678" (BD numbers drop the leading 0). */
const telHref = (phone: string) => `tel:+880${phone.replace(/\D/g, "").slice(1)}`;

interface BusTrackerProps {
  /** Route to show on load, driven by the ?route= query param (defaults to Farmgate). */
  initialRoute?: BusRoute;
}

/**
 * Bus Tracker page shell: route selector tabs + live map. The active route
 * stays in sync with the ?route= query param so the navbar's dropdown links
 * (/bus?route=farmgate, /bus?route=gabtoli, /bus?route=uttara) land correctly.
 */
export default function BusTracker({ initialRoute = BUS_ROUTES[0] }: BusTrackerProps) {
  const [route, setRoute] = useState<BusRoute>(initialRoute);

  const selectRoute = (next: BusRoute) => {
    setRoute(next);
    // Keep the URL in sync so refreshes and navbar links stay consistent.
    window.history.replaceState(null, "", `?route=${next.id}`);
  };

  const pill = (active: boolean) =>
    `flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
      active
        ? "bg-primary text-ink shadow-soft"
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
          className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-card p-1.5 shadow-card"
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

      {/* Map + supporting copy */}
      <div className="flex flex-col gap-3">
        {/* Key by route id so switching routes remounts the map at its own center */}
        <BusMap key={route.id} route={route} />
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <Radio className="h-4 w-4 shrink-0 text-primary-dark" />
          Live location updates every few seconds — position is simulated for this demo.
        </p>

        {/* Driver & supervisor contacts — always visible, updates with the selected route */}
        <section
          aria-label={`Driver and supervisor for ${route.name}`}
          className="rounded-2xl bg-card p-5 shadow-soft sm:p-6"
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
              <div key={label} className="rounded-xl bg-white/70 p-4 shadow-card">
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
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-primary-dark shadow-card transition-all duration-200 hover:bg-primary hover:text-ink active:scale-95"
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
