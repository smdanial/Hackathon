import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type CardTone = "primary" | "accent" | "rose" | "sky" | "emerald";

const TONE_STYLES: Record<CardTone, string> = {
  primary: "bg-primary-light text-primary-dark",
  accent: "bg-accent-light text-accent-dark",
  rose: "bg-rose-100 text-rose-600",
  sky: "bg-sky-100 text-sky-600",
  emerald: "bg-emerald-100 text-emerald-600",
};

/* Lavender "small accent" treatment used for badges across cards. */
const BADGE_STYLE =
  "bg-accent-light text-slate-700 ring-1 ring-white/60";

interface DashboardCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  tone?: CardTone;
}

export default function DashboardCard({
  title,
  description,
  href,
  icon: Icon,
  badge,
  tone = "primary",
}: DashboardCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${TONE_STYLES[tone]} transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <ArrowRight className="h-5 w-5 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary" />
      </div>

      <div>
        <h3 className="font-heading text-lg font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">
          {description}
        </p>
      </div>

      {badge ? (
        <span
          className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${BADGE_STYLE}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
