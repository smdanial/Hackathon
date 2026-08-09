// Client-side session helpers. The auth token and student profile live in
// localStorage when "Remember me" is checked, sessionStorage otherwise.

export interface Student {
  id: number;
  full_name: string;
  email: string;
  student_id: string;
  phone: string;
  department?: string;
  bio?: string;
  profile_picture?: string | null;
}

export interface AuthResponse {
  token: string;
  student: Student;
}

const TOKEN_KEY = "campusease_token";
const STUDENT_KEY = "campusease_student";

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
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(STUDENT_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(STUDENT_KEY);
}

/** Authorization header for the stored token, if any. */
export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Token ${token}` } : {};
}

/** Replace the stored student profile (e.g. after a profile update). */
export function updateStoredStudent(student: Student) {
  const token = getToken();
  if (!token) return;
  const storage = localStorage.getItem(TOKEN_KEY) !== null ? localStorage : sessionStorage;
  storage.setItem(STUDENT_KEY, JSON.stringify(student));
}
