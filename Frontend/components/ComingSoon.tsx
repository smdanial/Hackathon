import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ComingSoonProps {
  title: string;
  icon: LucideIcon;
  description?: string;
}

/** Shared placeholder page for features that are not built yet. */
export default function ComingSoon({ title, icon: Icon, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl bg-card px-6 py-20 text-center shadow-soft">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent-light text-primary-dark shadow-card">
        <Icon className="h-10 w-10" />
      </div>
      <h1 className="font-heading text-3xl font-bold text-ink sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-lg font-medium text-slate-700">
        Coming soon 🚧
      </p>
      {description ? (
        <p className="mt-2 max-w-md text-slate-700">{description}</p>
      ) : null}
      <Link
        href="/"
        className="mt-10 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-ink shadow-soft transition-all duration-200 hover:bg-primary-dark hover:text-white hover:shadow-lift active:scale-95"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>
    </div>
  );
}
