"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarCheck, DoorOpen, Layers, Users, X } from "lucide-react";
import type { Room } from "@/lib/mockRooms";
import { getClassLabel, getRoomLabel } from "@/lib/mockRooms";
import { buildDayTimeline, formatTime, getRoomStatus } from "@/lib/getRoomStatus";
import BookingModal from "@/components/BookingModal";

interface RoomModalProps {
  /** The room whose full-day schedule this modal shows. */
  room: Room;
  /** Current time — re-derives the active slot highlight while open. */
  now: Date;
  onClose: () => void;
  /** Called after a booking is created/cancelled so the grid can refresh. */
  onBookingChanged?: () => void;
}

/**
 * Room detail modal: the full day's timetable for one room, chronological,
 * with free gaps filled in and the currently-running slot highlighted. Follows
 * the same UX conventions as NoticeModal (Escape / backdrop close, body
 * scroll-lock, rounded-2xl soft-shadow card).
 */
export default function RoomModal({
  room,
  now,
  onClose,
  onBookingChanged,
}: RoomModalProps) {
  const timeline = buildDayTimeline(room, now);
  const status = getRoomStatus(room, now);
  const [bookingOpen, setBookingOpen] = useState(false);

  // Keep the latest onClose without re-adding the listeners on every render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Close on Escape and scroll-lock the page body while the modal is open.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, []);

  const free = status.status === "free";

  // Rendered through a portal to <body> so the backdrop covers the whole
  // viewport — including the app shell's navbar — instead of being contained
  // by the page's stacking context.
  return createPortal(
    <div
      className="fixed inset-0 z-[60] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`${getRoomLabel(room.roomNumber)} — ${room.building}`}
    >
      {/* Backdrop — clicking it closes the modal */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centers the card when it fits, scrolls when it is taller than the
          screen — the popup always stays fully visible and reachable. */}
      <div className="relative flex min-h-full items-center justify-center p-4">
      <div className="relative flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl glass-strong shadow-lift ring-1 ring-white/60">
        <div className="flex items-center justify-between gap-3 border-b border-white/50 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-dark">
              <DoorOpen className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate font-heading text-lg font-bold leading-tight text-ink">
                {getRoomLabel(room.roomNumber)} — {room.building}
              </h2>
              <p className="mt-0.5 flex items-center gap-2 text-xs font-medium text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" />
                  Floor {room.floor}
                </span>
                <span className="text-slate-400">·</span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  Capacity {room.capacity}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-600 transition-colors duration-200 hover:bg-white/70 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto p-4">
          {timeline.length === 0 ? (
            <p className="rounded-xl bg-white/60 px-4 py-8 text-center text-sm font-medium text-slate-600">
              No classes scheduled in this room today.
            </p>
          ) : (
            timeline.map((slot) => (
              <article
                key={`${slot.startTime}-${slot.endTime}`}
                className={`rounded-xl px-4 py-3 shadow-card transition-colors duration-200 ${
                  slot.isActive
                    ? "bg-primary/30 ring-2 ring-primary"
                    : slot.entry
                      ? "bg-white/70 backdrop-blur-sm hover:bg-white/90"
                      : "border border-dashed border-slate-300 bg-white/40 backdrop-blur-sm"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-heading text-sm font-semibold text-ink">
                    {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                  </h3>
                  {slot.isActive ? (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Now
                    </span>
                  ) : null}
                </div>
                {slot.entry ? (
                  <p className="mt-1 text-sm text-slate-700">
                    <span className="font-semibold text-ink">
                      {getClassLabel(slot.entry)}
                    </span>{" "}
                    · {slot.entry.teacherName}
                  </p>
                ) : (
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    Free
                  </p>
                )}
              </article>
            ))
          )}

          <p className="mt-1 flex items-center gap-2 px-1 text-xs font-medium text-slate-600">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                free ? "bg-success-light text-emerald-800" : "bg-warning-light text-amber-800"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 animate-pulse rounded-full ${
                  free ? "bg-success" : "bg-warning"
                }`}
              />
              {free
                ? status.nextSlot
                  ? `Free until ${formatTime(status.nextSlot.startTime)}`
                  : "Free all day"
                : `${getClassLabel(status.activeSlot)} until ${formatTime(status.activeSlot.endTime)}`}
            </span>
            Schedule updates automatically.
          </p>

          {/* Book this room */}
          <button
            type="button"
            onClick={() => setBookingOpen(true)}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:bg-primary-dark hover:text-white hover:shadow-lift active:scale-[0.98]"
          >
            <CalendarCheck className="h-4 w-4" />
            Book this room
          </button>
        </div>
      </div>

      </div>
      {/* Booking popup — layered above this modal */}
      {bookingOpen ? (
        <BookingModal
          room={room}
          onClose={() => setBookingOpen(false)}
          onChanged={onBookingChanged}
        />
      ) : null}
    </div>,
    document.body
  );
}
