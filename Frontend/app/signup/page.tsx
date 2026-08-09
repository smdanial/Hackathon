"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { IdCard, Mail, Phone, UserRound } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { PasswordField, PRIMARY_BTN, TextField } from "@/components/AuthField";
import { apiRequest, ApiError, firstErrorMessage } from "@/lib/api";
import { setSession, type AuthResponse } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await apiRequest<AuthResponse>("/auth/signup/", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,
          email,
          student_id: studentId,
          phone,
          password,
          confirm_password: confirmPassword,
        }),
      });
      setSession(data.student, data.token, false);
      router.push("/");
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
      title="Create Your Account"
      subtitle="Join your student workspace"
      footer={
        <>
          <span className="text-slate-600">Already have an account? </span>
          <Link
            href="/login"
            className="font-semibold text-[#8A3FA0] transition-colors duration-200 hover:text-[#6E2F85] hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextField
          label="Full Name"
          id="signup-name"
          icon={UserRound}
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your full name"
          autoComplete="name"
          required
        />
        <TextField
          label="Email"
          id="signup-email"
          icon={Mail}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="student@university.edu"
          autoComplete="email"
          required
        />
        <TextField
          label="Student ID"
          id="signup-student-id"
          icon={IdCard}
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="CS 2607014"
          autoComplete="off"
          required
        />
        <TextField
          label="Phone Number"
          id="signup-phone"
          icon={Phone}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+880 1XXXXXXXXX"
          autoComplete="tel"
          required
        />
        <PasswordField
          label="Password"
          id="signup-password"
          value={password}
          onChange={setPassword}
          placeholder="Create a password (min. 8 characters)"
          autoComplete="new-password"
        />
        <PasswordField
          label="Confirm Password"
          id="signup-confirm-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Re-enter your password"
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
          {submitting ? "Creating account…" : "Create Account"}
        </button>
      </form>
    </AuthShell>
  );
}
