// Client-side session helpers. The auth token and student profile live in
// localStorage when "Remember me" is checked, sessionStorage otherwise.
//
// A tiny pub/sub keeps UI in sync with the stored session: login, logout,
// profile saves and the live /auth/me/ poller all notify subscribers, so the
// navbar, profile page and role-gated sections update without a reload.

export interface Student {
  id: number;
  full_name: string;
  email: string;
  student_id: string;
  phone: string;
  department?: string;
  profile_picture?: string | null;
  /** Class Representative — granted by an admin; required to book rooms
      and to post/update class & lab notices. */
  is_cr?: boolean;
  /** Librarian — granted by an admin; required to manage the library's
      book list (add/upload/update). */
  is_librarian?: boolean;
  /** Club Member — granted by an admin; required to post and update Club
      notices (with images and links). */
  is_club_member?: boolean;
  /** Bus Tracker role: "student" (default) or "driver" (granted by an admin;
      drivers share their live bus location). */
  role?: "student" | "driver";
  /** The bus route this driver is assigned to (drivers only). */
  assigned_route?: string | null;
}

export interface AuthResponse {
  token: string;
  student: Student;
}

const TOKEN_KEY = "campusease_token";
const STUDENT_KEY = "campusease_student";

type SessionListener = () => void;

const sessionListeners = new Set<SessionListener>();

/**
 * Subscribe to stored-session changes (login, logout, profile saves and live
 * backend sync). Returns an unsubscribe function. Safe to call on the server
 * (the set is never populated there).
 */
export function subscribeSession(listener: SessionListener): () => void {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

function notifySessionChanged() {
  for (const listener of sessionListeners) listener();
}

function readFrom(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

export function getToken(): string | null {
  return readFrom(TOKEN_KEY);
}

export function getStudent(): Student | null {
  const raw = readFrom(STUDENT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Student;
  } catch {
    return null;
  }
}

export function setSession(student: Student, token: string, remember: boolean) {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(STUDENT_KEY, JSON.stringify(student));
  notifySessionChanged();
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(STUDENT_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(STUDENT_KEY);
  notifySessionChanged();
}

/** Authorization header for the stored token, if any. */
export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Token ${token}` } : {};
}

/**
 * Replace the stored student profile (e.g. after a profile update or a live
 * /auth/me/ sync). No-op when nothing changed, so subscribers are only told
 * about real backend changes.
 */
export function updateStoredStudent(student: Student) {
  const token = getToken();
  if (!token) return;
  const storage =
    localStorage.getItem(TOKEN_KEY) !== null ? localStorage : sessionStorage;
  const next = JSON.stringify(student);
  if (storage.getItem(STUDENT_KEY) === next) return;
  storage.setItem(STUDENT_KEY, next);
  notifySessionChanged();
}
