"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

type Step = "request" | "emailed" | "confirm" | "done";

const INFO_PANEL =
  "flex items-center gap-3 rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-medium text-slate-800 backdrop-blur-sm";

/**
 * Forgot-password flow. Step 1 requests a reset for an email or student ID —
 * the reset link is emailed via Resend. Step 2 is reached by clicking that
 * emailed link (/reset-password?uidb64=…&token=…), where the user just sets a
 * new password. When no email provider is configured (or a send fails in
 * DEBUG), the API returns the code directly and this page shows it pre-filled
 * as a dev fallback.
 */
export default function ResetPasswordForm() {
  // Arriving from the emailed link? Its params carry the reset code.
  const searchParams = useSearchParams();
  const urlUidb64 = searchParams.get("uidb64");
  const urlToken = searchParams.get("token");
  const fromLink = Boolean(urlUidb64 && urlToken);

  const [identifier, setIdentifier] = useState("");
  const [uidb64, setUidb64] = useState(urlUidb64 ?? "");
  const [token, setToken] = useState(urlToken ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<Step>(fromLink ? "confirm" : "request");

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
        // Dev fallback: no email was sent — show the code so the flow can
        // still be completed locally.
        setUidb64(data.uidb64);
        setToken(data.token);
        setStep("confirm");
      } else {
        setStep("emailed");
      }
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
        body: JSON.stringify({
          uidb64,
          token,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      setStep("done");
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

  const subtitle =
    step === "done"
      ? "You can now sign in with your new password."
      : step === "emailed"
        ? "Almost there — check your inbox."
        : step === "confirm"
          ? "Set a new password for your account."
          : "Enter your student email or ID and we'll start the reset.";

  return (
    <AuthShell
      title={
        step === "done"
          ? "Password updated"
          : step === "emailed"
            ? "Check your email"
            : "Reset your password"
      }
      subtitle={subtitle}
      footer={
        <Link
          href="/login"
          className="font-semibold text-ink transition-colors duration-200 hover:text-zinc-600 hover:underline"
        >
          Back to login
        </Link>
      }
    >
      {step === "done" ? (
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
      ) : step === "emailed" ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light text-primary-dark shadow-card">
            <Mail className="h-8 w-8" />
          </span>
          <p className="text-sm leading-relaxed text-slate-700">
            If an account exists with that email or ID, we&apos;ve emailed a
            password reset link. It expires after a few days — check your inbox
            (and spam folder) and click the link to set a new password.
          </p>
          <button
            type="button"
            onClick={() => setStep("request")}
            className={`${PRIMARY_BTN} w-auto px-8`}
          >
            Send another link
          </button>
        </div>
      ) : step === "confirm" ? (
        <form className="space-y-4" onSubmit={handleConfirm}>
          {!fromLink ? (
            <div className={INFO_PANEL}>
              <ShieldCheck className="h-5 w-5 shrink-0 text-primary-dark" />
              <p>
                If an account exists with that email or ID, a reset link has
                been generated.
              </p>
            </div>
          ) : (
            <div className={INFO_PANEL}>
              <ShieldCheck className="h-5 w-5 shrink-0 text-primary-dark" />
              <p>Enter your new password below.</p>
            </div>
          )}

          {!fromLink ? (
            <div className="rounded-xl border border-dashed border-primary/40 bg-white/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                Dev only — reset code
              </p>
              <p className="mt-1 break-all font-mono text-xs leading-relaxed text-slate-700">
                {uidb64}:{token}
              </p>
              <p className="mt-1.5 text-[11px] text-slate-500">
                No email could be sent in this environment, so the code is shown
                here. It is pre-filled below.
              </p>
            </div>
          ) : null}

          {!fromLink ? (
            <>
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
            </>
          ) : null}

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
