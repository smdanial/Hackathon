/* ------------------------------------------------------------------ *
 *  Dummy data for the Profile page — swap for real user API later.    *
 * ------------------------------------------------------------------ */

/** Editable profile fields (Student ID is intentionally read-only). */
export interface StudentProfile {
  name: string;
  email: string;
  studentId: string;
  department: string;
  phone: string;
  bio: string;
}

/** Seed values shown on first load. */
export const SEED_PROFILE: StudentProfile = {
  name: "Sojib Islam",
  email: "student@university.edu",
  studentId: "CS 2607014",
  department: "Computer Science & Engineering",
  phone: "+880 1XXXXXXXXX",
  bio: "Final-year CSE student. Loves building things, reading sci-fi, and exploring the campus food scene.",
};
