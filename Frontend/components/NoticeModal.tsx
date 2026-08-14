"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ClipboardList,
  FlaskConical,
  GraduationCap,
  Link2,
  Palette,
  Paperclip,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  NOTICE_CATEGORY_LABELS,
  formatNoticeTimestamp,
} from "@/lib/mockNotices";
import type { Notice, NoticeCategory } from "@/lib/mockNotices";
import { isSafeLink } from "@/components/NoticeFormModal";

/** Icon shown in the modal header for each segment. */
const CATEGORY_ICONS: Record<NoticeCategory, LucideIcon> = {
  class: GraduationCap,
  club: Palette,
  lab: FlaskConical,
  ems: ClipboardList,
};

interface NoticeModalProps {
  /** The segment whose notices this modal shows. */
  category: NoticeCategory;
  /** The notices for that segment, newest first. */
  notices: Notice[];
  onClose: () => void;
}

/**
 * Shared modal listing every notice for one segment (class / club / lab / EMS),
 * newest first, with full posted timestamps. The notices are passed in by the
 * Notices page (which owns the API fetch).
 */
export default function NoticeModal({
  category,
  notices,
  onClose,
}: NoticeModalProps) {
  const Icon = CATEGORY_ICONS[category];

  // Keep the latest onClose without re-adding the listeners on every render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Close on Escape and scroll-lock the page body while the modal is open.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, []);

  // Rendered through a portal to <body> so the backdrop covers the whole
  // viewport — including the app shell's navbar — instead of being contained
  // by the page's stacking context.
  return createPortal(
    <div
      className="fixed inset-0 z-[60] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={NOTICE_CATEGORY_LABELS[category]}
    >
      {/* Backdrop — clicking it closes the modal */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centers the card when it fits, scrolls when it is taller than the
          screen — the popup always stays fully visible and reachable. */}
      <div className="relative flex min-h-full items-center justify-center p-4">
      <div className="relative flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl glass-strong shadow-lift ring-1 ring-white/60">
        <div className="flex items-center justify-between gap-3 border-b border-white/50 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-dark">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-heading text-lg font-bold leading-tight text-ink">
                {NOTICE_CATEGORY_LABELS[category]}
              </h2>
              <p className="text-xs font-medium text-slate-600">
                {notices.length} {notices.length === 1 ? "notice" : "notices"}
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

        <div className="flex flex-col gap-3 overflow-y-auto p-4">
          {notices.length === 0 ? (
            <p className="rounded-xl bg-white/60 px-4 py-8 text-center text-sm font-medium text-slate-600">
              No notices in this segment yet.
            </p>
          ) : (
            notices.map((notice) => (
              <article
                key={notice.id}
                className="rounded-xl bg-white/70 p-4 shadow-card backdrop-blur-sm transition-colors duration-200 hover:bg-white/90"
              >
                {notice.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={notice.imageUrl}
                    alt=""
                    className="mt-3 max-h-56 w-full rounded-lg object-cover shadow-sm ring-1 ring-slate-200"
                  />
                ) : null}
                <h3 className="font-heading text-base font-semibold text-ink">
                  {notice.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                  {notice.body}
                </p>
                {notice.linkUrl && isSafeLink(notice.linkUrl) ? (
                  <a
                    href={notice.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent-light px-3.5 py-1.5 text-xs font-semibold text-accent-dark shadow-sm transition-colors duration-200 hover:bg-accent hover:text-white"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    {notice.linkLabel || "Open link"}
                  </a>
                ) : null}
                {notice.fileUrl ? (
                  <a
                    href={notice.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3.5 py-1.5 text-xs font-semibold text-sky-700 shadow-sm transition-colors duration-200 hover:bg-sky-200 hover:text-sky-800"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    {notice.fileName || "Download file"}
                  </a>
                ) : null}
                <time
                  dateTime={notice.postedAt}
                  className="mt-3 block text-xs font-medium text-slate-500"
                >
                  {formatNoticeTimestamp(notice.postedAt)}
                </time>
              </article>
            ))
          )}
        </div>
      </div>
      </div>
    </div>,
    document.body
  );
}
