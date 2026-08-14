"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ChangeEvent, FormEvent } from "react";
import { BookPlus, FileText, GraduationCap, Loader2, X } from "lucide-react";
import { apiRequest, ApiError, firstErrorMessage } from "@/lib/api";
import { authHeaders } from "@/lib/auth";
import { DEPARTMENTS } from "@/lib/departments";
import type { Book, BookFormat, BookStatus } from "./dummyData";

/** Book shape as served by the Django API (snake_case). */
export interface ApiBook {
  id: number;
  title: string;
  author: string;
  isbn: string;
  format: BookFormat;
  status: BookStatus;
  cover_url: string;
  pdf_file: string | null;
  department: string;
  return_date: string | null;
  added_by: number | null;
  added_by_name: string | null;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30";

const labelClass = "text-sm font-semibold text-slate-700";

const toggleClass = (active: boolean) =>
  `rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
    active
      ? "border-primary bg-primary-light text-primary-dark"
      : "border-slate-200 bg-white/60 text-slate-600 hover:border-slate-300"
  }`;

interface BookFormModalProps {
  /** Existing book when editing; null when creating. */
  initial?: Book | null;
  /** PDF pre-selected from the upload zone (create flow). */
  presetPdf?: File | null;
  /** True when the manager is a Librarian — gets the department picker. */
  librarian?: boolean;
  /** The signed-in CR's own department (locks books to it, PDF only). */
  crDepartment?: string | null;
  onClose: () => void;
  /** Called after a successful create/update with the saved book. */
  onSaved: (book: Book) => void;
}

/** Add/edit modal for the library's book list.
    Librarians manage campus-wide (or department-scoped) books; CRs upload
    PDF books for their own department — the backend forces the department,
    so the form never sends one for CRs. Creates via POST /api/library/ and
    updates via PATCH /api/library/<id>/, using multipart so an uploaded PDF
    goes to the backend with the fields. */
export default function BookFormModal({
  initial = null,
  presetPdf = null,
  librarian = false,
  crDepartment = null,
  onClose,
  onSaved,
}: BookFormModalProps) {
  const editing = Boolean(initial);
  // CR uploads are PDFs for the CR's own department; Librarians may choose.
  const crMode = !librarian && Boolean(crDepartment);
  const department = crMode ? crDepartment : initial?.department || "";

  const [format, setFormat] = useState<BookFormat>(() => {
    if (presetPdf || crMode) return "PDF";
    return initial?.format ?? "Physical";
  });
  const [status, setStatus] = useState<BookStatus>(initial?.status ?? "Available");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [isbn, setIsbn] = useState(initial?.isbn ?? "");
  const [coverUrl, setCoverUrl] = useState(initial?.coverImageUrl ?? "");
  const [bookDepartment, setBookDepartment] = useState(department ?? "");
  const [returnDate, setReturnDate] = useState(
    initial?.returnDate ? initial.returnDate.split("/").reverse().join("-") : ""
  );
  const [pdfFile, setPdfFile] = useState<File | null>(presetPdf);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep the latest onClose without re-adding the listener on every render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Close on Escape and scroll-lock the page body while open.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, []);

  const pickPdf = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.includes("pdf")) {
      setError("Please choose a .pdf file.");
      return;
    }
    setPdfFile(file);
    setError(null);
    // Reset the input so picking the same file again re-triggers onChange.
    e.currentTarget.value = "";
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter the book title.");
      return;
    }
    if (!author.trim()) {
      setError("Please enter the author's name.");
      return;
    }
    if (status === "Taken" && !returnDate) {
      setError("Add a return date for a book that is taken.");
      return;
    }
    if (format === "PDF" && !pdfFile && !editing) {
      setError("Attach the PDF file, or choose the Physical format.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("title", title.trim());
      form.append("author", author.trim());
      form.append("isbn", isbn.trim());
      form.append("format", format);
      form.append("status", status);
      form.append("cover_url", coverUrl.trim());
      // Librarians may scope a book to a department; the backend forces the
      // CR's own department for CR uploads, so no department is sent there.
      if (librarian && bookDepartment) form.append("department", bookDepartment);
      if (status === "Taken") form.append("return_date", returnDate);
      if (pdfFile) form.append("pdf_file", pdfFile);

      const saved = await apiRequest<ApiBook>(
        initial ? `/library/${initial.id}/` : "/library/",
        {
          method: initial ? "PATCH" : "POST",
          headers: authHeaders(),
          body: form,
        }
      );
      onSaved(toBook(saved));
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? firstErrorMessage(err.body)
          : "Could not save the book. Is the backend running?"
      );
    } finally {
      setBusy(false);
    }
  };

  // Rendered through a portal to <body> so the backdrop covers the whole
  // viewport — including the app shell's navbar — instead of being contained
  // by the page's stacking context.
  return createPortal(
    <div
      className="fixed inset-0 z-[70] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={editing ? "Edit book" : "Add book"}
    >
      {/* Backdrop — clicking it closes the modal */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centers the card when it fits, scrolls when it is taller than the
          screen — the popup always stays fully visible and reachable. */}
      <div className="relative flex min-h-full items-center justify-center p-4">
      <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl glass-strong shadow-lift ring-1 ring-white/60">
        <div className="flex items-center justify-between gap-3 border-b border-white/50 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-dark">
              <BookPlus className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate font-heading text-lg font-bold leading-tight text-ink">
                {editing ? "Edit book" : "Add a book"}
              </h3>
              <p className="text-xs font-medium text-slate-600">
                {crMode
                  ? `Department PDF — visible to ${crDepartment} students`
                  : "Library catalogue — Librarians only"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-600 transition-colors duration-200 hover:bg-white/70 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <div className="grid grid-cols-2 gap-2">
            {crMode ? (
              <div className="flex flex-col gap-1.5">
                <span className={labelClass}>Format</span>
                <div className="flex items-center gap-2 rounded-xl bg-primary-light px-3 py-2.5 text-sm font-semibold text-primary-dark">
                  <FileText className="h-4 w-4" />
                  PDF
                </div>
                <p className="text-xs font-medium text-slate-500">
                  CR uploads are PDFs for your department.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <span className={labelClass}>Format</span>
                <div className="grid grid-cols-2 gap-2">
                  {(["Physical", "PDF"] as BookFormat[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setFormat(option)}
                      aria-pressed={format === option}
                      className={toggleClass(format === option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Status</span>
              <div className="grid grid-cols-2 gap-2">
                {(["Available", "Taken"] as BookStatus[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setStatus(option)}
                    aria-pressed={status === option}
                    className={toggleClass(status === option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {librarian ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="book-department" className={labelClass}>
                Department <span className="font-normal text-slate-400">(blank = campus-wide)</span>
              </label>
              <select
                id="book-department"
                value={bookDepartment}
                onChange={(e) => setBookDepartment(e.target.value)}
                disabled={busy}
                className={inputClass}
              >
                <option value="">Campus-wide (all departments)</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <p className="text-xs font-medium text-slate-500">
                Campus-wide books are visible to everyone; department books only to that department.
              </p>
            </div>
          ) : crMode ? (
            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Department</span>
              <div className="flex items-center gap-2 rounded-xl bg-primary-light px-3 py-2.5 text-sm font-semibold text-primary-dark">
                <GraduationCap className="h-4 w-4" />
                {crDepartment} — visible only to {crDepartment} students
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="book-title" className={labelClass}>
              Title
            </label>
            <input
              id="book-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Django Book"
              disabled={busy}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="book-author" className={labelClass}>
              Author
            </label>
            <input
              id="book-author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Adrian Holovaty"
              disabled={busy}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="book-isbn" className={labelClass}>
              ISBN <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="book-isbn"
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="e.g. 9781590597255"
              disabled={busy}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="book-cover" className={labelClass}>
              Cover image URL <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="book-cover"
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://covers.openlibrary.org/b/isbn/…-M.jpg"
              disabled={busy}
              className={inputClass}
            />
          </div>

          {status === "Taken" ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="book-return" className={labelClass}>
                Return date
              </label>
              <input
                id="book-return"
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                disabled={busy}
                className={inputClass}
              />
            </div>
          ) : null}

          {format === "PDF" ? (
            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>PDF file</span>
              <label
                htmlFor="book-pdf"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-white/60 px-4 py-3.5 text-sm font-semibold text-primary-dark transition-colors duration-200 hover:border-primary/70 hover:bg-white/80"
              >
                <FileText className="h-4 w-4" />
                {pdfFile ? `Selected: ${pdfFile.name}` : "Choose a PDF file…"}
              </label>
              <input
                id="book-pdf"
                type="file"
                accept=".pdf,application/pdf"
                onChange={pickPdf}
                disabled={busy}
                className="sr-only"
              />
              {editing && !pdfFile ? (
                <p className="text-xs font-medium text-slate-500">
                  No new file picked — the existing PDF stays.
                </p>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
            >
              {error}
            </p>
          ) : null}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:bg-primary-dark hover:text-white hover:shadow-lift active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BookPlus className="h-4 w-4" />
              )}
              {busy ? "Saving…" : editing ? "Save changes" : "Add book"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>,
    document.body
  );
}

/** Maps an API book to the frontend Book shape (camelCase). */
export function toBook(api: ApiBook): Book {
  return {
    id: api.id,
    title: api.title,
    author: api.author,
    isbn: api.isbn,
    coverImageUrl: api.cover_url,
    format: api.format,
    status: api.status,
    returnDate: api.return_date
      ? api.return_date.split("-").reverse().join("/")
      : undefined,
    pdfUrl: api.pdf_file,
    department: api.department || undefined,
    addedByName: api.added_by_name,
  };
}
