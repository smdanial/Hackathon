"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  FileText,
  FlaskConical,
  GraduationCap,
  Loader2,
  Pencil,
  Save,
  Trash2,
} from "lucide-react";
import { API_BASE_URL, apiRequest, ApiError, ApiErrorBody, firstErrorMessage } from "@/lib/api";
import { authHeaders } from "@/lib/auth";
import { useSession } from "@/lib/useSession";
import { DEPARTMENTS } from "@/lib/departments";
import RequireAuth from "@/components/RequireAuth";

/** Lab report cover page as served by the Django API (snake_case). */
interface ApiLabReport {
  id: number;
  department: string;
  course_title: string;
  course_code: string;
  date_of_submission: string;
  experiment_name: string;
  remarks: string;
  student_name: string;
  student_id: string;
  section: string;
  level_term: string;
  session: string;
  teacher_name: string;
  teacher_rank: string;
  teacher_department: string;
  created_at: string;
  updated_at: string;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30";

const labelClass = "text-sm font-semibold text-slate-700";

/** Formats a YYYY-MM-DD date as the cover's 11-AUG-2026 style. */
function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, "-")
    .toUpperCase();
}

const initialForm = (studentDepartment?: string) => ({
  department: studentDepartment || "CSE",
  course_title: "",
  course_code: "",
  date_of_submission: new Date().toISOString().slice(0, 10),
  experiment_name: "",
  remarks: "",
  section: "",
  level_term: "",
  session: "",
  teacher_name: "",
  teacher_rank: "",
  teacher_department: "",
});

type FormState = ReturnType<typeof initialForm>;

function LabReportPage() {
  const router = useRouter();
  const { student } = useSession();

  const [form, setForm] = useState<FormState>(() => initialForm(student?.department));
  const [reports, setReports] = useState<ApiLabReport[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  // Generate the reference-design cover as a PDF server-side and download it.
  const downloadPdf = async (payload: Record<string, unknown>) => {
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/lab-reports/pdf/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let message = "Could not generate the PDF.";
        try {
          const body = (await res.json()) as ApiErrorBody;
          message = firstErrorMessage(body);
        } catch {
          // Non-JSON body — keep the generic message.
        }
        throw new Error(message);
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="?([^";]+)"?/);
      const filename = match ? match[1] : "lab-report-cover.pdf";
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate the PDF.");
    } finally {
      setDownloading(false);
    }
  };

  // Download the current form as a PDF.
  const downloadCurrent = () => void downloadPdf(form);

  // Download a saved report — its stored snapshot (name/ID/teacher) is sent,
  // so the PDF matches the saved cover even if the profile changed later.
  const downloadReport = (report: ApiLabReport) => {
    void downloadPdf({
      department: report.department,
      course_title: report.course_title,
      course_code: report.course_code,
      date_of_submission: report.date_of_submission,
      experiment_name: report.experiment_name,
      remarks: report.remarks,
      student_name: report.student_name,
      student_id: report.student_id,
      section: report.section,
      level_term: report.level_term,
      session: report.session,
      teacher_name: report.teacher_name,
      teacher_rank: report.teacher_rank,
      teacher_department: report.teacher_department,
    });
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Librarians and drivers don't get this page — bounce them to the dashboard.
  useEffect(() => {
    if (student && student.is_librarian) router.replace("/dashboard");
  }, [student, router]);

  // Load my saved reports.
  useEffect(() => {
    let cancelled = false;
    apiRequest<ApiLabReport[]>("/lab-reports/", { headers: authHeaders() })
      .then((data) => {
        if (!cancelled) setReports(data);
      })
      .catch(() => {
        // 401/network — the RequireAuth guard handles the redirect.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.course_title.trim()) return setError("Enter the course title.");
    if (!form.course_code.trim()) return setError("Enter the course code.");
    if (!form.date_of_submission) return setError("Pick the date of submission.");
    if (!form.experiment_name.trim()) return setError("Enter the name of experiment.");
    if (!form.teacher_name.trim()) return setError("Enter the teacher's name.");

    setBusy(true);
    setError(null);
    setSavedFlash(null);
    try {
      const payload = { ...form };
      if (editingId) {
        await apiRequest<ApiLabReport>(`/lab-reports/${editingId}/`, {
          method: "PATCH",
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
        setSavedFlash("Cover page updated.");
      } else {
        await apiRequest<ApiLabReport>("/lab-reports/", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
        setSavedFlash("Cover page saved to your account.");
      }
      const fresh = await apiRequest<ApiLabReport[]>("/lab-reports/", {
        headers: authHeaders(),
      });
      setReports(fresh);
      setEditingId(null);
      setForm(initialForm(student?.department));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? firstErrorMessage(err.body)
          : "Could not save the report. Is the backend running?"
      );
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (report: ApiLabReport) => {
    setEditingId(report.id);
    setForm({
      department: report.department,
      course_title: report.course_title,
      course_code: report.course_code,
      date_of_submission: report.date_of_submission,
      experiment_name: report.experiment_name,
      remarks: report.remarks,
      section: report.section,
      level_term: report.level_term,
      session: report.session,
      teacher_name: report.teacher_name,
      teacher_rank: report.teacher_rank,
      teacher_department: report.teacher_department,
    });
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(initialForm(student?.department));
    setError(null);
  };

  const removeReport = async (report: ApiLabReport) => {
    if (!window.confirm(`Delete the cover page for “${report.experiment_name}”?`)) return;
    setBusy(true);
    try {
      await apiRequest(`/lab-reports/${report.id}/`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setReports((prev) => prev.filter((r) => r.id !== report.id));
      if (editingId === report.id) cancelEdit();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? firstErrorMessage(err.body)
          : "Could not delete the report."
      );
    } finally {
      setBusy(false);
    }
  };

  if (student?.is_librarian) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Lab Report Cover
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Fill in the details and generate a NITER lab report cover page — it
          saves to your account so you can come back and edit it anytime.
        </p>
      </header>

      <div className="flex flex-col gap-6">
        {/* ---- Form ---- */}
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-3xl flex-col gap-5 rounded-2xl glass p-5 shadow-card ring-1 ring-white/60 sm:p-6"
        >
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary-dark">
                <GraduationCap className="h-4 w-4" />
              </span>
              <h2 className="font-heading text-lg font-bold text-ink">Course details</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="report-department" className={labelClass}>
                  Department
                </label>
                <select
                  id="report-department"
                  value={form.department}
                  onChange={(e) => set("department", e.target.value)}
                  disabled={busy}
                  className={inputClass}
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="report-code" className={labelClass}>
                  Course code
                </label>
                <input
                  id="report-code"
                  type="text"
                  value={form.course_code}
                  onChange={(e) => set("course_code", e.target.value)}
                  placeholder="e.g. CSE-1111"
                  disabled={busy}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="report-course" className={labelClass}>
                Course title
              </label>
              <input
                id="report-course"
                type="text"
                value={form.course_title}
                onChange={(e) => set("course_title", e.target.value)}
                placeholder="e.g. Fundamentals of Computers and Computing"
                disabled={busy}
                className={inputClass}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="report-date" className={labelClass}>
                  Date of submission
                </label>
                <input
                  id="report-date"
                  type="date"
                  value={form.date_of_submission}
                  onChange={(e) => set("date_of_submission", e.target.value)}
                  disabled={busy}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="report-section" className={labelClass}>
                  Section
                </label>
                <input
                  id="report-section"
                  type="text"
                  value={form.section}
                  onChange={(e) => set("section", e.target.value)}
                  placeholder="e.g. A2"
                  disabled={busy}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="report-experiment" className={labelClass}>
                Name of experiment
              </label>
              <input
                id="report-experiment"
                type="text"
                value={form.experiment_name}
                onChange={(e) => set("experiment_name", e.target.value)}
                placeholder="e.g. Introduction of Motherboard, Bus system…"
                disabled={busy}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="report-remarks" className={labelClass}>
                Remarks <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="report-remarks"
                type="text"
                value={form.remarks}
                onChange={(e) => set("remarks", e.target.value)}
                placeholder="e.g. Submitted in lab 4"
                disabled={busy}
                className={inputClass}
              />
            </div>
          </section>

          <hr className="border-white/60" />

          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary-dark">
                <FileText className="h-4 w-4" />
              </span>
              <h2 className="font-heading text-lg font-bold text-ink">Submitted by</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <span className={labelClass}>Name</span>
                <div className="flex items-center gap-2 rounded-xl bg-primary-light px-4 py-2.5 text-sm font-semibold text-primary-dark">
                  {student?.full_name ?? "—"}
                </div>
                <p className="text-xs font-medium text-slate-500">
                  From your profile — not editable here.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={labelClass}>Student ID</span>
                <div className="flex items-center gap-2 rounded-xl bg-primary-light px-4 py-2.5 text-sm font-semibold text-primary-dark">
                  {student?.student_id ?? "—"}
                </div>
                <p className="text-xs font-medium text-slate-500">
                  From your profile — not editable here.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="report-level" className={labelClass}>
                  Level-Term
                </label>
                <input
                  id="report-level"
                  type="text"
                  value={form.level_term}
                  onChange={(e) => set("level_term", e.target.value)}
                  placeholder="e.g. 1-1"
                  disabled={busy}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="report-session" className={labelClass}>
                  Session
                </label>
                <input
                  id="report-session"
                  type="text"
                  value={form.session}
                  onChange={(e) => set("session", e.target.value)}
                  placeholder="e.g. 2025-2026"
                  disabled={busy}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={labelClass}>Department</span>
                <div className="flex items-center gap-2 rounded-xl bg-primary-light px-4 py-2.5 text-sm font-semibold text-primary-dark">
                  {form.department}
                </div>
              </div>
            </div>
          </section>

          <hr className="border-white/60" />

          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary-dark">
                <FlaskConical className="h-4 w-4" />
              </span>
              <h2 className="font-heading text-lg font-bold text-ink">Submitted to</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="report-teacher" className={labelClass}>
                  Teacher&apos;s name
                </label>
                <input
                  id="report-teacher"
                  type="text"
                  value={form.teacher_name}
                  onChange={(e) => set("teacher_name", e.target.value)}
                  placeholder="e.g. Sadia Sazzad"
                  disabled={busy}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="report-rank" className={labelClass}>
                  Teacher&apos;s rank
                </label>
                <input
                  id="report-rank"
                  type="text"
                  value={form.teacher_rank}
                  onChange={(e) => set("teacher_rank", e.target.value)}
                  placeholder="e.g. Assistant Professor"
                  disabled={busy}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="report-teacher-dept" className={labelClass}>
                Teacher&apos;s department
              </label>
              <select
                id="report-teacher-dept"
                value={form.teacher_department}
                onChange={(e) => set("teacher_department", e.target.value)}
                disabled={busy}
                className={inputClass}
              >
                <option value="">Select a department…</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
            >
              {error}
            </p>
          ) : null}
          {savedFlash ? (
            <p
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
            >
              {savedFlash}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={downloadCurrent}
              disabled={downloading}
              className="flex flex-[1.5] items-center justify-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white shadow-soft transition-all duration-200 hover:bg-slate-800 hover:shadow-lift active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {downloading ? "Generating…" : "Download PDF"}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {busy
                ? "Saving…"
                : editingId
                  ? "Save changes"
                  : "Save cover page"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={cancelEdit}
                disabled={busy}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
      </div>

      {/* ---- My saved reports ---- */}
      <section className="rounded-2xl glass p-5 shadow-card ring-1 ring-white/60 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold text-ink">My saved cover pages</h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              {loading
                ? "Loading…"
                : reports.length === 0
                  ? "Nothing saved yet — generate your first cover page above."
                  : `${reports.length} saved report${reports.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>

        {reports.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-4 transition-colors duration-200 hover:border-slate-300"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{report.experiment_name}</p>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {report.course_code} · {report.department} ·{" "}
                    {formatDate(report.date_of_submission)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-400">
                    {report.teacher_name}
                    {report.teacher_rank ? ` (${report.teacher_rank})` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => downloadReport(report)}
                    disabled={busy || downloading}
                    aria-label={`Download ${report.experiment_name} as PDF`}
                    title="Download as PDF"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors duration-200 hover:bg-primary-light hover:text-primary-dark disabled:opacity-50"
                  >
                    {downloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(report)}
                    disabled={busy}
                    aria-label={`Edit ${report.experiment_name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors duration-200 hover:bg-primary-light hover:text-primary-dark disabled:opacity-50"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeReport(report)}
                    disabled={busy}
                    aria-label={`Delete ${report.experiment_name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors duration-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default function LabReportPageEntry() {
  return (
    <RequireAuth>
      <LabReportPage />
    </RequireAuth>
  );
}
