"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bus,
  Loader2,
  MapPin,
  Navigation,
  Radio,
  Route,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import { apiRequest, ApiError, firstErrorMessage } from "@/lib/api";
import {
  authHeaders,
  getStudent,
  updateStoredStudent,
  type Student,
} from "@/lib/auth";
import { BUS_ROUTES } from "@/lib/mockBusRoutes";

/** How often a live fix is posted while sharing (ms). */
const SHARE_INTERVAL_MS = 7000;

/** Human message for each geolocation error code. */
function geoErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return "Location permission was denied. Allow location access in your browser to share the bus position.";
    case 2:
      return "Couldn't get your location right now. Check GPS/network and try again.";
    case 3:
      return "Location request timed out. Check your connection and try again.";
    default:
      return "Your location is unavailable right now.";
  }
}

/** The route label for a route code (fallback for unknown codes). */
function routeLabel(code: string | null | undefined): string {
  return BUS_ROUTES.find((r) => r.id === code)?.name ?? "—";
}

function DriverSharing() {
  const router = useRouter();
  // Session role is synchronous, so non-drivers bounce before first paint.
  const [profile, setProfile] = useState<Student | null>(() => getStudent());
  const [ready, setReady] = useState(() => (getStudent()?.role ?? null) === "driver");

  const [sharing, setSharing] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [lastPosted, setLastPosted] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Latest GPS fix, read by the posting interval without stale closures.
  const fixRef = useRef<{ lat: number; lng: number } | null>(null);
  // watchPosition id + the posting interval, cleared on stop/unmount.
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sharingRef = useRef(false);

  // Confirm the stored session is current and that this user is a driver.
  // A student granted driver mid-session (admin panel) is picked up here too.
  useEffect(() => {
    const session = getStudent();
    if (!session) return; // RequireAuth handles redirecting to /login.
    if (session.role !== "driver") {
      router.replace("/dashboard");
      return;
    }
    let cancelled = false;
    apiRequest<Student>("/auth/me/", { headers: authHeaders() })
      .then((fresh) => {
        if (cancelled) return;
        updateStoredStudent(fresh);
        setProfile(fresh);
        if (fresh.role !== "driver") {
          router.replace("/dashboard");
          return;
        }
        setReady(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Token issues are handled by RequireAuth; network hiccups shouldn't
        // lock a real driver out of the page.
        setReady(true);
        if (err instanceof ApiError && err.status >= 500) {
          setApiError(firstErrorMessage(err.body));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // If the driver leaves the page while sharing, stop sharing and drop the
  // watch so the bus doesn't stay "live" forever.
  useEffect(() => {
    return () => {
      stopWatch();
      if (sharingRef.current) {
        // Best-effort fire-and-forget: the backend marks the bus offline.
        apiRequest("/bus/stop-sharing/", {
          method: "POST",
          headers: authHeaders(),
        }).catch(() => {});
      }
    };
  }, [stopWatch]);

  const stopSharing = useCallback(() => {
    stopWatch();
    sharingRef.current = false;
    setSharing(false);
    setBusy(true);
    apiRequest("/bus/stop-sharing/", {
      method: "POST",
      headers: authHeaders(),
    })
      .catch((err: unknown) => {
        setApiError(
          err instanceof ApiError
            ? firstErrorMessage(err.body)
            : "Couldn't reach the server. Try stopping again."
        );
      })
      .finally(() => setBusy(false));
  }, [stopWatch]);

  const startSharing = useCallback(() => {
    setApiError(null);
    setGeoError(null);
    if (!("geolocation" in navigator)) {
      setGeoError("Geolocation is not supported by this browser.");
      return;
    }

    setSharing(true);
    sharingRef.current = true;

    // Push the latest fix to the backend every SHARE_INTERVAL_MS.
    const postFix = async () => {
      const fix = fixRef.current;
      if (!fix) return;
      try {
        setPosting(true);
        await apiRequest("/bus/update-location/", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ latitude: fix.lat, longitude: fix.lng }),
        });
        setLastPosted(new Date().toLocaleTimeString());
        setApiError(null);
      } catch (err) {
        setApiError(
          err instanceof ApiError
            ? firstErrorMessage(err.body)
            : "Couldn't reach the server. The next update will retry automatically."
        );
      } finally {
        setPosting(false);
      }
    };
    // Post immediately with whatever fix we have, then every interval.
    postFix();
    intervalRef.current = setInterval(postFix, SHARE_INTERVAL_MS);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const fix = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        fixRef.current = fix;
        setLat(fix.lat);
        setLng(fix.lng);
        setGeoError(null);
      },
      (err) => {
        setGeoError(geoErrorMessage(err.code));
        // Keep sharing with the last known fix (or nothing until one arrives).
        if (err.code === 1) {
          // Permission revoked — stop rather than spam error states.
          stopSharing();
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15_000 }
    );
  }, [stopSharing]);

  // Role guard gate: show a loader until /auth/me/ confirms the driver role.
  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-zinc-500">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
        <p className="text-sm font-medium">Checking your role…</p>
      </div>
    );
  }

  const assignedRoute = profile?.assigned_route ?? null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary-dark shadow-card">
          <Bus className="h-7 w-7" />
        </span>
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink sm:text-4xl">
            Driver Console
          </h1>
          <p className="mt-1 text-sm text-slate-700 sm:text-base">
            Share your live position so students can track your bus.
          </p>
        </div>
      </header>

      {/* Assigned route (read-only) */}
      <section className="rounded-2xl glass p-5 shadow-soft ring-1 ring-white/60 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-light text-primary-dark shadow-card">
              <Route className="h-6 w-6" />
            </span>
            <div>
              <p className="font-heading text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Your assigned route
              </p>
              <p className="font-heading text-xl font-bold text-ink">
                {routeLabel(assignedRoute)}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3.5 py-1.5 text-xs font-semibold text-emerald-800">
            <ShieldCheck className="h-4 w-4" />
            Driver verified
          </span>
        </div>

        {/* Current fix */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-white/70 p-4 shadow-card backdrop-blur-md">
            <p className="font-heading text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Live coordinates
            </p>
            <p className="mt-1 font-mono text-sm font-semibold text-ink">
              {lat !== null && lng !== null
                ? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                : "Waiting for GPS…"}
            </p>
          </div>
          <div className="rounded-xl bg-white/70 p-4 shadow-card backdrop-blur-md">
            <p className="font-heading text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Last update sent
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {lastPosted ?? "Never"}
            </p>
          </div>
        </div>
      </section>

      {/* Sharing control */}
      <section className="rounded-2xl glass p-5 shadow-soft ring-1 ring-white/60 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2.5 font-heading text-lg font-semibold text-ink">
              <span className="relative flex h-3 w-3">
                {sharing ? (
                  <>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-success" />
                  </>
                ) : (
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-zinc-400" />
                )}
              </span>
              {sharing ? "Sharing location" : "Not sharing"}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-slate-600">
              {sharing
                ? "Your position is sent to the tracker every few seconds. Students on your route can see the live bus and how far away it is."
                : "Press start to broadcast your live position to students tracking your route."}
            </p>
          </div>

          <button
            type="button"
            onClick={sharing ? stopSharing : startSharing}
            disabled={busy}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-soft transition-all duration-200 active:scale-[0.98] disabled:opacity-60 ${
              sharing
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-primary hover:bg-primary-dark"
            }`}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Radio className="h-4 w-4" />
            )}
            {sharing ? "Stop Sharing Location" : "Start Sharing Location"}
          </button>
        </div>
      </section>

      {/* Warnings */}
      {geoError ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-4 shadow-soft backdrop-blur">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-900">Location unavailable</p>
            <p className="text-sm font-medium text-amber-700">{geoError}</p>
          </div>
        </div>
      ) : null}

      {apiError ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-5 py-4 shadow-soft backdrop-blur">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <div>
            <p className="font-semibold text-rose-900">Update failed</p>
            <p className="text-sm font-medium text-rose-700">{apiError}</p>
          </div>
        </div>
      ) : null}

      {sharing && !posting ? (
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          Your position updates automatically — you can leave this tab open.
        </p>
      ) : null}
      {posting ? (
        <p className="flex items-center gap-2 text-xs font-medium text-primary-dark">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Sending position…
        </p>
      ) : null}
      {sharing ? (
        <p className="flex items-center gap-2 text-xs font-medium text-emerald-700">
          <Navigation className="h-3.5 w-3.5" />
          Students can now see your bus on the tracker.
        </p>
      ) : null}
    </div>
  );
}

export default function DriverPage() {
  return (
    <RequireAuth>
      <DriverSharing />
    </RequireAuth>
  );
}
