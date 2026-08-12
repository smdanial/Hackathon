/* ------------------------------------------------------------------ *
 *  Dummy data for the Library page — swap for real API calls later.   *
 * ------------------------------------------------------------------ */

export type BookFormat = "Physical" | "PDF";
export type BookStatus = "Available" | "Taken";

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  coverImageUrl: string;
  format: BookFormat;
  status: BookStatus;
  /** Only present when status is "Taken". Format: DD/MM/YYYY. */
  returnDate?: string;
  /** Uploaded PDF served by the backend (absolute URL); null for Physical. */
  pdfUrl?: string | null;
}

export const PAGE_SIZE = 4;

/**
 * Placeholder PDF used by the "Read PDF" demo. Swap this for a real file
 * (e.g. a copy under /public/books/... or a signed URL) once a backend
 * or book file store exists.
 */
export const SAMPLE_PDF_URL =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

const cover = (isbn: string) => `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;

export const BOOKS: Book[] = [
  {
    id: 1,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "9780061120084",
    coverImageUrl: cover("9780061120084"),
    format: "Physical",
    status: "Taken",
    returnDate: "18/08/2026",
  },
  {
    id: 2,
    title: "1984",
    author: "George Orwell",
    isbn: "9780451524935",
    coverImageUrl: cover("9780451524935"),
    format: "PDF",
    status: "Available",
  },
  {
    id: 3,
    title: "Pride and Prejudice",
    author: "Jane Austen",
    isbn: "9780141439518",
    coverImageUrl: cover("9780141439518"),
    format: "Physical",
    status: "Available",
  },
  {
    id: 4,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "9780743273565",
    coverImageUrl: cover("9780743273565"),
    format: "PDF",
    status: "Taken",
    returnDate: "22/08/2026",
  },
  {
    id: 5,
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    isbn: "9780547928227",
    coverImageUrl: cover("9780547928227"),
    format: "Physical",
    status: "Available",
  },
  {
    id: 6,
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    isbn: "9780590353427",
    coverImageUrl: cover("9780590353427"),
    format: "PDF",
    status: "Available",
  },
  {
    id: 7,
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    isbn: "9780316769488",
    coverImageUrl: cover("9780316769488"),
    format: "Physical",
    status: "Taken",
    returnDate: "25/08/2026",
  },
  {
    id: 8,
    title: "The Alchemist",
    author: "Paulo Coelho",
    isbn: "9780062315007",
    coverImageUrl: cover("9780062315007"),
    format: "PDF",
    status: "Taken",
    returnDate: "28/08/2026",
  },
  {
    id: 9,
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    isbn: "9780062316097",
    coverImageUrl: cover("9780062316097"),
    format: "Physical",
    status: "Available",
  },
];

/* ----------------------------- Seats ------------------------------ */

export type SeatStatus = "available" | "taken";

export type SeatZone = "desks" | "tables";

export interface Seat {
  id: string; // e.g. "D3-4" (desk row 3, col 4) or "T1-2" (table 1, seat 2)
  zone: SeatZone;
  /** For desks: 1-based row. For tables: 1-based table group. */
  group: number;
  /** Position within the row, or around the table. */
  position: number;
  status: SeatStatus;
}

/** Floor-plan layout constants — swap for a live occupancy API later. */
export const DESK_ROWS = 5;
export const DESKS_PER_ROW = 6;
export const TABLE_GROUPS = 2;
export const SEATS_PER_TABLE = 5;

// Deterministic ~60/40 available/taken split (stable across renders):
// every 10 seats yield 6 available, 4 taken → 24 of 40 seats available.
const seatStatus = (index: number): SeatStatus =>
  (index * 7 + 3) % 10 < 6 ? "available" : "taken";

export const SEATS: Seat[] = [
  ...Array.from({ length: DESK_ROWS }, (_, r) =>
    Array.from({ length: DESKS_PER_ROW }, (_, c) => ({
      id: `D${r + 1}-${c + 1}`,
      zone: "desks" as const,
      group: r + 1,
      position: c + 1,
      status: seatStatus(r * DESKS_PER_ROW + c),
    })),
  ),
  ...Array.from({ length: TABLE_GROUPS }, (_, t) =>
    Array.from({ length: SEATS_PER_TABLE }, (_, s) => ({
      id: `T${t + 1}-${s + 1}`,
      zone: "tables" as const,
      group: t + 1,
      position: s + 1,
      status: seatStatus(DESK_ROWS * DESKS_PER_ROW + t * SEATS_PER_TABLE + s),
    })),
  ),
].flat();
