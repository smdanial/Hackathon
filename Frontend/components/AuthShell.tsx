import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

/**
 * Full-screen shell shared by the standalone login/signup pages: a dark
 * backdrop with soft gradient glows and a frosted-glass card on top, matching
 * the app's modern monochrome look. The logo + app name in the card header
 * link back to the homepage — it is the only way home from these pages, so it
 * gets a clear hover treatment.
 */
export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-navbar">
      {/* Soft glow accents behind the card — the glass card blurs these */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 -left-20 h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-sky-400/10 blur-3xl"
      />

      <div className="relative flex min-h-full items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-[440px]">
          <div className="glass-strong rounded-3xl p-8 ring-1 ring-white/20 sm:p-10">
            {/* Logo + app name — clearly clickable link back home */}
            <Link
              href="/"
              aria-label="CampusEase — back to home"
              className="group flex w-fit cursor-pointer items-center gap-3 rounded-2xl transition-transform duration-200 hover:-translate-y-0.5"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-card ring-1 ring-slate-200 transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="CampusEase logo"
                  width={640}
                  height={360}
                  className="h-full w-full rounded-xl object-contain"
                  preload
                />
              </span>
              <span className="font-heading text-2xl font-bold tracking-tight text-ink transition-colors duration-200 group-hover:text-zinc-600">
                Campus<span className="text-primary-dark">Ease</span>
              </span>
            </Link>

            <h1 className="mt-8 font-heading text-[28px] font-bold leading-tight text-ink">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>

            <div className="mt-7">{children}</div>

            <div className="mt-7 border-t border-slate-200 pt-5 text-center text-sm text-slate-600">
              {footer}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
