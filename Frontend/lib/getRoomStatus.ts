// Status derivation for the Room Finder feature.
//
// A room's status is ALWAYS derived from its schedule + the current time — it
// is never stored in the mock data. Re-running these functions against a fresh
// Date() is all it takes for the UI to stay correct as time passes.

import type { Room, ScheduleEntry } from "./mockRooms";

export type RoomStatus =
  | {
      status: "free";
      /** The next booking after now — absent means free all day. */
      nextSlot?: ScheduleEntry;
    }
  | {
      status: "occupied";
      /** The booking running right now. */
      activeSlot: ScheduleEntry;
    };

/** One row of a room's full-day view: either a class slot or a free gap. */
export interface DaySlot {
  startTime: string;
  endTime: string;
  /** Present when a class occupies this slot; absent means it's a free gap. */
  entry?: ScheduleEntry;
  /** True when the current time falls inside this slot. */
  isActive: boolean;
}

/** "09:00" → 540 (minutes since midnight). */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/** "09:00" → "9:00 AM", "14:00" → "2:00 PM". */
export function formatTime(time: string): string {
  const minutes = timeToMinutes(time);
  const period = minutes >= 12 * 60 ? "PM" : "AM";
  const hour12 = Math.floor(minutes / 60) % 12 || 12;
  const minute = String(minutes % 60).padStart(2, "0");
  return `${hour12}:${minute} ${period}`;
}

/** Minutes since midnight for a Date — used to compare against slot times. */
function toDayMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** Sorts a room's schedule into chronological order (copy, never mutates). */
function sortSchedule(room: Room): ScheduleEntry[] {
  return [...room.schedule].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );
}

/**
 * Derives a room's status at a given moment:
 * - occupied → the schedule entry running right now (with its end time);
 * - free → the next booking today, if any (absent = free all day).
 */
export function getRoomStatus(room: Room, now: Date = new Date()): RoomStatus {
  const nowMinutes = toDayMinutes(now);
  const sorted = sortSchedule(room);

  const activeSlot = sorted.find(
    (slot) =>
      nowMinutes >= timeToMinutes(slot.startTime) &&
      nowMinutes < timeToMinutes(slot.endTime)
  );
  if (activeSlot) {
    return { status: "occupied", activeSlot };
  }

  const nextSlot = sorted.find((slot) => timeToMinutes(slot.startTime) > nowMinutes);
  return { status: "free", nextSlot };
}

/**
 * Builds the full-day timetable for a room's detail modal: the schedule's
 * bookings in chronological order with the free gaps between them filled in,
 * within the given day window (defaults to 8:00 AM – 6:00 PM). Each slot is
 * flagged when it contains the current time.
 */
export function buildDayTimeline(
  room: Room,
  now: Date = new Date(),
  dayStart: string = "08:00",
  dayEnd: string = "18:00"
): DaySlot[] {
  const nowMinutes = toDayMinutes(now);
  const startMinutes = timeToMinutes(dayStart);
  const endMinutes = timeToMinutes(dayEnd);
  const slots: DaySlot[] = [];

  let cursor = startMinutes;
  for (const entry of sortSchedule(room)) {
    const slotStart = timeToMinutes(entry.startTime);
    const slotEnd = timeToMinutes(entry.endTime);
    // Skip bookings that fall entirely outside the visible day window.
    if (slotEnd <= startMinutes || slotStart >= endMinutes) continue;

    // Free gap between the previous booking and this one.
    if (slotStart > cursor) {
      slots.push({
        startTime: formatTimeMinutes(cursor),
        endTime: formatTimeMinutes(slotStart),
        isActive: cursor <= nowMinutes && nowMinutes < slotStart,
      });
    }

    slots.push({
      startTime: entry.startTime,
      endTime: entry.endTime,
      entry,
      isActive: slotStart <= nowMinutes && nowMinutes < slotEnd,
    });
    cursor = Math.max(cursor, slotEnd);
  }

  // Trailing free gap at the end of the day.
  if (cursor < endMinutes) {
    slots.push({
      startTime: formatTimeMinutes(cursor),
      endTime: dayEnd,
      isActive: cursor <= nowMinutes && nowMinutes < endMinutes,
    });
  }

  return slots;
}

/** "9:00" minutes → "09:00" (HH:MM) so formatters can share one input shape. */
function formatTimeMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
