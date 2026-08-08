/* ------------------------------------------------------------------ *
 *  Dummy data for the Lost & Found page — swap for real API calls.   *
 * ------------------------------------------------------------------ */

export type ItemCategory = "Electronics" | "Accessories" | "Documents" | "Others";

export const CATEGORIES: ItemCategory[] = [
  "Electronics",
  "Accessories",
  "Documents",
  "Others",
];

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

/** What the Found tab form submits — id/date are assigned by the explorer. */
export type NewFoundItem = Omit<FoundItem, "id" | "datePosted">;

// Seed images live in /public/lost-found/ — reference them directly.
export const SEED_ITEMS: FoundItem[] = [
  {
    id: 1,
    itemName: "Notebook",
    category: "Documents",
    description: "Green spiral-bound notebook with math notes inside, a little worn at the corners.",
    locationFound: "Library entrance",
    imageUrl: "/lost-found/notebook.jpeg",
    finderName: "Akash",
    finderPhone: "01712-345678",
    datePosted: "6 Aug 2026",
  },
  {
    id: 2,
    itemName: "Phone",
    category: "Electronics",
    description: "Black smartphone with a cracked screen protector, left on a canteen table.",
    locationFound: "Canteen",
    imageUrl: "/lost-found/phone.jpeg",
    finderName: "Danial",
    finderPhone: "01815-223344",
    datePosted: "5 Aug 2026",
  },
  {
    id: 3,
    itemName: "Calculator",
    category: "Electronics",
    description: "Casio scientific calculator found in Room 203 after the 2pm class.",
    locationFound: "Room 203",
    imageUrl: "/lost-found/calculator.jpeg",
    finderName: "Sojib",
    finderPhone: "01911-998877",
    datePosted: "4 Aug 2026",
  },
];
