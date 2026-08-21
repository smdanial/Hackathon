"use client";

import { useEffect, useState } from "react";
import {
  BookPlus,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
  Lock,
  Search,
  SearchX,
  Upload,
} from "lucide-react";
import { apiRequest, ApiError, firstErrorMessage } from "@/lib/api";
import { authHeaders, type Student } from "@/lib/auth";
import { useSession } from "@/lib/useSession";
import { DEPARTMENTS } from "@/lib/departments";
import { PAGE_SIZE } from "./dummyData";
import type { Book } from "./dummyData";
import BookCard from "./BookCard";
import BookFormModal, { toBook, type ApiBook } from "./BookFormModal";

type FormatFilter = "all" | "Physical" | "PDF";

const FORMAT_FILTERS: { value: FormatFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Physical", label: "Physical" },
  { value: "PDF", label: "PDF" },
];

interface ModalState {
  book: Book | null;
  presetPdf: File | null;
}

/**
 * Books tab: live search, format filters, paginated grid and a Librarian-only
 * management panel. The catalogue is fetched from Django (GET /api/library/);
 * Librarians can add books, upload PDFs, and edit or delete entries — all
 * writes are enforced server-side, so non-Librarians only see the read UI.
 */
export default function BooksSection() {
  // Bumps when the stored session changes — re-fetches the role + department
  // and the catalogue so admin changes land without a reload.
  const { version: sessionVersion } = useSession();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLibrarian, setIsLibrarian] = useState(false);
  const [isCr, setIsCr] = useState(false);
  // The signed-in student's department — CR books are scoped to it.
  const [department, setDepartment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState<FormatFilter>("all");
  const [deptFilter, setDeptFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch the signed-in student's role + department first (the stored
  // session can be stale right after an admin grants a role), then load the
  // full catalogue (no department filter — every student sees all books
  // by default). A separate effect re-fetches when the department filter
  // dropdown changes.
  useEffect(() => {
    let cancelled = false;
    apiRequest<Student>("/auth/me/", { headers: authHeaders() })
      .then((me) => {
        if (cancelled) return;
        setIsLibrarian(me.is_librarian === true);
        setIsCr(me.is_cr === true);
        const dept = me.department?.trim() ?? "";
        setDepartment(dept || null);
        // Always fetch the full catalogue on initial load — no dept filter.
        return apiRequest<ApiBook[]>("/library/", { headers: authHeaders() });
      })
      .then((data) => {
        if (cancelled || !data) return;
        setBooks(data.map(toBook));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError
            ? firstErrorMessage(err.body)
            : "Could not load the library catalogue. Is the backend running?"
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionVersion]);

  // Re-fetch books when the department filter dropdown changes (but not on
  // the initial empty-string mount, which is already handled above).
  useEffect(() => {
    if (loading) return; // skip the first render — handled by the effect above
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    const url = deptFilter
      ? `/library/?department=${encodeURIComponent(deptFilter)}`
      : "/library/";
    apiRequest<ApiBook[]>(url, { headers: authHeaders() })
      .then((data) => {
        if (cancelled) return;
        setBooks(data.map(toBook));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError
            ? firstErrorMessage(err.body)
            : "Could not load the library catalogue. Is the backend running?"
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [deptFilter]);

  const normalized = query.trim().toLowerCase();

  // Combine search + format filter (both apply together).
  const filtered = books.filter((book) => {
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

  // Keep page 1 while the result set is changing — reset on each change.
  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const updateFormat = (next: FormatFilter) => {
    setFormat(next);
    setPage(1);
  };

  // New book arrives (or an edit comes back): upsert and re-sort by title
  // to match the backend's ordering.
  const handleSaved = (book: Book) => {
    setBooks((current) =>
      [...current.filter((b) => b.id !== book.id), book].sort((a, b) =>
        a.title.localeCompare(b.title)
      )
    );
  };

  // Who may manage a given book: Librarians manage everything; a CR manages
  // only their own department's uploaded books.
  const canManageBook = (book: Book): boolean =>
    isLibrarian || (isCr && Boolean(department) && book.department === department);

  const handleDelete = async (book: Book) => {
    if (!window.confirm(`Delete "${book.title}" from the catalogue?`)) return;
    setDeleting(true);
    try {
      await apiRequest(`/library/${book.id}/`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setBooks((current) => current.filter((b) => b.id !== book.id));
    } catch (err) {
      window.alert(
        err instanceof ApiError
          ? firstErrorMessage(err.body)
          : "Could not delete the book. Is the backend running?"
      );
    } finally {
      setDeleting(false);
    }
  };

  const filterPill = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
      active
        ? "bg-primary text-white shadow-soft"
        : "bg-white text-slate-600 shadow-sm hover:bg-slate-100 hover:text-ink"
    }`;

  return (
    <section id="books" className="scroll-mt-20 flex flex-col gap-6">
      {/* Search + filters bar */}
      <div className="flex flex-col gap-4 rounded-3xl glass p-5 shadow-soft ring-1 ring-white/60 sm:p-6">
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
          {/* Department filter dropdown — defaults to "All Departments" */}
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold text-slate-600 shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

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

          {isLibrarian ? (
            <button
              type="button"
              onClick={() => setModal({ book: null, presetPdf: null })}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:bg-primary-dark hover:text-white active:scale-[0.98]"
            >
              <BookPlus className="h-4 w-4" />
              Add book
            </button>
          ) : isCr && department ? (
            <button
              type="button"
              onClick={() => setModal({ book: null, presetPdf: null })}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:bg-primary-dark hover:text-white active:scale-[0.98]"
            >
              <BookPlus className="h-4 w-4" />
              Upload PDF
            </button>
          ) : null}

          <p className="ml-auto text-xs font-medium text-slate-600">
            Showing {visibleBooks.length} of {filtered.length} book{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* Book grid / empty state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-primary-dark" />
          <p className="text-sm font-medium">Loading the catalogue…</p>
        </div>
      ) : loadError ? (
        <div className="mx-auto max-w-xl rounded-3xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-rose-700">{loadError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-dark"
          >
            Try again
          </button>
        </div>
      ) : visibleBooks.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onEdit={
                canManageBook(book)
                  ? (b) => setModal({ book: b, presetPdf: null })
                  : undefined
              }
              onDelete={canManageBook(book) && !deleting ? handleDelete : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl glass px-6 py-16 text-center shadow-soft">
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
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition-all duration-200 hover:bg-primary hover:text-white hover:shadow-soft disabled:pointer-events-none disabled:opacity-40"
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
                  ? "bg-primary text-white shadow-soft"
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
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition-all duration-200 hover:bg-primary hover:text-white hover:shadow-soft disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      ) : null}

      {/* Management panels — Librarians get the library panel, CRs get their
          department panel, everyone else sees the read-only note */}
      {isLibrarian ? (
        <div className="rounded-3xl border-2 border-dashed border-primary/40 glass-soft p-5 shadow-card sm:p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-dark shadow-card">
                <Upload className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-heading text-base font-semibold text-ink">
                  Upload a book PDF
                </h3>
                <p className="mt-0.5 text-sm text-slate-600">
                  Pick a .pdf — then add the title and author to publish it in the catalogue.
                </p>
              </div>
            </div>

            <label
              htmlFor="pdf-upload"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:bg-primary-dark hover:text-white hover:shadow-lift active:scale-[0.98]"
            >
              <Upload className="h-4 w-4" />
              Choose PDF
            </label>
            <input
              id="pdf-upload"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.currentTarget.value = "";
                if (!file) return;
                if (!file.type.includes("pdf")) return;
                setModal({ book: null, presetPdf: file });
              }}
              className="sr-only"
            />
          </div>
        </div>
      ) : isCr && department ? (
        <div className="rounded-3xl border-2 border-dashed border-primary/40 glass-soft p-5 shadow-card sm:p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-dark shadow-card">
                <GraduationCap className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-heading text-base font-semibold text-ink">
                  Upload a PDF for {department}
                </h3>
                <p className="mt-0.5 text-sm text-slate-600">
                  Share class notes, syllabi or readings — visible only to {department} students.
                </p>
              </div>
            </div>

            <label
              htmlFor="cr-pdf-upload"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:bg-primary-dark hover:text-white hover:shadow-lift active:scale-[0.98]"
            >
              <Upload className="h-4 w-4" />
              Choose PDF
            </label>
            <input
              id="cr-pdf-upload"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.currentTarget.value = "";
                if (!file) return;
                if (!file.type.includes("pdf")) return;
                setModal({ book: null, presetPdf: file });
              }}
              className="sr-only"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-3xl glass-soft p-5 shadow-card sm:p-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 shadow-card">
            <Lock className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-heading text-base font-semibold text-ink">
              Managed by the library staff
            </h3>
            <p className="mt-0.5 text-sm text-slate-600">
              Only Librarians and department CRs can add, upload and update books. Ask the library desk if something is missing.
            </p>
          </div>
        </div>
      )}

      {modal ? (
        <BookFormModal
          initial={modal.book}
          presetPdf={modal.presetPdf}
          librarian={isLibrarian}
          crDepartment={department}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      ) : null}
    </section>
  );
}
