"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, KeyRound, Mail, ShieldCheck } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { PasswordField, PRIMARY_BTN, TextField } from "@/components/AuthField";
import { apiRequest, ApiError, firstErrorMessage } from "@/lib/api";

interface ResetRequestResponse {
  detail: string;
  uidb64?: string;
  token?: string;
}

interface ResetConfirmResponse {
  detail: string;
}

const INFO_PANEL =
  "flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-sm font-medium text-indigo-900";

/**
 * Forgot-password flow in two steps: request a reset link for an email or
 * student ID, then set a new password with the reset code. In development
 * the API returns the code directly (no email server), which this page
 * shows and pre-fills — in production the same code arrives by email.
 */
export default function ResetPasswordPage() {
  // Step 1 — request
  const [identifier, setIdentifier] = useState("");
  // Step 2 — confirm (pre-filled from the dev response when available)
  const [uidb64, setUidb64] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [done, setDone] = useState(false);

  async function handleRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await apiRequest<ResetRequestResponse>("/auth/password-reset/", {
        method: "POST",
        body: JSON.stringify({ identifier }),
      });
      if (data.uidb64 && data.token) {
        setUidb64(data.uidb64);
        setToken(data.token);
      }
      setRequested(true);
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

  async function handleConfirm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest<ResetConfirmResponse>("/auth/password-reset/confirm/", {
        method: "POST",
        body: JSON.stringify({ uidb64, token, new_password: newPassword, confirm_password: confirmPassword }),
      });
      setDone(true);
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
      title={done ? "Password updated" : "Reset your password"}
      subtitle={
        done
          ? "You can now sign in with your new password."
          : requested
            ? "Almost there — set a new password for your account."
            : "Enter your student email or ID and we'll start the reset."
      }
      footer={
        <Link
          href="/login"
          className="font-semibold text-[#8A3FA0] transition-colors duration-200 hover:text-[#6E2F85] hover:underline"
        >
          Back to login
        </Link>
      }
    >
      {done ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success-light text-success shadow-card">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <p className="text-sm text-slate-700">
            Your password has been saved. Sign in with your new password.
          </p>
          <Link href="/login" className={`${PRIMARY_BTN} w-auto px-8`}>
            Go to Login
          </Link>
        </div>
      ) : requested ? (
        <form className="space-y-4" onSubmit={handleConfirm}>
          <div className={INFO_PANEL}>
            <ShieldCheck className="h-5 w-5 shrink-0 text-[#4B3F94]" />
            <p>
              If an account exists with that email or ID, a reset link has been
              generated.
            </p>
          </div>

          {token ? (
            <div className="rounded-xl border border-dashed border-[#4B3F94]/40 bg-white px-4 py-3">
              <p className="text-xs font-semibold tracking-wide text-[#8A3FA0] uppercase">
                Dev only — reset code
              </p>
              <p className="mt-1 break-all font-mono text-xs leading-relaxed text-slate-700">
                {uidb64}:{token}
              </p>
              <p className="mt-1.5 text-[11px] text-slate-500">
                No email server in development, so the code is shown here. It is
                pre-filled below.
              </p>
            </div>
          ) : null}

          <TextField
            label="Reset code (ID)"
            id="reset-uid"
            icon={KeyRound}
            type="text"
            value={uidb64}
            onChange={(e) => setUidb64(e.target.value)}
            placeholder="Reset code"
            required
          />
          <TextField
            label="Reset code (token)"
            id="reset-token"
            icon={KeyRound}
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Reset token"
            required
          />
          <PasswordField
            label="New Password"
            id="reset-new-password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
          <PasswordField
            label="Confirm New Password"
            id="reset-confirm-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
          />

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
            >
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={submitting} className={PRIMARY_BTN}>
            {submitting ? "Saving…" : "Set New Password"}
          </button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={handleRequest}>
          <TextField
            label="Student Email or ID"
            id="reset-identifier"
            icon={Mail}
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="student@university.edu or ID"
            autoComplete="username"
            required
          />

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
            >
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={submitting} className={PRIMARY_BTN}>
            {submitting ? "Sending…" : "Send Reset Link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
