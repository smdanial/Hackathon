"use client";

import { useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Loader2,
  MapPin,
  PackageSearch,
  Phone,
  User,
} from "lucide-react";
import type { FoundItem } from "./dummyData";

interface ItemCardProps {
  item: FoundItem;
  /** Signed-in student's id — only they see the "Mark as Received" button. */
  currentStudentId: number | null;
  /** Marks a post as received (owner-only; throws on failure). */
  onMarkReceived: (id: number) => Promise<void>;
}

/**
 * Single found-item card. "Get Contact Info" is a purely visual toggle that
 * reveals the finder's phone number. The "Mark as Received" action is only
 * rendered for the student who posted the item, and turns into a received
 * badge once claimed — for everyone.
 */
export default function ItemCard({
  item,
  currentStudentId,
  onMarkReceived,
}: ItemCardProps) {
  const [showContact, setShowContact] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState<string | null>(null);

  const hasImage = Boolean(item.imageUrl) && !imageFailed;
  const isOwner = item.reportedById === currentStudentId;

  const handleMarkReceived = async () => {
    setMarking(true);
    setMarkError(null);
    try {
      await onMarkReceived(item.id);
    } catch {
      setMarkError("Couldn't update. Please try again.");
    } finally {
      setMarking(false);
    }
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl glass shadow-card ring-1 ring-white/60 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift">
      {/* Photo */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-primary-light">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={`${item.itemName} found by ${item.finderName}`}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 bg-linear-to-br from-primary to-primary-dark p-4 text-center">
            <PackageSearch className="h-10 w-10 text-white" />
            <span className="font-heading text-sm font-semibold leading-tight text-white">
              {item.itemName}
            </span>
          </div>
        )}

        {/* Category tag */}
        <span className="absolute left-2.5 top-2.5 inline-flex rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
          {item.category}
        </span>

        {/* Received tag — visible to everyone once the poster claims it */}
        {item.isReceived ? (
          <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
            <BadgeCheck className="h-3.5 w-3.5" />
            Received
          </span>
        ) : null}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <h3 className="font-heading text-base font-semibold leading-snug text-ink">
          {item.itemName}
        </h3>
        <p className="text-sm leading-relaxed text-slate-600">{item.description}</p>

        <div className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            {item.locationFound}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
            Posted {item.datePosted}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <User className="h-3.5 w-3.5 text-slate-400" />
          Found by {item.finderName}
        </div>

        {/* Owner-only action / received state */}
        {item.isReceived ? (
          <div className="mt-auto flex items-center justify-center gap-1.5 rounded-xl bg-success-light px-4 py-2.5 text-sm font-semibold text-emerald-800">
            <BadgeCheck className="h-4 w-4" />
            Received — already claimed
          </div>
        ) : isOwner ? (
          <div className="mt-auto flex flex-col gap-1.5">
            <button
              type="button"
              onClick={handleMarkReceived}
              disabled={marking}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-success/50 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-all duration-200 hover:border-success hover:bg-success hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {marking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BadgeCheck className="h-4 w-4" />
              )}
              {marking ? "Marking…" : "Mark as Received"}
            </button>
            {markError ? (
              <p role="alert" className="text-center text-xs font-medium text-rose-600">
                {markError}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Contact toggle */}
        <div className="mt-auto pt-1.5">
          <button
            type="button"
            onClick={() => setShowContact((open) => !open)}
            aria-expanded={showContact}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
              showContact
                ? "cursor-default bg-success-light text-success"
                : "bg-primary text-white shadow-soft hover:bg-primary-dark hover:text-white hover:shadow-lift"
            }`}
          >
            <Phone className="h-4 w-4" />
            {showContact ? item.finderPhone : "Get Contact Info"}
          </button>
        </div>
      </div>
    </article>
  );
}
