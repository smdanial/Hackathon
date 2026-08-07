import { Armchair, BookOpen, DoorOpen } from "lucide-react";
import { SEATS, TABLE_GROUPS } from "./dummyData";
import type { Seat } from "./dummyData";

/* ------------------------------------------------------------------ *
 *  Schematic floor plan — not architectural, just a readable map.    *
 *  Green/red tiles are real seats; muted gray blocks are shelving,   *
 *  the entrance and the tables themselves.                           *
 * ------------------------------------------------------------------ */

/** Summary + legend bar: count is derived from the data, never hardcoded. */
function SeatsSummary() {
  const available = SEATS.filter((s) => s.status === "available").length;
  const total = SEATS.length;

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-ink">Seat availability</h2>
        <p className="mt-1 text-sm font-medium text-slate-700">
          <span className="font-bold text-success">{available}</span> of {total} seats available
        </p>
      </div>
      <div className="flex items-center gap-5 text-xs font-semibold text-slate-700">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-md bg-success shadow-sm" aria-hidden="true" />
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-md bg-error shadow-sm" aria-hidden="true" />
          Taken
        </span>
      </div>
    </div>
  );
}

/** One seat tile — visual-only for now, subtle hover so it feels alive. */
function SeatTile({ seat }: { seat: Seat }) {
  const available = seat.status === "available";

  return (
    <div
      title={`Seat ${seat.id} — ${available ? "Available" : "Taken"}`}
      aria-label={`Seat ${seat.id}, ${available ? "available" : "taken"}`}
      className={`flex h-6 w-6 items-center justify-center rounded-lg text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:scale-110 hover:shadow-md sm:h-7 sm:w-7 ${
        available ? "bg-success" : "bg-error"
      }`}
    >
      <Armchair className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
    </div>
  );
}

/** Small uppercase zone heading used above each area of the room. */
function ZoneLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
      {children}
    </h3>
  );
}

/**
 * Decorative bookshelf block along a room edge. Muted gray, clearly not a
 * seat — purely visual context, non-interactive.
 */
function Shelf() {
  return (
    <div
      aria-hidden="true"
      className="flex w-5 shrink-0 flex-col items-center gap-1.5 rounded-lg bg-slate-300/60 px-1 py-3 ring-1 ring-slate-400/30 sm:w-7 sm:gap-2"
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className="h-0.5 w-full rounded-full bg-slate-400/70" />
      ))}
      <BookOpen className="mt-1 h-3 w-3 text-slate-500 sm:h-3.5 sm:w-3.5" />
    </div>
  );
}

/** One round table with seats arranged around it in a circle. */
function RoundTable({ group }: { group: number }) {
  const seats = SEATS.filter((s) => s.zone === "tables" && s.group === group);
  const count = seats.length;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24 sm:h-28 sm:w-28">
        {/* The table itself */}
        <div
          aria-hidden="true"
          className="absolute inset-0 m-auto h-12 w-12 rounded-full bg-slate-400/70 ring-2 ring-slate-500/40 sm:h-14 sm:w-14"
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
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        Table {group}
      </span>
    </div>
  );
}

/** Entrance / service desk strip at the bottom of the room. */
function Entrance() {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-slate-200/90 px-4 py-2 shadow-sm ring-1 ring-slate-300/70">
      <DoorOpen className="h-4 w-4 text-slate-600" />
      <span className="text-xs font-semibold text-slate-600">Entrance · Service desk</span>
    </div>
  );
}

/**
 * Floor-plan-style seat map:
 *  - Top: individual study desks (5 rows x 6 seats)
 *  - Middle: 2 round table groups (5 seats each)
 *  - Edges: decorative shelving
 *  - Bottom: entrance / service desk
 */
export default function SeatsSection() {
  const deskSeats = SEATS.filter((s) => s.zone === "desks");

  return (
    <section id="seat-availability" className="scroll-mt-20 flex flex-col gap-6">
      <SeatsSummary />

      {/* Room floor */}
      <div className="rounded-3xl bg-card p-4 shadow-soft sm:p-6">
        <div className="rounded-2xl bg-white/70 p-4 shadow-inner ring-1 ring-slate-200/70 sm:p-6">
          <div className="flex gap-3 sm:gap-4">
            {/* Left shelving */}
            <Shelf />

            {/* Central zones */}
            <div className="min-w-0 flex-1">
              {/* TOP ZONE — individual study desks */}
              <ZoneLabel>Study desks</ZoneLabel>
              <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                {deskSeats.map((seat) => (
                  <SeatTile key={seat.id} seat={seat} />
                ))}
              </div>

              {/* MIDDLE ZONE — round table seating */}
              <div className="mt-7">
                <ZoneLabel>Round tables</ZoneLabel>
                <div className="flex items-center justify-center gap-6 sm:gap-10">
                  {Array.from({ length: TABLE_GROUPS }, (_, i) => (
                    <RoundTable key={i + 1} group={i + 1} />
                  ))}
                </div>
              </div>

              {/* BOTTOM ZONE — entrance / service desk */}
              <div className="mt-7 flex justify-center">
                <Entrance />
              </div>
            </div>

            {/* Right shelving */}
            <Shelf />
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-600">
          Schematic floor plan — gray blocks are shelving, tables and the service desk, not
          seats.
        </p>
      </div>
    </section>
  );
}
