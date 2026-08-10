"use client";

import { useState } from "react";
import { Armchair, BookMarked, BookOpen } from "lucide-react";
import BooksSection from "./BooksSection";
import SeatsSection from "./SeatsSection";

export type Tab = "books" | "seats";

interface LibraryExplorerProps {
  /** Tab to open on load, driven by the ?tab= query param (defaults to Books). */
  initialTab?: Tab;
}

/**
 * Library page shell: pill tab toggle (Books default) + section content.
 * The active tab stays in sync with the ?tab= query param so the navbar's
 * dropdown links (/library?tab=books, /library?tab=seats) land correctly.
 */
export default function LibraryExplorer({ initialTab = "books" }: LibraryExplorerProps) {
  const [tab, setTab] = useState<Tab>(initialTab);

  const selectTab = (next: Tab) => {
    setTab(next);
    // Keep the URL in sync so refreshes and navbar links stay consistent.
    window.history.replaceState(null, "", `?tab=${next}`);
  };

  const pill = (active: boolean) =>
    `flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
      active
        ? "bg-primary text-white shadow-soft"
        : "text-slate-600 hover:bg-white/70 hover:text-ink"
    }`;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary-dark shadow-card">
            <BookOpen className="h-7 w-7" />
          </span>
          <div>
            <h1 className="font-heading text-3xl font-bold text-ink sm:text-4xl">Library</h1>
            <p className="mt-1 text-sm text-slate-700 sm:text-base">
              Check book and seat availability in the library.
            </p>
          </div>
        </div>

        {/* Tab toggle */}
        <div
          role="tablist"
          aria-label="Library sections"
          className="flex w-fit items-center gap-1 rounded-full glass p-1.5 shadow-card"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "books"}
            onClick={() => selectTab("books")}
            className={pill(tab === "books")}
          >
            <BookMarked className="h-4 w-4" />
            Books
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "seats"}
            onClick={() => selectTab("seats")}
            className={pill(tab === "seats")}
          >
            <Armchair className="h-4 w-4" />
            Seats
          </button>
        </div>
      </header>

      {tab === "books" ? <BooksSection /> : <SeatsSection />}
    </div>
  );
}
