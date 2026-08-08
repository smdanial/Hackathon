"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PackagePlus, PackageSearch, Search } from "lucide-react";
import { SEED_ITEMS, type FoundItem, type NewFoundItem } from "./dummyData";
import FoundItemForm from "./FoundItemForm";
import LostItemsSection from "./LostItemsSection";

type Tab = "lost" | "found";

/**
 * Lost & Found page shell: pill tab toggle (Lost default) + section content.
 * The ?tab= query param is the single source of truth for the active tab,
 * so the navbar's dropdown links (/lost-found?tab=lost, ?tab=found) land
 * correctly and tab switches stay reflected in the URL.
 */
export default function LostFoundExplorer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Shared in-memory list: the 3 seed posts + anything reported via the
  // Found tab form. No persistence across reloads.
  const [items, setItems] = useState<FoundItem[]>(SEED_ITEMS);
  // Blob URLs promoted from the form into posted items — owned here so they
  // stay alive while the cards render, and revoked only on page unmount.
  const blobUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const urls = blobUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  // Reads ?tab= on load and after every navigation (defaults to "lost").
  const tab: Tab = searchParams.get("tab") === "found" ? "found" : "lost";

  const selectTab = (next: Tab) => {
    // Same-route navigation; updates the URL without adding history entries.
    router.replace(`/lost-found?tab=${next}`, { scroll: false });
  };

  const addItem = (entry: NewFoundItem) => {
    if (entry.imageUrl.startsWith("blob:")) {
      blobUrlsRef.current.add(entry.imageUrl);
    }
    setItems((current) => [
      ...current,
      {
        ...entry,
        id: Date.now(),
        datePosted: new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      },
    ]);
  };

  const pill = (active: boolean) =>
    `flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
      active
        ? "bg-primary text-ink shadow-soft"
        : "text-slate-600 hover:bg-white/70 hover:text-ink"
    }`;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary-dark shadow-card">
            <PackageSearch className="h-7 w-7" />
          </span>
          <div>
            <h1 className="font-heading text-3xl font-bold text-ink sm:text-4xl">
              Lost & Found
            </h1>
            <p className="mt-1 text-sm text-slate-700 sm:text-base">
              Browse found items or report something you found.
            </p>
          </div>
        </div>

        {/* Tab toggle */}
        <div
          role="tablist"
          aria-label="Lost & Found sections"
          className="flex w-fit items-center gap-1 rounded-full bg-card p-1.5 shadow-card"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "lost"}
            onClick={() => selectTab("lost")}
            className={pill(tab === "lost")}
          >
            <Search className="h-4 w-4" />
            Lost
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "found"}
            onClick={() => selectTab("found")}
            className={pill(tab === "found")}
          >
            <PackagePlus className="h-4 w-4" />
            Found
          </button>
        </div>
      </header>

      {tab === "lost" ? (
        <LostItemsSection items={items} />
      ) : (
        <FoundItemForm onPost={addItem} />
      )}
    </div>
  );
}
