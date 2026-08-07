"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Search, SearchX, Upload } from "lucide-react";
import { BOOKS, PAGE_SIZE } from "./dummyData";
import BookCard from "./BookCard";

type FormatFilter = "all" | "Physical" | "PDF";

const FORMAT_FILTERS: { value: FormatFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Physical", label: "Physical" },
  { value: "PDF", label: "PDF" },
];

/**
 * Books tab: live search, format filters, paginated grid and a purely
 * client-side PDF preview upload demo (no backend involved).
 */
export default function BooksSection() {
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState<FormatFilter>("all");
  const [page, setPage] = useState(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const normalized = query.trim().toLowerCase();

  // Combine search + format filter (both apply together).
  const filtered = BOOKS.filter((book) => {
    const matchesQuery =
      !normalized ||
      book.title.toLowerCase().includes(normalized) ||
      book.author.toLowerCase().includes(normalized);
    const matchesFormat = format === "all" || book.format === format;
    return matchesQuery && matchesFormat;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const visibleBooks = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  // Revoke the previous blob URL on unmount to avoid leaks.
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  // Keep page 1 while the result set is changing — reset on each change.
  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const updateFormat = (next: FormatFilter) => {
    setFormat(next);
    setPage(1);
  };

  // Pure client-side demo: no upload, no storage. The file becomes a local
  // blob URL and opens in a new tab instantly.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.includes("pdf")) return;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setFileName(file.name);
    window.open(url, "_blank", "noopener,noreferrer");
    // Reset the input so picking the same file again re-triggers onChange.
    e.currentTarget.value = "";
  };

  const filterPill = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
      active
        ? "bg-primary text-ink shadow-soft"
        : "bg-white text-slate-600 shadow-sm hover:bg-slate-100 hover:text-ink"
    }`;

  return (
    <section id="books" className="scroll-mt-20 flex flex-col gap-6">
      {/* Search + filters bar */}
      <div className="flex flex-col gap-4 rounded-3xl bg-card p-5 shadow-soft sm:p-6">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            placeholder="Search by title or author…"
            aria-label="Search books by title or author"
            className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-ink shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {FORMAT_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => updateFormat(value)}
              aria-pressed={format === value}
              className={filterPill(format === value)}
            >
              {label}
            </button>
          ))}
          <p className="ml-auto text-xs font-medium text-slate-600">
            Showing {visibleBooks.length} of {filtered.length} book{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* Book grid / empty state */}
      {visibleBooks.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl bg-card px-6 py-16 text-center shadow-soft">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-light text-primary-dark shadow-card">
            <SearchX className="h-8 w-8" />
          </span>
          <h3 className="font-heading text-xl font-semibold text-ink">No books found</h3>
          <p className="max-w-sm text-sm text-slate-700">
            Nothing matches your search. Try a different title, author, or format.
          </p>
        </div>
      )}

      {/* Pagination — respects the filtered result set */}
      {totalPages > 1 ? (
        <nav aria-label="Book results pages" className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            aria-label="Previous page"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition-all duration-200 hover:bg-primary hover:text-ink hover:shadow-soft disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              aria-current={p === safePage ? "page" : undefined}
              className={`h-9 w-9 rounded-full text-sm font-semibold transition-all duration-200 ${
                p === safePage
                  ? "bg-primary text-ink shadow-soft"
                  : "bg-white text-slate-600 shadow-sm hover:bg-slate-100 hover:text-ink"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            aria-label="Next page"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition-all duration-200 hover:bg-primary hover:text-ink hover:shadow-soft disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      ) : null}

      {/* PDF upload demo — fully client-side */}
      <div className="rounded-3xl border-2 border-dashed border-primary/40 bg-card/70 p-5 shadow-card sm:p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-dark shadow-card">
              <Upload className="h-6 w-6" />
            </span>
            <div>
              <h3 className="font-heading text-base font-semibold text-ink">
                Upload a PDF to preview
              </h3>
              <p className="mt-0.5 text-sm text-slate-600">
                {fileName
                  ? `Selected: ${fileName} — opened in a new tab.`
                  : "Pick a .pdf file and it opens instantly in a new tab."}
              </p>
            </div>
          </div>

          <label
            htmlFor="pdf-upload"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-ink shadow-soft transition-all duration-200 hover:bg-primary-dark hover:text-white hover:shadow-lift active:scale-[0.98]"
          >
            <FileText className="h-4 w-4" />
            Choose PDF
          </label>
          {/* Real upload would happen here — for now the file never leaves the browser. */}
          <input
            id="pdf-upload"
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="sr-only"
          />
        </div>
      </div>
    </section>
  );
}
