"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AtSign,
  Camera,
  Check,
  CheckCircle2,
  FileText,
  GraduationCap,
  Lock,
  LogOut,
  Pencil,
  Phone,
  School,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SEED_PROFILE, type StudentProfile } from "./dummyData";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30";

const labelClass = "text-sm font-semibold text-slate-700";

interface ProfileFieldProps {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
}

/**
 * Single editable field: labeled input (or textarea) with a leading icon and a
 * trailing pencil that focuses the field — the "Edit" affordance, consistent
 * across every editable field.
 */
function ProfileField({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
  textarea = false,
}: ProfileFieldProps) {
  // Intersection type keeps one ref assignable to both <input> and <textarea>.
  const fieldRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  const focusField = () => {
    fieldRef.current?.focus();
    fieldRef.current?.select();
  };

  // Inputs center the icon/pencil; textareas align them with the first line.
  const vertPos = textarea ? "top-3.5" : "top-1/2 -translate-y-1/2";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <Icon
          className={`pointer-events-none absolute left-4 h-4 w-4 text-slate-400 ${vertPos}`}
        />
        {textarea ? (
          <textarea
            ref={fieldRef}
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className={`${inputClass} resize-none pl-11 pr-11`}
          />
        ) : (
          <input
            ref={fieldRef}
            id={id}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`${inputClass} pl-11 pr-11`}
          />
        )}
        <button
          type="button"
          onClick={focusField}
          aria-label={`Edit ${label}`}
          className={`absolute right-2 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-accent-light hover:text-primary-dark ${vertPos}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/**
 * Profile page shell: avatar with local upload preview, editable fields with a
 * Save Changes confirmation, a read-only Student ID, and a Logout button.
 * Fully client-side — nothing is persisted (no real auth/backend yet).
 */
export default function ProfileExplorer() {
  const router = useRouter();
  // Live (edited) values vs. the last-saved snapshot — drives the Save button.
  const [profile, setProfile] = useState<StudentProfile>(SEED_PROFILE);
  const [savedProfile, setSavedProfile] = useState<StudentProfile>(SEED_PROFILE);
  // Blob URL of the picked avatar; null = show the initials monogram.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [savedAvatarUrl, setSavedAvatarUrl] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  const avatarUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hideTimerRef = useRef<number | null>(null);

  const hasChanges =
    avatarUrl !== savedAvatarUrl ||
    profile.name !== savedProfile.name ||
    profile.email !== savedProfile.email ||
    profile.department !== savedProfile.department ||
    profile.phone !== savedProfile.phone ||
    profile.bio !== savedProfile.bio;

  // Revoke the avatar blob URL and clear the pending toast timer on unmount.
  useEffect(() => {
    return () => {
      if (avatarUrlRef.current) {
        URL.revokeObjectURL(avatarUrlRef.current);
      }
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const updateField = (key: keyof StudentProfile) => (value: string) =>
    setProfile((current) => ({ ...current, [key]: value }));

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    if (avatarUrlRef.current) {
      URL.revokeObjectURL(avatarUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    avatarUrlRef.current = url;
    setAvatarUrl(url);
    // Reset the input so picking the same file again re-triggers onChange.
    e.target.value = "";
  };

  const handleSave = () => {
    setSavedProfile(profile);
    setSavedAvatarUrl(avatarUrl);
    setShowSaved(true);
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = window.setTimeout(() => setShowSaved(false), 4000);
  };

  const handleLogout = () => {
    // No real session to clear yet — just return to the auth flow.
    router.push("/login");
  };

  // Monogram fallback while no photo is uploaded ("Alex Rahman" → "AR").
  const initials = profile.name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary-dark shadow-card">
          <UserRound className="h-7 w-7" />
        </span>
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink sm:text-4xl">
            My Profile
          </h1>
          <p className="mt-1 text-sm text-slate-700 sm:text-base">
            View and update your personal information.
          </p>
        </div>
      </header>

      <section className="mx-auto w-full max-w-3xl">
        <div className="overflow-hidden rounded-3xl bg-card shadow-soft">
          {/* Success confirmation */}
          {showSaved ? (
            <div
              role="status"
              className="flex items-center gap-3 border-b border-success/30 bg-success-light px-5 py-4 sm:px-6"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
              <p className="text-sm font-semibold text-success">
                Profile updated!
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-6 p-5 sm:p-7">
            {/* Avatar + identity */}
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div className="relative shrink-0">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-primary to-primary-dark shadow-lift ring-4 ring-white/70 sm:h-28 sm:w-28">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={`${profile.name}'s avatar`}
                      className="h-full w-full object-cover"
                    />
                  ) : initials ? (
                    <span className="font-heading text-3xl font-bold text-white">
                      {initials}
                    </span>
                  ) : (
                    <UserRound className="h-12 w-12 text-white/80" />
                  )}
                </div>
                {/* Camera overlay — opens the file picker */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Upload a new profile picture"
                  title="Upload a new profile picture"
                  className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary-dark shadow-soft ring-2 ring-card transition-all duration-200 hover:scale-110 active:scale-95"
                >
                  <Camera className="h-5 w-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  aria-label="Choose a profile picture"
                  className="sr-only"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-2xl font-bold text-ink">
                  {profile.name}
                </h2>
                <p className="mt-0.5 truncate text-sm text-slate-600">
                  {profile.email}
                </p>
                <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                  <GraduationCap className="h-3.5 w-3.5 text-primary-dark" />
                  {profile.studentId}
                </span>
              </div>
            </div>

            <hr className="border-slate-300/60" />

            {/* Editable fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileField
                id="profile-name"
                label="Full Name"
                icon={UserRound}
                value={profile.name}
                onChange={updateField("name")}
                placeholder="Your full name"
              />
              <ProfileField
                id="profile-email"
                label="Email"
                icon={AtSign}
                type="email"
                value={profile.email}
                onChange={updateField("email")}
                placeholder="you@university.edu"
              />
              <ProfileField
                id="profile-department"
                label="Department"
                icon={School}
                value={profile.department}
                onChange={updateField("department")}
                placeholder="Your department"
              />
              <ProfileField
                id="profile-phone"
                label="Phone Number"
                icon={Phone}
                type="tel"
                value={profile.phone}
                onChange={updateField("phone")}
                placeholder="+880 1XXXXXXXXX"
              />
            </div>
            <ProfileField
              id="profile-bio"
              label="Bio / About"
              icon={FileText}
              textarea
              value={profile.bio}
              onChange={updateField("bio")}
              placeholder="A short intro about yourself…"
            />

            {/* Student ID — read-only, not editable */}
            <div className="flex flex-col gap-1.5">
              <span className={labelClass}>Student ID</span>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-100/80 px-4 py-2.5 text-sm text-slate-500">
                <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="font-medium text-slate-600">
                  {profile.studentId}
                </span>
                <span className="ml-auto text-xs font-medium text-slate-400">
                  Cannot be changed
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 border-t border-slate-300/60 pt-5 sm:flex-row">
              <button
                type="button"
                onClick={handleSave}
                disabled={!hasChanges}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98] sm:text-base ${
                  hasChanges
                    ? "bg-primary text-ink shadow-soft hover:bg-primary-dark hover:text-white hover:shadow-lift"
                    : "cursor-not-allowed bg-primary/40 text-ink/60"
                }`}
              >
                <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-error/40 bg-white px-4 py-3 text-sm font-semibold text-error shadow-sm transition-all duration-200 hover:border-error hover:bg-error hover:text-white active:scale-[0.98] sm:flex-none sm:px-6 sm:text-base"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
