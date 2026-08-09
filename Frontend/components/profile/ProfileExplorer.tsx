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
  Loader2,
  Lock,
  LogOut,
  Pencil,
  Phone,
  School,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { apiRequest, ApiError, firstErrorMessage } from "@/lib/api";
import {
  authHeaders,
  clearSession,
  getToken,
  updateStoredStudent,
  type Student,
} from "@/lib/auth";

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

/** Single editable field: labeled input (or textarea) with a pencil affordance. */
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
  const fieldRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  const focusField = () => {
    fieldRef.current?.focus();
    fieldRef.current?.select();
  };

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

/** Editable profile fields (Student ID is intentionally read-only). */
interface ProfileForm {
  full_name: string;
  email: string;
  department: string;
  phone: string;
  bio: string;
}

/** Monogram fallback while no photo is shown ("Arif Hasan" → "AH"). */
function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Profile page backed by the Django API: loads the logged-in student, lets
 * them edit profile info and upload a picture, and persists via
 * PATCH /api/auth/me/. Redirects to /login when no session exists.
 */
export default function ProfileExplorer() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Live (edited) values vs. the last-saved snapshot — drives the Save button.
  const [profile, setProfile] = useState<ProfileForm>({
    full_name: "",
    email: "",
    department: "",
    phone: "",
    bio: "",
  });
  const [savedProfile, setSavedProfile] = useState<ProfileForm>(profile);

  // Picked-but-not-yet-saved avatar file (blob URL shown for preview).
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const avatarUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hideTimerRef = useRef<number | null>(null);

  // Load the profile once on mount.
  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    apiRequest<Student>("/auth/me/", { headers: authHeaders() })
      .then((data) => {
        if (cancelled) return;
        setStudent(data);
        const form: ProfileForm = {
          full_name: data.full_name,
          email: data.email,
          department: data.department ?? "",
          phone: data.phone,
          bio: data.bio ?? "",
        };
        setProfile(form);
        setSavedProfile(form);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          clearSession();
          router.replace("/login");
          return;
        }
        setLoadError(
          err instanceof ApiError
            ? firstErrorMessage(err.body)
            : "Could not load your profile."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

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

  const hasChanges =
    avatarFile !== null ||
    profile.full_name !== savedProfile.full_name ||
    profile.email !== savedProfile.email ||
    profile.department !== savedProfile.department ||
    profile.phone !== savedProfile.phone ||
    profile.bio !== savedProfile.bio;

  const updateField = (key: keyof ProfileForm) => (value: string) =>
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
    setAvatarFile(file);
    // Reset the input so picking the same file again re-triggers onChange.
    e.target.value = "";
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      const form = new FormData();
      form.set("full_name", profile.full_name);
      form.set("email", profile.email);
      form.set("department", profile.department);
      form.set("phone", profile.phone);
      form.set("bio", profile.bio);
      if (avatarFile) {
        form.set("profile_picture", avatarFile);
      }

      const updated = await apiRequest<Student>("/auth/me/", {
        method: "PATCH",
        headers: authHeaders(),
        body: form,
      });

      updateStoredStudent(updated);
      setStudent(updated);
      const formSnapshot: ProfileForm = {
        full_name: updated.full_name,
        email: updated.email,
        department: updated.department ?? "",
        phone: updated.phone,
        bio: updated.bio ?? "",
      };
      setProfile(formSnapshot);
      setSavedProfile(formSnapshot);
      setAvatarFile(null);
      setAvatarUrl(null);
      setShowSaved(true);
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
      hideTimerRef.current = window.setTimeout(() => setShowSaved(false), 4000);
    } catch (err) {
      setSaveError(
        err instanceof ApiError
          ? firstErrorMessage(err.body)
          : "Could not save your profile. Is the backend running?"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest("/auth/logout/", {
        method: "POST",
        headers: authHeaders(),
      });
    } catch {
      // Token may already be invalid — clear locally regardless.
    }
    clearSession();
    router.push("/login");
  };

  // Avatar source: picked file preview → server picture → initials monogram.
  const avatarSrc = avatarUrl ?? student?.profile_picture ?? null;
  const initials = initialsOf(profile.full_name || student?.full_name || "");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-primary-dark" />
        <p className="text-sm font-medium">Loading your profile…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
        <p className="text-sm font-medium text-rose-700">{loadError}</p>
        <button
          type="button"
          onClick={() => router.replace("/login")}
          className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
        >
          Go to login
        </button>
      </div>
    );
  }

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
                  {avatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarSrc}
                      alt={`${profile.full_name}'s avatar`}
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
                  {profile.full_name}
                </h2>
                <p className="mt-0.5 truncate text-sm text-slate-600">
                  {profile.email}
                </p>
                <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                  <GraduationCap className="h-3.5 w-3.5 text-primary-dark" />
                  {student?.student_id}
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
                value={profile.full_name}
                onChange={updateField("full_name")}
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
                  {student?.student_id}
                </span>
                <span className="ml-auto text-xs font-medium text-slate-400">
                  Cannot be changed
                </span>
              </div>
            </div>

            {/* Save error */}
            {saveError ? (
              <p
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
              >
                {saveError}
              </p>
            ) : null}

            {/* Actions */}
            <div className="flex flex-col gap-3 border-t border-slate-300/60 pt-5 sm:flex-row">
              <button
                type="button"
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98] sm:text-base ${
                  hasChanges && !saving
                    ? "bg-primary text-ink shadow-soft hover:bg-primary-dark hover:text-white hover:shadow-lift"
                    : "cursor-not-allowed bg-primary/40 text-ink/60"
                }`}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin sm:h-5 sm:w-5" />
                ) : (
                  <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={saving}
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
