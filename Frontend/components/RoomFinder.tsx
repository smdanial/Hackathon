"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  ChevronDown,
  DoorOpen,
  Layers,
  Radio,
  RefreshCw,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import RoomModal from "@/components/RoomModal";
import { ROOMS, getRoomLabel } from "@/lib/mockRooms";
import type { Room } from "@/lib/mockRooms";
import { formatTime, getRoomStatus } from "@/lib/getRoomStatus";
import type { RoomStatus } from "@/lib/getRoomStatus";

/** How often room statuses are re-derived (ms). */
const STATUS_REFRESH_INTERVAL_MS = 30_000;

const ALL = "all";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  icon: LucideIcon;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
}

/** Pill-style dropdown used for the Building / Floor filters. */
function FilterSelect({ icon: Icon, label, value, onChange, options }: FilterSelectProps) {
  return (
    <label className="relative flex items-center">
      <span className="sr-only">{label}</span>
      <Icon className="pointer-events-none absolute left-4 h-4 w-4 shrink-0 text-primary-dark" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-full bg-card py-2.5 pl-10 pr-10 text-sm font-semibold text-ink shadow-card transition-all duration-200 hover:shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 h-4 w-4 shrink-0 text-slate-500" />
    </label>
  );
}

interface RoomCardProps {
  room: Room;
  status: RoomStatus;
  onSelect: () => void;
}

/** One room in the grid — status-colored accent with a tappable detail modal. */
function RoomCard({ room, status, onSelect }: RoomCardProps) {
  const free = status.status === "free";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex flex-col gap-4 rounded-2xl bg-card p-5 text-left shadow-card ring-1 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        free ? "ring-success/40" : "ring-warning/50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/70 text-primary-dark shadow-card transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110">
          <DoorOpen className="h-6 w-6" />
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
            free ? "bg-success-light text-emerald-800" : "bg-warning-light text-amber-800"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 animate-pulse rounded-full ${
              free ? "bg-success" : "bg-warning"
            }`}
          />
          {free ? "Free" : "Occupied"}
        </span>
      </div>

      <div>
        <h3 className="font-heading text-xl font-bold text-ink">
          {getRoomLabel(room.roomNumber)}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
          <Building2 className="h-4 w-4 shrink-0 text-primary-dark" />
          {room.building}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <Layers className="h-3.5 w-3.5 shrink-0 text-primary-dark" />
          Floor {room.floor}
          <span className="text-slate-400">·</span>
          <Users className="h-3.5 w-3.5 shrink-0 text-primary-dark" />
          Capacity {room.capacity}
        </p>
      </div>

      <div
        className={`rounded-xl px-4 py-3 text-sm ${
          free ? "bg-success-light/60 text-emerald-800" : "bg-warning-light/60 text-amber-800"
        }`}
      >
        {free ? (
          <>
            <span className="font-semibold">Free</span>{" "}
            {status.nextSlot ? (
              <>
                until <span className="font-semibold">{formatTime(status.nextSlot.startTime)}</span>
              </>
            ) : (
              <>all day</>
            )}
          </>
        ) : (
          <>
            <span className="font-semibold">{status.activeSlot.className}</span> ·{" "}
            {status.activeSlot.teacherName} until{" "}
            <span className="font-semibold">{formatTime(status.activeSlot.endTime)}</span>
          </>
        )}
      </div>
    </button>
  );
}

/**
 * Room Finder page: building/floor filters, a live room grid, and per-room
 * detail modals. Statuses are re-derived from the current time every
 * STATUS_REFRESH_INTERVAL_MS — no fetch, just a fresh Date().
 */
export default function RoomFinder() {
  const [now, setNow] = useState(() => new Date());
  const [building, setBuilding] = useState(ALL);
  const [floor, setFloor] = useState(ALL);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Re-derive statuses on a timer so the grid updates itself over time.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), STATUS_REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const buildings = useMemo(
    () => [...new Set(ROOMS.map((room) => room.building))].sort(),
    []
  );
  // Floors follow the selected building; with "All buildings" they span campus.
  const floors = useMemo(() => {
    const candidates =
      building === ALL ? ROOMS : ROOMS.filter((room) => room.building === building);
    return [...new Set(candidates.map((room) => room.floor))].sort((a, b) => a - b);
  }, [building]);

  const visibleRooms = useMemo(
    () =>
      ROOMS.filter(
        (room) =>
          (building === ALL || room.building === building) &&
          (floor === ALL || room.floor === Number(floor))
      ),
    [building, floor]
  );

  // Switching building may make the chosen floor invalid — reset to "All floors".
  const handleBuildingChange = (value: string) => {
    setBuilding(value);
    setFloor(ALL);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary-dark shadow-card">
            <DoorOpen className="h-7 w-7" />
          </span>
          <div>
            <h1 className="font-heading text-3xl font-bold text-ink sm:text-4xl">
              Room Finder
            </h1>
            <p className="mt-1 text-sm text-slate-700 sm:text-base">
              See which classrooms and labs are free right now.
            </p>
          </div>
        </div>

        <p className="flex items-center gap-2 text-sm text-slate-600">
          <Radio className="h-4 w-4 shrink-0 text-primary-dark" />
          Statuses refresh automatically every 30 seconds — no page reload needed.
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <FilterSelect
          icon={Building2}
          label="Filter by building"
          value={building}
          onChange={handleBuildingChange}
          options={[
            { value: ALL, label: "All buildings" },
            ...buildings.map((name) => ({ value: name, label: name })),
          ]}
        />
        <FilterSelect
          icon={Layers}
          label="Filter by floor"
          value={floor}
          onChange={setFloor}
          options={[
            { value: ALL, label: "All floors" },
            ...floors.map((number) => ({
              value: String(number),
              label: `Floor ${number}`,
            })),
          ]}
        />
        <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-xs font-semibold text-slate-600 shadow-card">
          <RefreshCw className="h-3.5 w-3.5 text-primary-dark" />
          As of{" "}
          {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </span>
      </div>

      {/* Room grid — same breakpoints as the home feature cards */}
      {visibleRooms.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-card px-6 py-16 text-center shadow-card">
          <DoorOpen className="h-10 w-10 text-primary-dark" />
          <p className="text-sm font-medium text-slate-600">
            No rooms match these filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setBuilding(ALL);
              setFloor(ALL);
            }}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-ink shadow-soft transition-all duration-200 hover:bg-primary-dark hover:text-white active:scale-95"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              status={getRoomStatus(room, now)}
              onSelect={() => setSelectedRoom(room)}
            />
          ))}
        </div>
      )}

      {/* Room detail modal */}
      {selectedRoom ? (
        <RoomModal
          room={selectedRoom}
          now={now}
          onClose={() => setSelectedRoom(null)}
        />
      ) : null}
    </div>
  );
}
