"use client";

import Link from "next/link";
import { useState } from "react";
import { IdCard, Mail, Phone, UserRound } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { PasswordField, PRIMARY_BTN, TextField } from "@/components/AuthField";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
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
          placeholder="Create a password"
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

        <button type="submit" className={PRIMARY_BTN}>
          Create Account
        </button>
      </form>
    </AuthShell>
  );
}
