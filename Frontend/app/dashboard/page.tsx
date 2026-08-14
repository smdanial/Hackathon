"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  Bus,
  DoorOpen,
  FileText,
  Loader2,
  PackageSearch,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Room } from "@/lib/mockRooms";
import { getRoomStatus, timeToMinutes, toISODate } from "@/lib/getRoomStatus";
import { apiRequest, ApiError, firstErrorMessage } from "@/lib/api";
import { authHeaders } from "@/lib/auth";
import { useSession } from "@/lib/useSession";
import RequireAuth from "@/components/RequireAuth";

/** Room shape as served by the Django API (snake_case). */
interface ApiScheduleEntry {
  id: number;
  /** Null = repeats every day (seeded schedule); set = one day only (booking). */
  date: string | null;
  start_time: string;
  end_time: string;
  class_name: string;
  teacher_name: string;
}

interface ApiRoom {
  id: number;
  building: string;
  floor: number;
  room_number: string;
  capacity: number;
  schedule: ApiScheduleEntry[];
}

function toRoom(api: ApiRoom): Room {
  const today = toISODate(new Date());
  return {
    id: String(api.id),
    building: api.building,
    floor: api.floor,
    roomNumber: api.room_number,
    capacity: api.capacity,
    schedule: api.schedule
      .filter((s) => s.date === null || s.date === today)
      .map((s) => ({
        startTime: s.start_time,
        endTime: s.end_time,
        className: s.class_name,
        teacherName: s.teacher_name,
      })),
  };
}

interface ApiBooking {
  id: number;
  room: number;
}

interface ApiFoundItem {
  id: number;
  category: string;
}

const HOURS = Array.from({ length: 14 }, (_, i) => 8 + i); // 08:00 – 21:00

/** True when a room has no class covering the given hour (h*60..h*60+60). */
function roomFreeAt(room: Room, hour: number): boolean {
  const start = hour * 60;
  const end = start + 60;
  return !room.schedule.some(
    (entry) =>
      timeToMinutes(entry.startTime) < end &&
      timeToMinutes(entry.endTime) > start
  );
}

const FORMATTER = new Intl.NumberFormat("en-US");

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  badge: string;
  badgeTone: "green" | "red" | "neutral";
  icon: LucideIcon;
  href?: string;
}

/** One of the top-row metric cards (ref: Today's orders / week / month). */
function StatCard({ label, value, sub, badge, badgeTone, icon: Icon, href }: StatCardProps) {
  const badgeClass =
    badgeTone === "green"
      ? "bg-green-100 text-green-700"
      : badgeTone === "red"
        ? "bg-red-100 text-red-600"
        : "bg-zinc-100 text-zinc-600";
  const body = (
    <div className="flex flex-col gap-4 rounded-2xl glass p-5 shadow-card ring-1 ring-white/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
          <Icon className="h-5 w-5" />
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}
        >
          {badge}
        </span>
      </div>
      <div>
        <p className="font-heading text-3xl font-bold tracking-tight text-ink">
          {value}
        </p>
        <p className="mt-1 text-sm font-medium text-zinc-500">{label}</p>
        <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

/** Vertical mini bar chart used inside the metric cards. */
function MiniBars({ data, color = "bg-zinc-900" }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="mt-4 flex h-20 items-end gap-2">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex h-16 w-full items-end">
            <div
              className={`w-full rounded-t-sm ${color} ${d.value === 0 ? "bg-zinc-200" : ""}`}
              style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
          <span className="w-full truncate text-center text-[10px] font-medium text-zinc-400">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function Dashboard() {
  // Who's signed in — hides the Lab Report link for Librarians.
  const { student } = useSession();
  const [now, setNow] = useState(() => new Date());
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [loggedIn, setLoggedIn] = useState(false);
  const [bookingCount, setBookingCount] = useState(0);
  const [foundItems, setFoundItems] = useState<ApiFoundItem[]>([]);

  // Live clock — free-room counts re-derive from the current time.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  // Load rooms (public) plus the signed-in student's bookings and the found
  // items (both need a token; 401 just means "signed out").
  useEffect(() => {
    let cancelled = false;
    apiRequest<ApiRoom[]>("/rooms/")
      .then((data) => {
        if (!cancelled) setRooms(data.map(toRoom));
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? firstErrorMessage(err.body)
              : "Could not load campus data."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const headers = authHeaders();
    if (headers.Authorization) {
      // Any successful authenticated call means we're signed in (async, so no
      // sync setState inside the effect).
      apiRequest<ApiBooking[]>("/rooms/bookings/", { headers })
        .then((data) => {
          if (!cancelled) {
            setBookingCount(data.length);
            setLoggedIn(true);
          }
        })
        .catch(() => {
          // 401/network — treat as signed out.
        });
      apiRequest<ApiFoundItem[]>("/lost-found/", { headers })
        .then((data) => {
          if (!cancelled) setFoundItems(data);
        })
        .catch(() => {
          // 401/network — treat as signed out.
        });
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const freeNow = useMemo(
    () => rooms.filter((room) => getRoomStatus(room, now).status === "free").length,
    [rooms, now]
  );

  // Rooms grouped by building.
  const buildings = useMemo(() => {
    const map = new Map<string, { total: number; free: number; classes: number }>();
    for (const room of rooms) {
      const entry = map.get(room.building) ?? { total: 0, free: 0, classes: 0 };
      entry.total += 1;
      if (getRoomStatus(room, now).status === "free") entry.free += 1;
      entry.classes += room.schedule.length;
      map.set(room.building, entry);
    }
    return [...map.entries()]
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.total - a.total);
  }, [rooms, now]);

  const totalClasses = useMemo(
    () => rooms.reduce((sum, room) => sum + room.schedule.length, 0),
    [rooms]
  );

  // Per-hour activity for the main chart.
  const [chartMetric, setChartMetric] = useState<"classes" | "free">("classes");
  const chartData = useMemo(
    () =>
      HOURS.map((hour) => ({
        hour,
        value:
          chartMetric === "classes"
            ? rooms.reduce(
                (sum, room) =>
                  sum +
                  room.schedule.filter(
                    (entry) => Number(entry.startTime.split(":")[0]) === hour
                  ).length,
                0
              )
            : rooms.filter((room) => roomFreeAt(room, hour)).length,
      })),
    [rooms, chartMetric]
  );
  const chartMax = Math.max(1, ...chartData.map((d) => d.value));

  const foundByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of foundItems) {
      map.set(item.category, (map.get(item.category) ?? 0) + 1);
    }
    return [...map.entries()].map(([label, value]) => ({ label, value }));
  }, [foundItems]);

  const currentHour = now.getHours();
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Dashboard
          </h1>
          {/* Localized date differs between the server's UTC render and the
              client's local timezone — React keeps the client's version. */}
          <p suppressHydrationWarning className="mt-1 text-sm text-zinc-500">
            {now.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}{" "}
            · Live campus overview
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/rooms"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:bg-primary-dark active:scale-[0.98]"
          >
            <DoorOpen className="h-4 w-4" />
            Book a Room
          </Link>
          <Link
            href="/lost-found?tab=found"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-all duration-200 hover:border-zinc-400 hover:bg-zinc-50 active:scale-[0.98]"
          >
            <PackageSearch className="h-4 w-4" />
            Report Found Item
          </Link>
          {!student?.is_librarian ? (
            <Link
              href="/lab-report"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-all duration-200 hover:border-zinc-400 hover:bg-zinc-50 active:scale-[0.98]"
            >
              <FileText className="h-4 w-4" />
              Lab Report Cover
            </Link>
          ) : null}
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-zinc-500">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
          <p className="text-sm font-medium">Loading campus data…</p>
        </div>
      ) : error ? (
        <div className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-dark"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          {/* Top stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Free rooms right now"
              value={FORMATTER.format(freeNow)}
              sub={`of ${rooms.length} rooms on campus`}
              badge="● Live"
              badgeTone="green"
              icon={DoorOpen}
              href="/rooms"
            />
            <StatCard
              label="Rooms on campus"
              value={FORMATTER.format(rooms.length)}
              sub={`${buildings.length} buildings`}
              badge="↗ Campus"
              badgeTone="neutral"
              icon={Users}
            />
            <StatCard
              label="My room bookings"
              value={loggedIn ? FORMATTER.format(bookingCount) : "—"}
              sub={loggedIn ? "active on your account" : "sign in to see bookings"}
              badge={loggedIn ? "Active" : "Sign in"}
              badgeTone={loggedIn ? "neutral" : "red"}
              icon={Bell}
              href={loggedIn ? "/rooms" : "/login"}
            />
            <StatCard
              label="Classes scheduled today"
              value={FORMATTER.format(totalClasses)}
              sub="across every room"
              badge="↗ Today"
              badgeTone="green"
              icon={BookOpen}
            />
          </div>

          {/* Main chart card */}
          <section className="rounded-2xl glass p-5 shadow-card ring-1 ring-white/60 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-lg font-bold text-ink">
                  Room Activity Today
                </h2>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {chartMetric === "classes"
                    ? "Classes starting each hour, all rooms"
                    : "Rooms free at each hour, all rooms"}
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1">
                {(
                  [
                    { value: "classes", label: "Classes" },
                    { value: "free", label: "Free rooms" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setChartMetric(option.value)}
                    aria-pressed={chartMetric === option.value}
                    className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all duration-200 ${
                      chartMetric === option.value
                        ? "bg-zinc-900 text-white shadow-soft"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bar chart */}
            <div className="relative mt-6">
              {/* Tooltip */}
              {hoveredHour !== null ? (
                <div
                  className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg bg-zinc-900 px-3 py-2 text-center text-white shadow-soft"
                  style={{
                    left: `${((hoveredHour - 8) / (HOURS.length - 1)) * 100}%`,
                    top: 0,
                  }}
                >
                  <p className="text-[11px] font-semibold text-zinc-300">
                    {String(hoveredHour).padStart(2, "0")}:00
                  </p>
                  <p className="text-sm font-bold">
                    {chartMetric === "classes" ? "Classes" : "Free rooms"}:{" "}
                    {chartData.find((d) => d.hour === hoveredHour)?.value ?? 0}
                  </p>
                </div>
              ) : null}

              <div className="flex h-52 items-end gap-1 sm:gap-1.5">
                {chartData.map((d) => {
                  const isCurrent =
                    chartMetric === "classes" && d.hour === currentHour;
                  const height = Math.max(3, (d.value / chartMax) * 100);
                  return (
                    <div
                      key={d.hour}
                      className="group relative flex h-full flex-1 flex-col justify-end"
                      onMouseEnter={() => setHoveredHour(d.hour)}
                      onMouseLeave={() => setHoveredHour(null)}
                    >
                      <div
                        className={`w-full rounded-t-sm transition-all duration-200 ${
                          isCurrent
                            ? "bg-[repeating-linear-gradient(45deg,#111111,#111111_3px,#444444_3px,#444444_6px)] ring-1 ring-zinc-900"
                            : d.value === 0
                              ? "bg-zinc-200"
                              : "bg-zinc-900 group-hover:bg-zinc-700"
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              {/* Hour labels */}
              <div className="mt-2 flex gap-1 sm:gap-1.5">
                {chartData.map((d) => (
                  <span
                    key={d.hour}
                    className={`flex-1 text-center text-[10px] font-medium ${
                      d.hour === currentHour ? "font-bold text-zinc-900" : "text-zinc-400"
                    }`}
                  >
                    {d.hour}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Bottom metric cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Rooms by building */}
            <section className="rounded-2xl glass p-5 shadow-card ring-1 ring-white/60">
              <p className="text-sm font-medium text-zinc-500">Rooms by building</p>
              <p className="mt-1 font-heading text-2xl font-bold text-ink">
                {FORMATTER.format(rooms.length)}
              </p>
              <p className="text-xs text-zinc-400">
                {buildings.length} buildings · {FORMATTER.format(freeNow)} free now
              </p>
              <MiniBars
                data={buildings.map((b) => ({ label: b.name, value: b.total }))}
              />
            </section>

            {/* Found items by category */}
            <section className="rounded-2xl glass p-5 shadow-card ring-1 ring-white/60">
              <p className="text-sm font-medium text-zinc-500">Found items</p>
              <p className="mt-1 font-heading text-2xl font-bold text-ink">
                {loggedIn ? FORMATTER.format(foundItems.length) : "—"}
              </p>
              <p className="text-xs text-zinc-400">
                {loggedIn ? "reported on Lost & Found" : "sign in to browse reports"}
              </p>
              {loggedIn ? (
                <MiniBars data={foundByCategory} color="bg-zinc-700" />
              ) : (
                <Link
                  href="/login"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-zinc-900 hover:underline"
                >
                  Sign in <ArrowUpRight className="h-4 w-4" />
                </Link>
              )}
            </section>

            {/* Classes by building */}
            <section className="rounded-2xl glass p-5 shadow-card ring-1 ring-white/60">
              <p className="text-sm font-medium text-zinc-500">Classes by building</p>
              <p className="mt-1 font-heading text-2xl font-bold text-ink">
                {FORMATTER.format(totalClasses)}
              </p>
              <p className="text-xs text-zinc-400">scheduled today</p>
              <MiniBars
                data={buildings.map((b) => ({ label: b.name, value: b.classes }))}
              />
            </section>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: "Bus Tracker", href: "/bus", icon: Bus },
              { label: "Notices", href: "/notices", icon: Bell },
            ].map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 transition-colors duration-200 hover:border-zinc-300 hover:text-zinc-900"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}
