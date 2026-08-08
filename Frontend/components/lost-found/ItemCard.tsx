"use client";

import { useState } from "react";
import { CalendarDays, MapPin, PackageSearch, Phone, User } from "lucide-react";
import type { FoundItem } from "./dummyData";

interface ItemCardProps {
  item: FoundItem;
}

/**
 * Single found-item card. Frontend-only: "Get Contact Info" is a purely
 * visual toggle that reveals the finder's phone number (no backend call).
 */
export default function ItemCard({ item }: ItemCardProps) {
  const [showContact, setShowContact] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const hasImage = Boolean(item.imageUrl) && !imageFailed;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift">
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

        {/* Contact toggle */}
        <div className="mt-auto pt-1.5">
          <button
            type="button"
            onClick={() => setShowContact((open) => !open)}
            aria-expanded={showContact}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
              showContact
                ? "cursor-default bg-success-light text-success"
                : "bg-primary text-ink shadow-soft hover:bg-primary-dark hover:text-white hover:shadow-lift"
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
