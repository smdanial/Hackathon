"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { PasswordField, PRIMARY_BTN, TextField } from "@/components/AuthField";
import { apiRequest, ApiError, firstErrorMessage } from "@/lib/api";

interface ResetRequestResponse {
  detail: string;
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
 * new password.
 */
export default function ResetPasswordForm() {
  // Arriving from the emailed link? Its params carry the reset code.
  const searchParams = useSearchParams();
  const urlUidb64 = searchParams.get("uidb64");
  const urlToken = searchParams.get("token");
  const fromLink = Boolean(urlUidb64 && urlToken);

  const [identifier, setIdentifier] = useState("");
  const [uidb64] = useState(urlUidb64 ?? "");
  const [token] = useState(urlToken ?? "");
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
      await apiRequest<ResetRequestResponse>("/auth/password-reset/", {
        method: "POST",
        body: JSON.stringify({ identifier }),
      });
      // The reset link is emailed to the address on file (when an account
      // exists) — the user clicks it to reach the confirm step.
      setStep("emailed");
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
          <div className={INFO_PANEL}>
            <ShieldCheck className="h-5 w-5 shrink-0 text-primary-dark" />
            <p>Enter your new password below.</p>
          </div>

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
