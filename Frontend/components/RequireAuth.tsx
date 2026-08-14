"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { apiRequest, ApiError } from "@/lib/api";
import { authHeaders, clearSession, getToken, type Student } from "@/lib/auth";

/**
 * Gate for pages that require sign-in. Redirects to /login when there is no
 * session, and only renders its children once the stored token has been
 * confirmed by the backend — so signed-out visitors never see a flash of
 * protected content and revoked tokens (e.g. logged out elsewhere) bounce
 * back to the login page.
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  // Token presence is synchronous, so the client's first render already knows
  // whether the gate will pass (no content flash for signed-in users; the
  // server's first paint is always the loader, avoiding hydration mismatch).
  const [authed, setAuthed] = useState(() => getToken() !== null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    // Verify the stored token is still valid. A 401 means it was revoked, so
    // drop the local session and redirect; network hiccups let the user in
    // (the pages have their own error handling) rather than locking them out.
    apiRequest<Student>("/auth/me/", { headers: authHeaders() })
      .then(() => {
        if (!cancelled) setAuthed(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          clearSession();
          router.replace("/login");
        } else {
          setAuthed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!authed) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-zinc-500">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
        <p className="text-sm font-medium">Checking your session…</p>
      </div>
    );
  }

  return <>{children}</>;
}
