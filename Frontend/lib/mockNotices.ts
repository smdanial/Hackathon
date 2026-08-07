// Mock data for the Notices feature.
// `postedAt` values are exact ISO timestamps — they are formatted for display
// at render time (see formatNoticeTimestamp), never stored pre-formatted.

export type NoticeCategory = "class" | "club" | "lab" | "ems";

export interface Notice {
  id: string;
  category: NoticeCategory;
  title: string;
  body: string;
  /** Exact ISO timestamp of when the notice was posted. */
  postedAt: string;
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

export const NOTICES: Notice[] = [
  // ---- Class notices ----
  {
    id: "class-001",
    category: "class",
    title: "Midterm syllabus trimmed for CSE-301",
    body: "The course teacher has trimmed Unit 5 (Graph Algorithms) from the CSE-301 midterm syllabus. The exam will now cover Units 1–4 only. Updated slides are on the class portal.",
    postedAt: "2026-08-07T09:30:00+06:00",
  },
  {
    id: "class-002",
    category: "class",
    title: "Friday's DBMS class moved to Lab 3",
    body: "Tomorrow's Database Management Systems lecture (CSE-305) will be held in Lab 3 instead of Room 204. Same time, 11:00 AM – 12:30 PM.",
    postedAt: "2026-08-05T14:15:00+06:00",
  },
  {
    id: "class-003",
    category: "class",
    title: "Attendance makeup form for July 31",
    body: "Students absent on July 31 can submit a makeup form at the department office by Thursday. Bring a signed note from your guardian or a doctor's prescription as applicable.",
    postedAt: "2026-07-29T11:00:00+06:00",
  },

  // ---- Club notices ----
  {
    id: "club-001",
    category: "club",
    title: "Inter-department programming contest",
    body: "Registrations are open for the annual inter-department programming contest. Team of three, free food and certificates for all participants. Register at the club booth or the online form.",
    postedAt: "2026-08-06T18:00:00+06:00",
  },
  {
    id: "club-002",
    category: "club",
    title: "Cultural fest audition call",
    body: "Auditions for the NITER cultural fest run all week in the auditorium. Singing, dance, drama and band slots are up for grabs. Bring your own instrument if needed.",
    postedAt: "2026-08-03T12:30:00+06:00",
  },
  {
    id: "club-003",
    category: "club",
    title: "Robotics club weekly meetup",
    body: "This week's meetup is on the line-follower bot chassis. Bring your kits — we'll assemble and test on the track in the robotics lab.",
    postedAt: "2026-07-25T17:45:00+06:00",
  },

  // ---- Lab notices ----
  {
    id: "lab-001",
    category: "lab",
    title: "Physics lab report deadline",
    body: "The Experiment 4 (Vernier Callipers) report must be submitted to the physics lab assistant by Sunday. Late submissions lose 5 marks per day.",
    postedAt: "2026-08-04T10:00:00+06:00",
  },
  {
    id: "lab-002",
    category: "lab",
    title: "Lab Group B shifted to Lab 2",
    body: "From next week, Lab Group B's Digital Electronics sessions will take place in Lab 2 (ground floor) instead of Lab 5. Timetable is on the lab noticeboard.",
    postedAt: "2026-07-31T09:15:00+06:00",
  },
  {
    id: "lab-003",
    category: "lab",
    title: "Chemistry lab safety orientation",
    body: "Mandatory safety orientation for all first-time chemistry lab students this Friday, 3:00 PM, in the chemistry lab. Attendance will be recorded.",
    postedAt: "2026-07-27T13:00:00+06:00",
  },

  // ---- EMS (Exam Management System) notices ----
  {
    id: "ems-001",
    category: "ems",
    title: "Midterm exam schedule released",
    body: "The midterm exam schedule is now live on the Exam Management System. Download your individual seat plan and checklist before the exam week begins.",
    postedAt: "2026-08-08T10:42:00+06:00",
  },
  {
    id: "ems-002",
    category: "ems",
    title: "Seat plan released for CSE-301",
    body: "Seat plans for the CSE-301 midterm have been published. Check your roll number against the venue map in the EMS portal before exam day.",
    postedAt: "2026-08-07T16:20:00+06:00",
  },
  {
    id: "ems-003",
    category: "ems",
    title: "MATH-203 exam moved to August 20",
    body: "The MATH-203 (Linear Algebra) midterm has been rescheduled to August 20, 2:00 PM. The conflict with the lab viva has been resolved — the updated schedule is on EMS.",
    postedAt: "2026-08-06T08:45:00+06:00",
  },
  {
    id: "ems-004",
    category: "ems",
    title: "Admit cards available on EMS",
    body: "Admit cards for the midterm are now available to download from the Exam Management System. Print a copy and get it signed by your class teacher before August 14.",
    postedAt: "2026-08-02T11:30:00+06:00",
  },
];

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

/** All notices, newest first. */
export function getAllNotices(): Notice[] {
  return [...NOTICES].sort(
    (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  );
}

/** Notices for a single segment, newest first. */
export function getNoticesByCategory(category: NoticeCategory): Notice[] {
  return NOTICES.filter((notice) => notice.category === category).sort(
    (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  );
}
