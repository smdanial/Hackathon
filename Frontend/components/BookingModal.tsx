"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  CalendarCheck,
  CalendarX2,
  Check,
  Clock,
  DoorOpen,
  Loader2,
  X,
} from "lucide-react";
import type { Room } from "@/lib/mockRooms";
import { getRoomLabel } from "@/lib/mockRooms";
import { formatTime, toISODate } from "@/lib/getRoomStatus";
import { apiRequest, ApiError, firstErrorMessage } from "@/lib/api";
import { authHeaders } from "@/lib/auth";

/** Booking shape as served by the Django API. */
interface ApiBooking {
  id: number;
  room: number;
  date: string;
  class_type: "regular" | "reschedule";
  department: string;
  class_name: string;
  start_time: string;
  end_time: string;
  booked_at: string;
}

/** A room's active booking, as returned inside the public room detail. */
interface ApiRoomBooking {
  id: number;
  date: string;
  class_type: "regular" | "reschedule";
  department: string;
  class_name: string;
  start_time: string;
  end_time: string;
  student_name: string;
}

const CLASS_TYPES: { value: ApiBooking["class_type"]; label: string }[] = [
  { value: "regular", label: "Regular class" },
  { value: "reschedule", label: "Reschedule class" },
];

const DEPARTMENTS = ["CSE", "EEE", "TE", "IPE", "FDAE"];

/** "2026-08-12" → "Wed, Aug 12". */
function formatBookingDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

interface BookingModalProps {
  /** The room being booked. */
  room: Room;
  onClose: () => void;
  /** Called after a successful book/cancel so the room grid can refresh. */
  onChanged?: () => void;
}

/**
 * Small booking popup for one room: pick a class type, department, class name
 * and a start→end time window. While a slot is booked, everyone sees the room
 * as occupied (the backend adds it to the schedule) and nobody else can book
 * an overlapping slot; once the end time passes, the booking is released
 * automatically. Requires login.
 */
export default function BookingModal({ room, onClose, onChanged }: BookingModalProps) {
  const roomId = Number(room.id);

  // Optimistic: only the no-token / 401 paths turn this off. The first paint
  // is the spinner either way, so the initial value never flashes wrong UI.
  const [loggedIn, setLoggedIn] = useState(true);
  // Only CRs may book rooms — read from the authoritative /auth/me/ response.
  const [isCr, setIsCr] = useState(false);
  const [checking, setChecking] = useState(true);
  const [myBookings, setMyBookings] = useState<ApiBooking[]>([]);
  const [roomBookings, setRoomBookings] = useState<ApiRoomBooking[]>([]);

  const [classType, setClassType] = useState<ApiBooking["class_type"]>("regular");
  const [department, setDepartment] = useState("CSE");
  const [className, setClassName] = useState("");
  const [bookingDate, setBookingDate] = useState(() => toISODate(new Date()));
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const myBooking = myBookings.find((b) => b.room === roomId) ?? null;
  // Bookings on this room by other students (mine is shown separately).
  const othersBookings = roomBookings.filter((b) => b.id !== myBooking?.id);
  // Earliest pickable date — the past is rejected by the API anyway.
  const today = toISODate(new Date());

  // Check the session, load this student's bookings and the room's active
  // bookings. The initial render is the spinner on both server and client;
  // state only changes in async callbacks (avoids hydration mismatches and
  // sync setState-in-effect).
  useEffect(() => {
    if (!authHeaders().Authorization) {
      const timer = window.setTimeout(() => {
        setLoggedIn(false);
        setChecking(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    let cancelled = false;
    apiRequest<ApiBooking[]>("/rooms/bookings/", { headers: authHeaders() })
      .then((data) => {
        if (!cancelled) setMyBookings(data);
      })
      .catch((err: unknown) => {
        if (!cancelled && err instanceof ApiError && err.status === 401) {
          setLoggedIn(false);
        }
      });
    // Authoritative role check — the stored session may be stale.
    apiRequest<{ is_cr: boolean }>("/auth/me/", { headers: authHeaders() })
      .then((me) => {
        if (!cancelled) setIsCr(Boolean(me.is_cr));
      })
      .catch(() => {
        // Non-fatal: the backend still enforces the CR rule on POST.
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    // The room's active bookings (public) — shows who else has this room.
    apiRequest<{ bookings: ApiRoomBooking[] }>(`/rooms/${roomId}/`)
      .then((data) => {
        if (!cancelled) setRoomBookings(data.bookings);
      })
      .catch(() => {
        // Non-fatal: the grid and the backend still enforce the slot.
      });
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const handleBook = async () => {
    if (!className.trim()) {
      setError("Please enter the class name (e.g. CSE-305).");
      return;
    }
    if (!startTime || !endTime) {
      setError("Please choose a start and end time for the class.");
      return;
    }
    // Parse the chosen date + times in the browser's local timezone so the
    // future check matches what the student sees on the clock.
    const startDt = new Date(`${bookingDate}T${startTime}:00`);
    const endDt = new Date(`${bookingDate}T${endTime}:00`);
    if (startDt >= endDt) {
      setError("End time must be after the start time.");
      return;
    }
    if (endDt <= new Date()) {
      setError("End time must be in the future.");
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const created = await apiRequest<ApiBooking>("/rooms/bookings/", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          room: roomId,
          date: bookingDate,
          class_type: classType,
          department,
          class_name: className.trim(),
          start_time: startTime,
          end_time: endTime,
        }),
      });
      setMyBookings((prev) => [...prev.filter((b) => b.room !== roomId), created]);
      setNotice("Room booked! Your booking is listed below.");
      onChanged?.();
    } catch (err) {
      setError(
        err instanceof ApiError ? firstErrorMessage(err.body) : "Booking failed."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!myBooking) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest<void>(`/rooms/bookings/${myBooking.id}/`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setMyBookings((prev) => prev.filter((b) => b.id !== myBooking.id));
      setRoomBookings((prev) => prev.filter((b) => b.id !== myBooking.id));
      setNotice("Booking cancelled.");
      onChanged?.();
    } catch (err) {
      setError(
        err instanceof ApiError ? firstErrorMessage(err.body) : "Could not cancel booking."
      );
    } finally {
      setBusy(false);
    }
  };

  // Rendered through a portal to <body> so the backdrop covers the whole
  // viewport — including the app shell's navbar — instead of being contained
  // by the page's stacking context.
  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Book ${getRoomLabel(room.roomNumber)}`}
    >
      {/* Backdrop — clicking it closes the popup */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl glass-strong shadow-lift ring-1 ring-white/60">
        <div className="flex items-center justify-between gap-3 border-b border-white/50 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-dark">
              <CalendarCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate font-heading text-lg font-bold leading-tight text-ink">
                Book this room
              </h3>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs font-medium text-slate-600">
                <DoorOpen className="h-3.5 w-3.5 shrink-0" />
                {getRoomLabel(room.roomNumber)} — {room.building}
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

        <div className="flex flex-col gap-4 p-5">
          {checking ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm font-medium text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-primary-dark" />
              Checking your bookings…
            </div>
          ) : !loggedIn ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <p className="text-sm font-medium text-slate-600">
                Please log in to book a room.
              </p>
              <Link
                href="/login"
                onClick={onClose}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:bg-primary-dark hover:text-white"
              >
                Go to login
              </Link>
            </div>
          ) : !isCr ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning-light text-warning">
                <DoorOpen className="h-6 w-6" />
              </span>
              <p className="text-sm font-medium text-slate-700">
                Only Class Representatives (CR) can book rooms.
              </p>
              <p className="text-xs leading-relaxed text-slate-500">
                If you are your class&apos;s CR, ask an admin to verify you
                from the admin panel — then check your status on the profile
                page.
              </p>
              <Link
                href="/profile"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50"
              >
                Check my role
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Other people's bookings on this room */}
              {othersBookings.length > 0 ? (
                <div className="rounded-xl border border-warning/40 bg-warning-light/60 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                    This room is booked
                  </p>
                  {othersBookings.map((b) => (
                    <p key={b.id} className="mt-1 text-sm font-medium text-amber-900">
                      {b.date !== today ? `${formatBookingDate(b.date)} · ` : ""}
                      {formatTime(b.start_time)} – {formatTime(b.end_time)} ·{" "}
                      {b.class_name} · {b.student_name}
                    </p>
                  ))}
                  <p className="mt-1 text-xs text-amber-800/80">
                    Overlapping slots can&apos;t be booked until the class ends.
                  </p>
                </div>
              ) : null}

              {myBooking ? (
                <div className="flex flex-col gap-3">
                  <p className="flex items-center gap-2 rounded-xl bg-success-light px-4 py-3 text-sm font-semibold text-emerald-800">
                    <Check className="h-4 w-4 shrink-0" />
                    You&apos;ve booked this room.
                  </p>
                  <div className="rounded-xl border border-slate-200 bg-white/60 px-4 py-3 text-sm backdrop-blur-sm">
                    <p className="font-heading font-semibold text-ink">
                      {myBooking.class_name}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-600">
                      {CLASS_TYPES.find((t) => t.value === myBooking.class_type)?.label} ·{" "}
                      {myBooking.department} department
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Clock className="h-3.5 w-3.5 text-primary-dark" />
                      {formatBookingDate(myBooking.date)} ·{" "}
                      {formatTime(myBooking.start_time)} –{" "}
                      {formatTime(myBooking.end_time)}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-slate-500">
                      Booked{" "}
                      {new Date(myBooking.booked_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelBooking}
                    disabled={busy}
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-error/40 bg-white px-4 py-2.5 text-sm font-semibold text-error transition-all duration-200 hover:border-error hover:bg-error hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CalendarX2 className="h-4 w-4" />
                    )}
                    Cancel booking
                  </button>
                </div>
              ) : (
                <form
                  className="flex flex-col gap-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleBook();
                  }}
                >
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="booking-class-type"
                      className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                    >
                      Class type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {CLASS_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setClassType(type.value)}
                          aria-pressed={classType === type.value}
                          className={`rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                            classType === type.value
                              ? "border-primary bg-primary-light text-primary-dark"
                              : "border-slate-200 bg-white/60 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="booking-department"
                      className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                    >
                      Department
                    </label>
                    <select
                      id="booking-department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {DEPARTMENTS.map((dep) => (
                        <option key={dep} value={dep}>
                          {dep}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="booking-class-name"
                      className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                    >
                      What class will it be?
                    </label>
                    <input
                      id="booking-class-name"
                      type="text"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      placeholder="e.g. CSE-305, Makeup Lecture"
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-ink placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="booking-date"
                      className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                    >
                      Class date
                    </label>
                    <input
                      id="booking-date"
                      type="date"
                      value={bookingDate}
                      min={today}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="booking-start-time"
                        className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                      >
                        Starts at
                      </label>
                      <input
                        id="booking-start-time"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="booking-end-time"
                        className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                      >
                        Ends at
                      </label>
                      <input
                        id="booking-end-time"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                    </div>
                  </div>

                  {error ? (
                    <p
                      role="alert"
                      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
                    >
                      {error}
                    </p>
                  ) : null}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={busy}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:bg-primary-dark hover:text-white hover:shadow-lift active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CalendarCheck className="h-4 w-4" />
                      )}
                      Book
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={busy}
                      className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {notice ? (
                <p
                  role="status"
                  className="rounded-xl bg-success-light px-4 py-3 text-sm font-semibold text-emerald-800"
                >
                  {notice}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
