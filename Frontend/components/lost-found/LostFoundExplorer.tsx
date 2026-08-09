"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DoorOpen, Loader2, PackagePlus, PackageSearch, Search } from "lucide-react";
import { ApiError, apiRequest, firstErrorMessage } from "@/lib/api";
import { authHeaders } from "@/lib/auth";
import FoundItemForm from "./FoundItemForm";
import LostItemsSection from "./LostItemsSection";
import type { FoundItem, ItemCategory, NewFoundItem } from "./dummyData";

type Tab = "lost" | "found";

/** Found-item shape as served by the Django API (snake_case). */
interface ApiFoundItem {
  id: number;
  item_name: string;
  category: ItemCategory;
  description: string;
  location_found: string;
  image: string | null;
  finder_name: string;
  finder_phone: string;
  date_posted: string;
}

/** Maps an API post to the frontend FoundItem shape (camelCase). */
function toFoundItem(api: ApiFoundItem): FoundItem {
  return {
    id: api.id,
    itemName: api.item_name,
    category: api.category,
    description: api.description,
    locationFound: api.location_found,
    imageUrl: api.image ?? "",
    finderName: api.finder_name,
    finderPhone: api.finder_phone,
    datePosted: new Date(`${api.date_posted}T00:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  };
}

/**
 * Lost & Found page shell: pill tab toggle (Lost default) + section content.
 * The ?tab= query param is the single source of truth for the active tab,
 * so the navbar's dropdown links (/lost-found?tab=lost, ?tab=found) land
 * correctly and tab switches stay reflected in the URL.
 *
 * Posts are fetched from the Django API on mount and the Found tab form
 * uploads straight to it, so new reports persist in the database.
 */
export default function LostFoundExplorer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch reported items once on mount.
  useEffect(() => {
    let cancelled = false;
    apiRequest<ApiFoundItem[]>("/lost-found/")
      .then((data) => {
        if (!cancelled) setItems(data.map(toFoundItem));
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? firstErrorMessage(err.body)
              : "Could not load found items. Is the backend running?"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Reads ?tab= on load and after every navigation (defaults to "lost").
  const tab: Tab = searchParams.get("tab") === "found" ? "found" : "lost";

  const selectTab = (next: Tab) => {
    // Same-route navigation; updates the URL without adding history entries.
    router.replace(`/lost-found?tab=${next}`, { scroll: false });
  };

  /** Uploads a report to the API and prepends the created post to the list. */
  const postItem = async (entry: NewFoundItem): Promise<void> => {
    const form = new FormData();
    form.append("item_name", entry.itemName);
    form.append("category", entry.category);
    form.append("description", entry.description);
    form.append("location_found", entry.locationFound);
    form.append("finder_name", entry.finderName);
    form.append("finder_phone", entry.finderPhone);
    if (entry.image) form.append("image", entry.image);

    const created = await apiRequest<ApiFoundItem>("/lost-found/", {
      method: "POST",
      headers: authHeaders(),
      body: form,
    });
    setItems((current) => [toFoundItem(created), ...current]);
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
        loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-primary-dark" />
            <p className="text-sm font-medium">Loading found items…</p>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
            <DoorOpen className="mx-auto h-8 w-8 text-rose-400" />
            <p className="mt-2 text-sm font-medium text-rose-700">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-dark"
            >
              Try again
            </button>
          </div>
        ) : (
          <LostItemsSection items={items} />
        )
      ) : (
        <FoundItemForm onPost={postItem} />
      )}
    </div>
  );
}
