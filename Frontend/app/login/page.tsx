"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { KeyRound, Mail } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { PasswordField, PRIMARY_BTN, TextField } from "@/components/AuthField";
import GoogleIcon from "@/components/GoogleIcon";
import { apiRequest, ApiError, firstErrorMessage } from "@/lib/api";
import { setSession, type AuthResponse } from "@/lib/auth";

const SECONDARY_BTN =
  "flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/70 py-2.5 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-slate-300 hover:bg-white active:scale-[0.98]";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await apiRequest<AuthResponse>("/auth/login/", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });
      setSession(data.student, data.token, remember);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? firstErrorMessage(err.body)
          : "Unable to reach the server. Is the backend running?"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Log in to access your student workspace"
      footer={
        <>
          <span className="text-slate-600">New student? </span>
          <Link
            href="/signup"
            className="font-semibold text-ink transition-colors duration-200 hover:text-zinc-600 hover:underline"
          >
            Create your account
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextField
          label="Student Email or ID"
          id="login-identifier"
          icon={Mail}
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="student@university.edu or ID"
          autoComplete="username"
          required
        />
        <PasswordField
          label="Password"
          id="login-password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between gap-3 pt-1">
          <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-primary"
            />
            Remember me
          </label>
          <Link
            href="/reset-password"
            className="text-sm font-medium text-ink transition-colors duration-200 hover:text-zinc-600 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          >
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={submitting} className={PRIMARY_BTN}>
          {submitting ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium tracking-wider text-slate-400 uppercase">
          Or continue with
        </span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" className={SECONDARY_BTN}>
          <KeyRound className="h-4 w-4 text-primary-dark" />
          Niter EMS ID
        </button>
        <button type="button" className={SECONDARY_BTN}>
          <GoogleIcon className="h-4 w-4" />
          Google
        </button>
      </div>
    </AuthShell>
  );
}
