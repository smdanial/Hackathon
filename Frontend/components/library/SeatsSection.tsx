import { Armchair, BookOpen, DoorOpen } from "lucide-react";
import { SEATS, TABLE_GROUPS } from "./dummyData";
import type { Seat } from "./dummyData";

/* ------------------------------------------------------------------ *
 *  Schematic floor plan — not architectural, just a readable map.    *
 *  Green/red tiles are real seats; muted blue-gray blocks are        *
 *  shelving, the entrance and the tables themselves.                 *
 * ------------------------------------------------------------------ */

/** Summary + legend bar: count is derived from the data, never hardcoded. */
function SeatsSummary() {
  const available = SEATS.filter((s) => s.status === "available").length;
  const total = SEATS.length;
  const desks = SEATS.filter((s) => s.zone === "desks").length;
  const tables = SEATS.filter((s) => s.zone === "tables").length;

  return (
    <div className="flex flex-col gap-4 rounded-3xl glass p-5 shadow-soft ring-1 ring-white/60 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-ink">
          Seat availability
        </h2>
        <p className="mt-1 text-sm font-medium text-slate-700">
          <span className="font-bold text-emerald-600">{available}</span> of{" "}
          {total} seats available right now
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-700">
        <span className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm">
            <Armchair className="h-3 w-3" />
          </span>
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-rose-500 text-white shadow-sm">
            <Armchair className="h-3 w-3" />
          </span>
          Taken
        </span>
        <span className="text-slate-400">
          {desks} study desks · {tables} table seats
        </span>
      </div>
    </div>
  );
}

/** One seat tile — green/red rounded square with a white chair icon. */
function SeatTile({ seat }: { seat: Seat }) {
  const available = seat.status === "available";

  return (
    <div
      title={`Seat ${seat.id} — ${available ? "Available" : "Taken"}`}
      aria-label={`Seat ${seat.id}, ${available ? "available" : "taken"}`}
      className={`flex h-7 w-7 items-center justify-center rounded-[10px] text-white shadow-sm ring-1 ring-white/40 transition-transform duration-200 hover:-translate-y-0.5 hover:scale-110 sm:h-8 sm:w-8 ${
        available
          ? "bg-emerald-500 hover:bg-emerald-400"
          : "bg-rose-500 hover:bg-rose-400"
      }`}
    >
      <Armchair className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
    </div>
  );
}

/** Small uppercase zone heading used above each area of the room. */
function ZoneLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] text-slate-500 uppercase">
      <span className="h-3 w-1 rounded-full bg-sky-300" aria-hidden="true" />
      {children}
    </h3>
  );
}

/**
 * Decorative bookshelf block along a room edge. Light blue-gray with a book
 * icon and stacked rows — purely visual context, non-interactive.
 */
function Shelf() {
  return (
    <div
      aria-hidden="true"
      className="flex w-7 shrink-0 flex-col items-center gap-2 rounded-xl bg-sky-100/90 px-1.5 py-4 ring-1 ring-sky-200/80 sm:w-9 sm:gap-2.5 sm:py-5"
    >
      <BookOpen className="h-4 w-4 text-sky-500 sm:h-5 sm:w-5" />
      <span className="mt-1 h-px w-full rounded-full bg-sky-300/80" />
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className="h-1 w-full rounded-full bg-sky-200 sm:h-1.5"
        />
      ))}
    </div>
  );
}

/** One round table with seats arranged around it in a circle. */
function RoundTable({ group }: { group: number }) {
  const seats = SEATS.filter((s) => s.zone === "tables" && s.group === group);
  const count = seats.length;

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="relative h-28 w-28 sm:h-32 sm:w-32">
        {/* The table itself — light blue-gray circle */}
        <div
          aria-hidden="true"
          className="absolute inset-0 m-auto h-14 w-14 rounded-full bg-sky-200 shadow-sm ring-2 ring-sky-300/60 sm:h-16 sm:w-16"
        />
        {seats.map((seat, i) => (
          <div
            key={seat.id}
            className="absolute inset-0"
            style={{ transform: `rotate(${(360 / count) * i}deg)` }}
          >
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
              <SeatTile seat={seat} />
            </div>
          </div>
        ))}
      </div>
      <span className="text-[10px] font-bold tracking-[0.18em] text-slate-500 uppercase">
        Table {group}
      </span>
    </div>
  );
}

/** Entrance / service desk strip at the bottom of the room. */
function Entrance() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-5 py-2 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur-sm">
      <DoorOpen className="h-4 w-4 text-sky-500" />
      Entrance · Service desk
    </div>
  );
}

/**
 * Floor-plan-style seat map matching the reference design:
 *  - Top: individual study desks (5 rows x 6 seats)
 *  - Middle: 2 round table groups (5 seats each)
 *  - Edges: decorative light-blue shelving
 *  - Bottom: entrance / service desk
 */
export default function SeatsSection() {
  const deskSeats = SEATS.filter((s) => s.zone === "desks");

  return (
    <section id="seat-availability" className="scroll-mt-20 flex flex-col gap-6">
      <SeatsSummary />

      {/* Room floor */}
      <div className="rounded-3xl glass p-4 shadow-soft ring-1 ring-white/60 sm:p-6">
        <div className="rounded-2xl bg-white/80 p-4 shadow-inner ring-1 ring-slate-200/80 backdrop-blur-md sm:p-6">
          <div className="flex gap-3 sm:gap-4">
            {/* Left shelving */}
            <Shelf />

            {/* Central zones */}
            <div className="min-w-0 flex-1">
              {/* TOP ZONE — individual study desks */}
              <ZoneLabel>Study desks</ZoneLabel>
              <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
                {deskSeats.map((seat) => (
                  <SeatTile key={seat.id} seat={seat} />
                ))}
              </div>

              {/* MIDDLE ZONE — round table seating */}
              <div className="mt-8">
                <ZoneLabel>Round tables</ZoneLabel>
                <div className="flex items-center justify-center gap-8 sm:gap-12">
                  {Array.from({ length: TABLE_GROUPS }, (_, i) => (
                    <RoundTable key={i + 1} group={i + 1} />
                  ))}
                </div>
              </div>

              {/* BOTTOM ZONE — entrance / service desk */}
              <div className="mt-8 flex justify-center">
                <Entrance />
              </div>
            </div>

            {/* Right shelving */}
            <Shelf />
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-600">
          Schematic floor plan — blue-gray blocks are shelving, tables and the
          service desk, not seats. Hover a seat for its status.
        </p>
      </div>
    </section>
  );
}
