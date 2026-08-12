"use client";

import { useState } from "react";
import { Book, BookOpen, CalendarDays, Check, FileText, Pencil, Trash2 } from "lucide-react";
import { SAMPLE_PDF_URL } from "./dummyData";
import type { Book as BookData } from "./dummyData";

interface BookCardProps {
  book: BookData;
  /** Librarian-only: edit/delete actions (hidden when omitted). */
  onEdit?: (book: BookData) => void;
  onDelete?: (book: BookData) => void;
}

/**
 * Single book card. Anyone can browse and read/reserve; when ``onEdit`` /
 * ``onDelete`` are provided (Librarians only) the card also shows the
 * edit and delete actions. PDFs open the backend-uploaded file (falling
 * back to the sample document for seeded books without one).
 */
export default function BookCard({ book, onEdit, onDelete }: BookCardProps) {
  const [reserved, setReserved] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);

  const isAvailable = book.status === "Available";
  const isPdf = book.format === "PDF";

  const openPdf = () => {
    window.open(book.pdfUrl || SAMPLE_PDF_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl glass shadow-card ring-1 ring-white/60 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift">
      {/* Cover */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-primary-light">
        {coverFailed ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-linear-to-br from-primary to-primary-dark p-4 text-center">
            <BookOpen className="h-10 w-10 text-white" />
            <span className="font-heading text-sm font-semibold leading-tight text-white">
              {book.title}
            </span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverImageUrl}
            alt={`Cover of ${book.title}`}
            loading="lazy"
            onError={() => setCoverFailed(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}

        {/* Format tag */}
        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
          {isPdf ? <FileText className="h-3 w-3" /> : <Book className="h-3 w-3" />}
          {book.format}
        </span>

        {/* Librarian actions */}
        {onEdit || onDelete ? (
          <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
            {onEdit ? (
              <button
                type="button"
                onClick={() => onEdit(book)}
                aria-label={`Edit ${book.title}`}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-primary-dark active:scale-95"
              >
                <Pencil className="h-4 w-4" />
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(book)}
                aria-label={`Delete ${book.title}`}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-rose-700 active:scale-95"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div>
          <h3 className="font-heading text-base font-semibold leading-snug text-ink">
            {book.title}
          </h3>
          <p className="mt-0.5 text-sm text-slate-600">{book.author}</p>
        </div>

        {isAvailable ? (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-success-light px-2.5 py-1 text-xs font-semibold text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Available
          </span>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-error-light px-2.5 py-1 text-xs font-semibold text-error">
              <span className="h-1.5 w-1.5 rounded-full bg-error" />
              Taken
            </span>
            {book.returnDate ? (
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                Available again: {book.returnDate}
              </p>
            ) : null}
          </div>
        )}

        {/* Action */}
        <div className="mt-auto pt-1.5">
          {isAvailable && isPdf ? (
            <button
              type="button"
              onClick={openPdf}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:bg-primary-dark hover:text-white hover:shadow-lift active:scale-[0.98]"
            >
              <FileText className="h-4 w-4" />
              Read PDF
            </button>
          ) : isAvailable ? (
            <button
              type="button"
              onClick={() => setReserved(true)}
              disabled={reserved}
              aria-pressed={reserved}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                reserved
                  ? "cursor-default bg-success-light text-success"
                  : "bg-primary text-white shadow-soft hover:bg-primary-dark hover:text-white hover:shadow-lift"
              }`}
            >
              {reserved ? (
                <>
                  <Check className="h-4 w-4" />
                  Reserved
                </>
              ) : (
                "Reserve"
              )}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
