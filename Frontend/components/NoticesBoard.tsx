"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  ChevronRight,
  GraduationCap,
  Link2,
  Loader2,
  Paperclip,
  Pencil,
  Plus,
} from "lucide-react";
import NoticeFormModal, { isSafeLink, toNotice } from "@/components/NoticeFormModal";
import NoticeModal from "@/components/NoticeModal";
import { apiRequest, ApiError, firstErrorMessage } from "@/lib/api";
import { authHeaders, getToken } from "@/lib/auth";
import type { Student } from "@/lib/auth";
import { useSession } from "@/lib/useSession";
import {
  NOTICE_CATEGORY_SHORT_LABELS,
  formatNoticeTimestamp,
} from "@/lib/mockNotices";
import type { Notice, NoticeCategory } from "@/lib/mockNotices";

type Filter = "all" | NoticeCategory;

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

/**
 * Notices board backed by the Django API: everyone reads; CRs add and update
 * Class/Lab notices, Club Members add and update Club notices (with images
 * and links). Filter pills + the category modal work on the fetched list.
 */
export default function NoticesBoard() {
  // Bumps when the stored session changes — re-fetches the role + department
  // and the notice feed so admin changes land without a reload.
  const { version: sessionVersion } = useSession();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCr, setIsCr] = useState(false);
  const [isClubMember, setIsClubMember] = useState(false);
  // The signed-in student's department — class/lab notices are scoped to it.
  const [department, setDepartment] = useState<string | null>(null);

  const [filter, setFilter] = useState<Filter>("all");
  const [modalCategory, setModalCategory] = useState<NoticeCategory | null>(
    null
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

  const loadNotices = useCallback(
    (url = "/notices/") => apiRequest<ApiNotice[]>(url),
    []
  );

  useEffect(() => {
    let cancelled = false;
    // The signed-in student's role + department — drives the add/edit
    // actions and the department-scoped notice feed.
    if (getToken()) {
      apiRequest<Student>("/auth/me/", { headers: authHeaders() })
        .then((me) => {
          if (cancelled) return;
          setIsCr(Boolean(me.is_cr));
          setIsClubMember(Boolean(me.is_club_member));
          const dept = me.department?.trim() ?? "";
          setDepartment(dept || null);
          // Class/lab notices are department-scoped: fetch only this
          // department's notices (campus-wide club/EMS always included).
          const url = dept
            ? `/notices/?department=${encodeURIComponent(dept)}`
            : "/notices/";
          return apiRequest<ApiNotice[]>(url);
        })
        .then((data) => {
          if (cancelled || !data) return;
          setNotices(data.map(toNotice));
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          if (err instanceof ApiError && err.status === 401) {
            // Stale token — fall back to the anonymous campus-wide feed.
            apiRequest<ApiNotice[]>("/notices/")
              .then((data) => {
                if (!cancelled) setNotices(data.map(toNotice));
              })
              .catch(() => {
                // Leave the list empty; the error state below is not shown
                // because this is a background fallback.
              });
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      // Anonymous visitor — only campus-wide (club/EMS) notices.
      loadNotices()
        .then((data) => {
          if (!cancelled) setNotices(data.map(toNotice));
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setError(
              err instanceof ApiError
                ? firstErrorMessage(err.body)
                : "Could not load notices. Is the backend running?"
            );
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [loadNotices, sessionVersion]);

  const refresh = useCallback(() => {
    const dept = department;
    const url = dept
      ? `/notices/?department=${encodeURIComponent(dept)}`
      : "/notices/";
    loadNotices(url)
      .then((data) => setNotices(data.map(toNotice)))
      .catch(() => {
        // Keep the current list on a background refresh failure.
      });
  }, [loadNotices, department]);

  const handleSaved = useCallback(
    (saved: Notice) => {
      setNotices((current) => {
        const exists = current.some((n) => n.id === saved.id);
        return exists
          ? current.map((n) => (n.id === saved.id ? saved : n))
          : [saved, ...current];
      });
      refresh();
    },
    [refresh]
  );

  // Categories the signed-in roles may manage (add/edit).
  const canManageCategory = (category: NoticeCategory): boolean =>
    category === "club"
      ? isClubMember
      : (category === "class" || category === "lab") && isCr;

  const allowedCategories = (["class", "club", "lab"] as NoticeCategory[]).filter(
    (category) => canManageCategory(category)
  );
  const canAdd = allowedCategories.length > 0;

  const visible =
    filter === "all"
      ? notices
      : notices.filter((notice) => notice.category === filter);

  const emptyText =
    filter === "all"
      ? "No notices posted yet."
      : `No ${NOTICE_CATEGORY_SHORT_LABELS[filter]} notices posted yet.`;

  const openAdd = () => {
    setEditingNotice(null);
    setFormOpen(true);
  };

  const openEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setFormOpen(true);
  };

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-light text-primary-dark shadow-card">
            <Bell className="h-7 w-7" />
          </span>
          <div>
            <h1 className="font-heading text-3xl font-bold text-ink sm:text-4xl">
              Notices
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-600">
              Class, club, lab and EMS updates — all in one place.
            </p>
          </div>
        </div>

        {canAdd ? (
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:bg-primary-dark hover:text-white active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Add Notice
          </button>
        ) : null}
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
                ? "bg-primary text-white shadow-soft"
                : "glass text-slate-700 hover:bg-accent-light hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-primary-dark" />
          <p className="text-sm font-medium">Loading notices…</p>
        </div>
      ) : error ? (
        <div className="mx-auto max-w-xl rounded-3xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
          <Bell className="mx-auto h-8 w-8 text-rose-400" />
          <p className="mt-2 text-sm font-medium text-rose-700">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-dark"
          >
            Try again
          </button>
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl glass px-6 py-12 text-center text-sm font-medium text-slate-600 shadow-card">
          {emptyText}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {visible.map((notice) => (
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
                className="group flex w-full cursor-pointer flex-col gap-2 rounded-2xl glass p-5 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${CATEGORY_BADGES[notice.category]}`}
                  >
                    {NOTICE_CATEGORY_SHORT_LABELS[notice.category]}
                  </span>
                  <div className="flex items-center gap-2">
                    {/* Role-gated edit for manageable notices */}
                    {canManageCategory(notice.category) ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(notice);
                        }}
                        aria-label={`Edit ${notice.title}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-primary-light hover:text-primary-dark"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    ) : null}
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary-dark" />
                  </div>
                </div>

                {/* Club image thumbnail */}
                {notice.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={notice.imageUrl}
                    alt=""
                    className="h-40 w-full rounded-xl object-cover shadow-sm ring-1 ring-white/60"
                  />
                ) : null}

                <h2 className="font-heading text-base font-semibold text-ink sm:text-lg">
                  {notice.title}
                </h2>
                <p className="text-sm leading-relaxed text-slate-700 line-clamp-2">
                  {notice.body}
                </p>

                {/* Club link — opens in a new tab without opening the modal */}
                {notice.linkUrl && isSafeLink(notice.linkUrl) ? (
                  <a
                    href={notice.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-light px-3.5 py-1.5 text-xs font-semibold text-accent-dark shadow-sm transition-colors duration-200 hover:bg-accent hover:text-white"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    {notice.linkLabel || "Open link"}
                  </a>
                ) : null}

                {/* Class/Lab file attachment — opens without opening the modal */}
                {notice.fileUrl ? (
                  <a
                    href={notice.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex w-fit items-center gap-1.5 rounded-full bg-sky-100 px-3.5 py-1.5 text-xs font-semibold text-sky-700 shadow-sm transition-colors duration-200 hover:bg-sky-200 hover:text-sky-800"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    {notice.fileName || "Download file"}
                  </a>
                ) : null}

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
                  <time dateTime={notice.postedAt}>
                    {formatNoticeTimestamp(notice.postedAt)}
                  </time>
                  {notice.department ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 font-semibold text-slate-600 shadow-sm">
                      <GraduationCap className="h-3 w-3" />
                      {notice.department}
                    </span>
                  ) : null}
                  {notice.postedByName ? (
                    <span className="inline-flex items-center gap-1">
                      <Bell className="h-3 w-3" />
                      Posted by {notice.postedByName}
                    </span>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modalCategory ? (
        <NoticeModal
          category={modalCategory}
          notices={notices.filter((n) => n.category === modalCategory)}
          onClose={() => setModalCategory(null)}
        />
      ) : null}

      {formOpen ? (
        <NoticeFormModal
          initial={editingNotice}
          allowedCategories={allowedCategories}
          onClose={() => setFormOpen(false)}
          onSaved={handleSaved}
        />
      ) : null}
    </section>
  );
}
