/* ------------------------------------------------------------------ *
 *  Types for the Lost & Found page. The posts themselves come from   *
 *  the Django API (GET /api/lost-found/) — the starter posts live in  *
 *  Backend/lostfound/management/commands/seed_found_items.py.        *
 * ------------------------------------------------------------------ */

export type ItemCategory = "Electronics" | "Accessories" | "Documents" | "Others";

export const CATEGORIES: ItemCategory[] = [
  "Electronics",
  "Accessories",
  "Documents",
  "Others",
];

/** A found item as rendered by the cards (camelCase, API-derived). */
export interface FoundItem {
  id: number;
  itemName: string;
  category: ItemCategory;
  description: string;
  locationFound: string;
  imageUrl: string;
  finderName: string;
  finderPhone: string;
  /** e.g. "6 Aug 2026" */
  datePosted: string;
}

/**
 * What the Found tab form submits. The photo is the raw File so the
 * explorer can upload it as multipart/form-data (no client-side URL yet).
 */
export interface NewFoundItem {
  itemName: string;
  category: ItemCategory;
  description: string;
  locationFound: string;
  finderName: string;
  finderPhone: string;
  image: File | null;
}
