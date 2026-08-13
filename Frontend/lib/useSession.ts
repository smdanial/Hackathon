"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
  authHeaders,
  getStudent,
  getToken,
  subscribeSession,
  updateStoredStudent,
  type Student,
} from "@/lib/auth";

/**
 * Live view of the stored session.
 *
 * Returns the stored student plus a `version` that increments whenever the
 * stored session actually changes (login, logout, profile save, or the poller
 * finding different backend data). Consumers key effects on `version` to
 * re-fetch when the backend data changed — the initial hydrate does NOT bump
 * the version, so mounted pages don't double-fetch on load.
 */
export function useSession(): { student: Student | null; version: number } {
  const [student, setStudent] = useState<Student | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    // Hydrate once after mount without bumping version (the server paint is
    // always the logged-out shell, so reading storage after mount avoids a
    // hydration mismatch).
    const hydrate = window.setTimeout(() => setStudent(getStudent()), 0);
    const unsubscribe = subscribeSession(() => {
      setStudent(getStudent());
      setVersion((v) => v + 1);
    });
    return () => {
      window.clearTimeout(hydrate);
      unsubscribe();
    };
  }, []);

  return { student, version };
}

/**
 * Live backend sync: while signed in, polls /auth/me/ every `intervalMs` and
 * writes the fresh profile into the stored session. `updateStoredStudent`
 * only notifies subscribers when the data actually changed, so every
 * component subscribed to the session re-renders within one poll interval of
 * an admin granting/revoking a role or editing profile data — no reload, no
 * re-login needed.
 */
export function useSessionSync(intervalMs = 15000) {
  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const me = await apiRequest<Student>("/auth/me/", {
          headers: authHeaders(),
        });
        if (!cancelled) updateStoredStudent(me);
      } catch {
        // Offline or revoked token — leave the stored session as-is. The
        // next successful poll (or RequireAuth on the next navigation)
        // catches up.
      }
    };

    // Poll immediately, then on an interval.
    void poll();
    const timer = window.setInterval(poll, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [intervalMs]);
}
