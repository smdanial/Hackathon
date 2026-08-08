"use client";

import { useState } from "react";
import { PackageSearch, Search, SearchX } from "lucide-react";
import { CATEGORIES, type FoundItem, type ItemCategory } from "./dummyData";
import ItemCard from "./ItemCard";

type CategoryFilter = "All" | ItemCategory;

const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: "All", label: "All" },
  ...CATEGORIES.map((category) => ({ value: category as CategoryFilter, label: category })),
];

interface LostItemsSectionProps {
  /** Shared found-items list — seeded dummy data + anything posted from the Found tab. */
  items: FoundItem[];
}

/**
 * Lost tab: browse items that other students found. Live search by item
 * name combines with the category filter pills (both apply together).
 */
export default function LostItemsSection({ items }: LostItemsSectionProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");

  const normalized = query.trim().toLowerCase();

  const filtered = items.filter((item) => {
    const matchesQuery = !normalized || item.itemName.toLowerCase().includes(normalized);
    const matchesCategory = category === "All" || item.category === category;
    return matchesQuery && matchesCategory;
  });

  const filterPill = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
      active
        ? "bg-primary text-ink shadow-soft"
        : "bg-white text-slate-600 shadow-sm hover:bg-slate-100 hover:text-ink"
    }`;

  return (
    <section id="lost-items" className="flex scroll-mt-20 flex-col gap-6">
      {/* Search + filters bar */}
      <div className="flex flex-col gap-4 rounded-3xl bg-card p-5 shadow-soft sm:p-6">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by item name…"
            aria-label="Search found items by name"
            className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-ink shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {CATEGORY_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              aria-pressed={category === value}
              className={filterPill(category === value)}
            >
              {label}
            </button>
          ))}
          <p className="ml-auto text-xs font-medium text-slate-600">
            Showing {filtered.length} of {items.length} item{items.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* Item grid / empty state */}
      {filtered.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl bg-card px-6 py-16 text-center shadow-soft">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-light text-primary-dark shadow-card">
            <SearchX className="h-8 w-8" />
          </span>
          <h3 className="font-heading text-xl font-semibold text-ink">
            {items.length === 0 ? "No items reported yet" : "No items found"}
          </h3>
          <p className="max-w-sm text-sm text-slate-700">
            {items.length === 0
              ? "Nothing has been reported yet. Head to the Found tab to post the first item!"
              : "Nothing matches your search. Try a different name or category."}
          </p>
        </div>
      )}

      {/* Hint banner */}
      <div className="flex items-center gap-3 rounded-3xl bg-card/70 p-4 shadow-card sm:p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-dark shadow-card">
          <PackageSearch className="h-5 w-5" />
        </span>
        <p className="text-sm text-slate-700">
          Found something on campus? Report it on the{" "}
          <span className="font-semibold text-ink">Found</span> tab and it will show up
          here right away.
        </p>
      </div>
    </section>
  );
}
