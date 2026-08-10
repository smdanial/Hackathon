"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Bell, Loader2, X } from "lucide-react";
import { apiRequest, ApiError, firstErrorMessage } from "@/lib/api";
import { authHeaders } from "@/lib/auth";
import type { Notice, NoticeCategory } from "@/lib/mockNotices";

/** Notice shape as served by the Django API (snake_case). */
interface ApiNotice {
  id: number;
  category: NoticeCategory;
  title: string;
  body: string;
  department: string;
  posted_by: number | null;
  posted_by_name: string | null;
  created_at: string;
}

const CR_CATEGORIES: { value: "class" | "lab"; label: string }[] = [
  { value: "class", label: "Class" },
  { value: "lab", label: "Lab" },
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30";

const labelClass = "text-sm font-semibold text-slate-700";

interface NoticeFormModalProps {
  /** Existing notice when editing; null/undefined when creating. */
  initial?: Notice | null;
  onClose: () => void;
  /** Called after a successful create/update with the saved notice. */
  onSaved: (notice: Notice) => void;
}

/**
 * Add/edit modal for Class and Lab notices — shown only to CRs. Creates via
 * POST /api/notices/ and updates via PATCH /api/notices/<id>/.
 */
export default function NoticeFormModal({
  initial = null,
  onClose,
  onSaved,
}: NoticeFormModalProps) {
  const editing = Boolean(initial);
  const [category, setCategory] = useState<"class" | "lab">(
    initial?.category === "lab" ? "lab" : "class"
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a title for the notice.");
      return;
    }
    if (!body.trim()) {
      setError("Please write the notice body.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = {
        category,
        title: title.trim(),
        body: body.trim(),
      };
      const saved = await apiRequest<ApiNotice>(
        initial ? `/notices/${initial.id}/` : "/notices/",
        {
          method: initial ? "PATCH" : "POST",
          headers: authHeaders(),
          body: JSON.stringify(payload),
        }
      );
      onSaved({
        id: saved.id,
        category: saved.category,
        title: saved.title,
        body: saved.body,
        postedAt: saved.created_at,
        postedById: saved.posted_by,
        postedByName: saved.posted_by_name,
        department: saved.department ?? "",
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? firstErrorMessage(err.body)
          : "Could not save the notice. Is the backend running?"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={editing ? "Edit notice" : "Add notice"}
    >
      {/* Backdrop — clicking it closes the modal */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl glass-strong shadow-lift ring-1 ring-white/60">
        <div className="flex items-center justify-between gap-3 border-b border-white/50 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-dark">
              <Bell className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate font-heading text-lg font-bold leading-tight text-ink">
                {editing ? "Edit notice" : "Add notice"}
              </h3>
              <p className="text-xs font-medium text-slate-600">
                Class / Lab notices — visible to everyone
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
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Category</span>
            <div className="grid grid-cols-2 gap-2">
              {CR_CATEGORIES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCategory(option.value)}
                  aria-pressed={category === option.value}
                  className={`rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    category === option.value
                      ? "border-primary bg-primary-light text-primary-dark"
                      : "border-slate-200 bg-white/60 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="notice-title" className={labelClass}>
              Title
            </label>
            <input
              id="notice-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Friday's DBMS class moved to Lab 3"
              disabled={busy}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="notice-body" className={labelClass}>
              Body
            </label>
            <textarea
              id="notice-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write the notice details…"
              rows={5}
              disabled={busy}
              className={`${inputClass} resize-none`}
            />
          </div>

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
                <Bell className="h-4 w-4" />
              )}
              {busy ? "Saving…" : editing ? "Save changes" : "Post notice"}
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
  );
}
