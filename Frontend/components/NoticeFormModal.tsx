"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ChangeEvent, FormEvent } from "react";
import { Bell, ImagePlus, Link2, Loader2, Paperclip, X } from "lucide-react";
import { apiRequest, ApiError, firstErrorMessage } from "@/lib/api";
import { authHeaders } from "@/lib/auth";
import { NOTICE_CATEGORY_SHORT_LABELS } from "@/lib/mockNotices";
import type { Notice, NoticeCategory } from "@/lib/mockNotices";

/** Notice shape as served by the Django API (snake_case). */
interface ApiNotice {
  id: number;
  category: NoticeCategory;
  title: string;
  body: string;
  image: string | null;
  link_url: string;
  link_label: string;
  file: string | null;
  file_name: string;
  department: string;
  posted_by: number | null;
  posted_by_name: string | null;
  created_at: string;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30";

const labelClass = "text-sm font-semibold text-slate-700";

interface NoticeFormModalProps {
  /** Existing notice when editing; null/undefined when creating. */
  initial?: Notice | null;
  /** Categories the signed-in user may post (CR → class/lab, Club Member → club). */
  allowedCategories: NoticeCategory[];
  onClose: () => void;
  /** Called after a successful create/update with the saved notice. */
  onSaved: (notice: Notice) => void;
}

/** True when a URL only uses the safe http/https protocols. */
export function isSafeLink(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Add/edit modal for notices. The category toggle only offers the categories
 * the signed-in role may manage; Club notices additionally show an image
 * upload and a safe link (validated client-side AND by the backend's URL
 * validator). Submits multipart so the image uploads with the fields.
 */
export default function NoticeFormModal({
  initial = null,
  allowedCategories,
  onClose,
  onSaved,
}: NoticeFormModalProps) {
  const editing = Boolean(initial);
  const [category, setCategory] = useState<NoticeCategory>(() => {
    const current = initial?.category;
    return current && allowedCategories.includes(current)
      ? current
      : allowedCategories[0] ?? "class";
  });
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [linkUrl, setLinkUrl] = useState(initial?.linkUrl ?? "");
  const [linkLabel, setLinkLabel] = useState(initial?.linkLabel ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isClub = category === "club";

  // Track the preview blob URL for cleanup only (never read during render).
  const objectUrlRef = useRef<string | null>(null);
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

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

  const acceptFile = (next: File) => {
    setFile(next);
    setError(null);
  };

  const pickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0];
    if (!next) return;
    acceptFile(next);
    e.currentTarget.value = "";
  };

  const pickImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setImagePreview(url);
    setImageFile(file);
    setError(null);
    e.currentTarget.value = "";
  };

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
    if (linkUrl.trim() && !isSafeLink(linkUrl.trim())) {
      setError("Only safe links are allowed (http:// or https://).");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("category", category);
      form.append("title", title.trim());
      form.append("body", body.trim());
      form.append("link_url", linkUrl.trim());
      form.append("link_label", linkLabel.trim());
      if (imageFile) form.append("image", imageFile);
      if (file) {
        form.append("file", file);
        form.append("file_name", file.name);
      }

      const saved = await apiRequest<ApiNotice>(
        initial ? `/notices/${initial.id}/` : "/notices/",
        {
          method: initial ? "PATCH" : "POST",
          headers: authHeaders(),
          body: form,
        }
      );
      onSaved(toNotice(saved));
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

  const previewSrc = imagePreview ?? initial?.imageUrl ?? null;

  return createPortal(
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

      <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl glass-strong shadow-lift ring-1 ring-white/60">
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
                {isClub
                  ? "Club notice — campus-wide, with image & link"
                  : "Class / Lab notice — visible to your department"}
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
          {allowedCategories.length > 1 ? (
            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Category</span>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${allowedCategories.length}, minmax(0, 1fr))` }}>
                {allowedCategories.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setCategory(option)}
                    aria-pressed={category === option}
                    className={`rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      category === option
                        ? "border-primary bg-primary-light text-primary-dark"
                        : "border-slate-200 bg-white/60 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {NOTICE_CATEGORY_SHORT_LABELS[option]}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="notice-title" className={labelClass}>
              Title
            </label>
            <input
              id="notice-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                isClub
                  ? "e.g. Cultural fest auditions this week"
                  : "e.g. Friday's DBMS class moved to Lab 3"
              }
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

          {/* Class/Lab extras: one optional file attachment (drag & drop) */}
          {!isClub ? (
            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>
                File <span className="font-normal text-slate-400">(optional)</span>
              </span>
              <label
                htmlFor="notice-file"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const dropped = e.dataTransfer.files?.[0];
                  if (dropped) acceptFile(dropped);
                }}
                className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-4 text-center text-sm font-semibold text-primary-dark transition-colors duration-200 ${
                  dragging
                    ? "border-primary bg-primary-light"
                    : "border-primary/40 bg-white/60 hover:border-primary/70 hover:bg-white/80"
                }`}
              >
                <Paperclip className="h-4 w-4" />
                {file
                  ? `Selected: ${file.name}`
                  : initial?.fileName
                    ? `Replace: ${initial.fileName}`
                    : "Drop a file here, or click to browse…"}
              </label>
              <input
                id="notice-file"
                type="file"
                onChange={pickFile}
                disabled={busy}
                className="sr-only"
              />
            </div>
          ) : null}

          {/* Club extras: image + safe link */}
          {isClub ? (
            <>
              <div className="flex flex-col gap-1.5">
                <span className={labelClass}>
                  Image <span className="font-normal text-slate-400">(optional)</span>
                </span>
                {previewSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewSrc}
                    alt="Notice image preview"
                    className="h-36 w-full rounded-xl object-cover shadow-sm ring-1 ring-slate-200"
                  />
                ) : null}
                <label
                  htmlFor="notice-image"
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-white/60 px-4 py-3 text-sm font-semibold text-primary-dark transition-colors duration-200 hover:border-primary/70 hover:bg-white/80"
                >
                  <ImagePlus className="h-4 w-4" />
                  {imageFile
                    ? `Selected: ${imageFile.name}`
                    : initial?.imageUrl
                      ? "Replace the current image…"
                      : "Choose an image…"}
                </label>
                <input
                  id="notice-image"
                  type="file"
                  accept="image/*"
                  onChange={pickImage}
                  disabled={busy}
                  className="sr-only"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="notice-link" className={labelClass}>
                  Link <span className="font-normal text-slate-400">(optional, safe http/https only)</span>
                </label>
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="notice-link"
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://…"
                    disabled={busy}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="notice-link-label" className={labelClass}>
                  Link label <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  id="notice-link-label"
                  type="text"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  placeholder="e.g. Register here"
                  disabled={busy}
                  className={inputClass}
                />
              </div>
            </>
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
    </div>,
    document.body
  );
}

/** Maps an API notice to the frontend Notice shape (camelCase). */
export function toNotice(api: ApiNotice): Notice {
  return {
    id: api.id,
    category: api.category,
    title: api.title,
    body: api.body,
    postedAt: api.created_at,
    postedById: api.posted_by,
    postedByName: api.posted_by_name,
    department: api.department ?? "",
    imageUrl: api.image,
    linkUrl: api.link_url,
    linkLabel: api.link_label,
    fileUrl: api.file,
    fileName: api.file_name,
  };
}
