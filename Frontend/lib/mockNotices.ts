// Types, labels and formatters for the Notices feature.
// The notice list itself is fetched from the Django API (`/api/notices/`).

export type NoticeCategory = "class" | "club" | "lab" | "ems";

export interface Notice {
  id: number;
  category: NoticeCategory;
  title: string;
  body: string;
  /** Exact ISO timestamp of when the notice was posted. */
  postedAt: string;
  /** Id of the student who posted it (null for seeded/admin notices). */
  postedById: number | null;
  postedByName: string | null;
  /** Department of Class/Lab notices (empty for campus-wide club/EMS). */
  department: string;
}

/** Full display labels for each notice segment. */
export const NOTICE_CATEGORY_LABELS: Record<NoticeCategory, string> = {
  class: "Class Notices",
  club: "Club Notices",
  lab: "Lab Notices",
  ems: "EMS Notices",
};

/** Short labels used for filter pills and badges. */
export const NOTICE_CATEGORY_SHORT_LABELS: Record<NoticeCategory, string> = {
  class: "Class",
  club: "Club",
  lab: "Lab",
  ems: "EMS",
};

/** Formats an ISO timestamp for display, e.g. "Aug 8, 2026, 10:42 AM". */
export function formatNoticeTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
