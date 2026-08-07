"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { InputHTMLAttributes } from "react";

const FIELD_BASE =
  "w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm text-ink shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-[#4B3F94] focus:ring-2 focus:ring-[#4B3F94]/15";

/** Shared indigo gradient primary button used by both auth pages. */
export const PRIMARY_BTN =
  "w-full rounded-xl bg-linear-to-r from-[#4B3F94] to-[#3E39B0] py-3 font-heading text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:shadow-lift hover:brightness-110 active:scale-[0.98]";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: LucideIcon;
  id: string;
}

/** Text input with a leading icon, styled for the login/signup pages. */
export function TextField({ label, icon: Icon, id, ...rest }: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input id={id} className={`${FIELD_BASE} pl-11`} {...rest} />
      </div>
    </div>
  );
}

interface PasswordFieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
}

/** Password input with a lock icon and a show/hide toggle. */
export function PasswordField({
  label,
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`${FIELD_BASE} pl-11 pr-11`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-ink"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
