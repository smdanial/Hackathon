"use client";

import { useState } from "react";
import { Bell, ChevronRight } from "lucide-react";
import NoticeModal from "@/components/NoticeModal";
import { currentStudent } from "@/lib/currentStudent";
import {
  NOTICE_CATEGORY_SHORT_LABELS,
  formatNoticeTimestamp,
  getAllNotices,
  getNoticesByCategory,
} from "@/lib/mockNotices";
import type { Notice, NoticeCategory } from "@/lib/mockNotices";

type Filter = "all" | NoticeCategory;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "class", label: "Class" },
  { value: "club", label: "Club" },
  { value: "lab", label: "Lab" },
  { value: "ems", label: "EMS" },
];

/** Badge tint for each segment, matching the app's small-accent style. */
const CATEGORY_BADGES: Record<NoticeCategory, string> = {
  class: "bg-primary-light text-primary-dark",
  club: "bg-accent-light text-accent-dark",
  lab: "bg-emerald-100 text-emerald-600",
  ems: "bg-sky-100 text-sky-600",
};

/** Interactive Notices board: segment filter + list, opens the shared modal. */
export default function NoticesBoard() {
  const [filter, setFilter] = useState<Filter>("all");
  const [modalCategory, setModalCategory] = useState<NoticeCategory | null>(
    null
  );

  const notices: Notice[] =
    filter === "all" ? getAllNotices() : getNoticesByCategory(filter);

  const emptyText =
    filter === "all"
      ? "No notices posted yet."
      : `No ${NOTICE_CATEGORY_SHORT_LABELS[filter]} notices posted yet.`;

  return (
    <section>
      <header className="mb-6 flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-light text-primary-dark shadow-card">
          <Bell className="h-7 w-7" />
        </span>
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink sm:text-4xl">
            Notices
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-600">
            For {currentStudent.className} · {currentStudent.labGroup} ·{" "}
            {currentStudent.club}
          </p>
        </div>
      </header>

      {/* Segment filter */}
      <div
        className="mb-6 flex flex-wrap gap-2"
        role="group"
        aria-label="Filter notices"
      >
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              filter === value
                ? "bg-primary text-ink shadow-soft"
                : "bg-card text-slate-700 hover:bg-accent-light hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Notice list — clicking a notice opens the modal for its segment */}
      {notices.length === 0 ? (
        <p className="rounded-2xl bg-card px-6 py-12 text-center text-sm font-medium text-slate-600 shadow-card">
          {emptyText}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {notices.map((notice) => (
            <li key={notice.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setModalCategory(notice.category)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setModalCategory(notice.category);
                  }
                }}
                className="group flex w-full cursor-pointer flex-col gap-2 rounded-2xl bg-card p-5 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${CATEGORY_BADGES[notice.category]}`}
                  >
                    {NOTICE_CATEGORY_SHORT_LABELS[notice.category]}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary-dark" />
                </div>
                <h2 className="font-heading text-base font-semibold text-ink sm:text-lg">
                  {notice.title}
                </h2>
                <p className="text-sm leading-relaxed text-slate-700 line-clamp-2">
                  {notice.body}
                </p>
                <time
                  dateTime={notice.postedAt}
                  className="text-xs font-medium text-slate-500"
                >
                  {formatNoticeTimestamp(notice.postedAt)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modalCategory ? (
        <NoticeModal
          category={modalCategory}
          onClose={() => setModalCategory(null)}
        />
      ) : null}
    </section>
  );
}
