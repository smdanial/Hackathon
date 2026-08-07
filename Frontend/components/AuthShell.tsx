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
 * Full-screen gradient shell shared by the standalone login/signup pages.
 * The logo + app name in the card header link back to the homepage — it is
 * the only way home from these pages, so it gets a clear hover treatment.
 */
export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-linear-to-br from-[#2E2A5C] via-[#3B3478] to-[#4B3F94]">
      {/* Soft glow accents behind the card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 -left-20 h-80 w-80 rounded-full bg-[#8A3FA0]/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#6C5CE7]/20 blur-3xl"
      />

      <div className="relative flex min-h-full items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-[440px]">
          <div className="rounded-3xl bg-[#F7F6FD] p-8 shadow-2xl sm:p-10">
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
              <span className="font-heading text-2xl font-bold tracking-tight text-ink transition-colors duration-200 group-hover:text-[#4B3F94]">
                Campus<span className="text-[#4B3F94]">Ease</span>
              </span>
            </Link>

            <h1 className="mt-8 font-heading text-[28px] font-bold leading-tight text-[#4B3F94]">
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
