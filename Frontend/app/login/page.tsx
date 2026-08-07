"use client";

import Link from "next/link";
import { useState } from "react";
import { KeyRound, Mail } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { PasswordField, PRIMARY_BTN, TextField } from "@/components/AuthField";
import GoogleIcon from "@/components/GoogleIcon";

const SECONDARY_BTN =
  "flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-[#4B3F94]/40 hover:bg-[#4B3F94]/5 active:scale-[0.98]";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Log in to access your student workspace"
      footer={
        <>
          <span className="text-slate-600">New student? </span>
          <Link
            href="/signup"
            className="font-semibold text-[#8A3FA0] transition-colors duration-200 hover:text-[#6E2F85] hover:underline"
          >
            Create your account
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
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
              className="h-4 w-4 rounded border-slate-300 accent-[#4B3F94]"
            />
            Remember me
          </label>
          <button
            type="button"
            className="text-sm font-medium text-[#8A3FA0] transition-colors duration-200 hover:text-[#6E2F85] hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <button type="submit" className={PRIMARY_BTN}>
          Sign In
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
          <KeyRound className="h-4 w-4 text-[#4B3F94]" />
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
