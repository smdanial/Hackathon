"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  BookOpen,
  Bus,
  CalendarCheck,
  CheckCircle2,
  DoorOpen,
  GraduationCap,
  Layers,
  MapPin,
  PackageSearch,
  Radio,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";

/** Room shape as served by the Django API (only the fields we need). */
interface ApiRoom {
  id: number;
  building: string;
  schedule: { start_time: string }[];
}

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}

const FEATURES: Feature[] = [
  {
    icon: DoorOpen,
    title: "Room Finder",
    description:
      "See which classrooms are free right now and book a slot in a few taps.",
    href: "/rooms",
  },
  {
    icon: Bus,
    title: "Bus Tracker",
    description:
      "Follow campus buses live on their way to NITER, Savar — route by route.",
    href: "/bus",
  },
  {
    icon: PackageSearch,
    title: "Lost & Found",
    description:
      "Report found items, search the lost board and get reunited with your stuff.",
    href: "/lost-found",
  },
  {
    icon: BookOpen,
    title: "Library",
    description:
      "Check book and seat availability before you even leave your room.",
    href: "/library",
  },
  {
    icon: Bell,
    title: "Notices",
    description:
      "Class updates, club news and lab alerts — all in one place.",
    href: "/notices",
  },
];

/** Fade-up with a stagger delay — used by the hero sections. */
function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={`hero-fade-up ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/**
 * Landing page for logged-out visitors: dark shell, drifting gradient blobs,
 * frosted glass preview cards and live campus stats — same design language as
 * the app, with a marketing twist. Signed-in visitors get a shortcut to the
 * dashboard instead of the sign-up CTAs.
 */
export default function Hero() {
  const [loggedIn, setLoggedIn] = useState(false);
  // Live counts — start at 0 so the server and client first paints match,
  // then fill in from the API.
  const [stats, setStats] = useState({ rooms: 0, buildings: 0, classes: 0 });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (getToken()) setLoggedIn(true);
    }, 0);
    let cancelled = false;
    apiRequest<ApiRoom[]>("/rooms/")
      .then((data) => {
        if (cancelled) return;
        setStats({
          rooms: data.length,
          buildings: new Set(data.map((room) => room.building)).size,
          classes: data.reduce((sum, room) => sum + room.schedule.length, 0),
        });
      })
      .catch(() => {
        // Non-fatal — the hero still looks right with zeroed stats.
      });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const primaryCta = loggedIn
    ? { href: "/dashboard", label: "Open Dashboard" }
    : { href: "/signup", label: "Get Started" };

  return (
    <div className="relative min-h-screen overflow-x-clip bg-navbar text-white">
      {/* Drifting gradient blobs behind the glass */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="hero-blob absolute -top-32 -left-24 h-[30rem] w-[30rem] rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="hero-blob hero-blob-2 absolute top-1/3 -right-32 h-[34rem] w-[34rem] rounded-full bg-violet-500/20 blur-3xl" />
        <div className="hero-blob hero-blob-3 absolute -bottom-24 left-1/3 h-96 w-96 rounded-full bg-sky-400/15 blur-3xl" />
        <div className="hero-blob hero-blob-4 absolute top-24 left-1/2 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      {/* Subtle grid overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
      />

      {/* Top nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition-colors duration-200 group-hover:bg-white/20">
            <GraduationCap className="h-5 w-5 text-white" />
          </span>
          <span>
            <span className="block font-heading text-sm font-bold tracking-wide uppercase">
              Campus Ease
            </span>
            <span className="block text-[10px] tracking-wide text-zinc-500">
              National Institute of Textile Engineering and Research
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {FEATURES.slice(0, 4).map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="text-sm font-medium text-zinc-400 transition-colors duration-200 hover:text-white"
            >
              {feature.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href={loggedIn ? "/dashboard" : "/login"}
            className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-300 transition-colors duration-200 hover:bg-white/10 hover:text-white sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href={primaryCta.href}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black shadow-soft transition-all duration-200 hover:bg-zinc-200 hover:shadow-lift active:scale-[0.98]"
          >
            {primaryCta.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero split */}
      <main className="relative z-10 mx-auto max-w-6xl px-5 pt-8 pb-16 sm:px-8 sm:pt-14">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          {/* Copy */}
          <div>
            <FadeUp>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-zinc-300 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                One super-app for campus life
              </span>
            </FadeUp>

            <FadeUp delay={120}>
              <h1 className="mt-6 font-heading text-4xl leading-[1.08] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Student life,
                <br />
                made{" "}
                <span className="bg-linear-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
                  effortless.
                </span>
              </h1>
            </FadeUp>

            <FadeUp delay={240}>
              <p className="mt-6 max-w-md text-base leading-relaxed text-zinc-400 sm:text-lg">
                Book free rooms, follow campus buses, recover lost items and
                stay on top of every notice — all in one place, built for
                National Institute of Textile Engineering and Research.
              </p>
            </FadeUp>

            <FadeUp delay={360}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={primaryCta.href}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-soft ring-1 ring-white/20 transition-all duration-200 hover:bg-primary-dark hover:shadow-lift active:scale-[0.98]"
                >
                  {primaryCta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {!loggedIn ? (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-zinc-200 backdrop-blur-md transition-all duration-200 hover:border-white/30 hover:bg-white/10 active:scale-[0.98]"
                  >
                    I already have an account
                  </Link>
                ) : null}
              </div>
            </FadeUp>

            {/* Live stats */}
            <FadeUp delay={480}>
              <dl className="mt-10 grid grid-cols-3 gap-3">
                {[
                  { label: "Rooms on campus", value: stats.rooms },
                  { label: "Buildings", value: stats.buildings },
                  { label: "Classes today", value: stats.classes },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 backdrop-blur-md transition-colors duration-200 hover:bg-white/10"
                  >
                    <dd className="font-heading text-2xl font-bold text-white">
                      {stat.value}
                    </dd>
                    <dt className="mt-0.5 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
                      {stat.label}
                    </dt>
                  </div>
                ))}
              </dl>
            </FadeUp>
          </div>

          {/* Floating glass preview */}
          <FadeUp delay={300} className="relative">
            <div className="relative mx-auto w-full max-w-sm lg:max-w-md">
              {/* Glow behind the preview */}
              <div
                aria-hidden="true"
                className="hero-glow absolute -inset-8 rounded-[3rem] bg-indigo-500/20 blur-3xl"
              />

              {/* Main preview card */}
              <div className="hero-float relative rounded-3xl glass-strong p-6 shadow-lift ring-1 ring-white/20">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary-dark">
                    <DoorOpen className="h-6 w-6" />
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success-light px-3 py-1 text-xs font-bold text-emerald-800">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                    Free
                  </span>
                </div>
                <h3 className="mt-4 font-heading text-2xl font-bold text-ink">
                  Room 101
                </h3>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-600">
                  <MapPin className="h-4 w-4 text-primary-dark" />
                  Academic Building 1
                  <span className="text-slate-400">·</span>
                  <Layers className="h-3.5 w-3.5 text-primary-dark" />
                  Floor 1
                </p>
                <div className="mt-4 flex items-center gap-1.5 rounded-xl bg-success-light/60 px-4 py-3 text-sm font-medium text-emerald-800">
                  <Radio className="h-4 w-4" />
                  Free until <span className="font-bold">8:00 AM</span>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-soft">
                  <CalendarCheck className="h-4 w-4" />
                  Book this room
                </div>

                {/* Mini schedule */}
                <div className="mt-5 space-y-2">
                  {[
                    { time: "8:00 – 9:30", name: "CSE-305 · Algorithms", busy: true },
                    { time: "9:30 – 11:00", name: "Math 201 · Calculus", busy: true },
                    { time: "11:00 – 12:30", name: "Free", busy: false },
                  ].map((row) => (
                    <div
                      key={row.time}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs ${
                        row.busy
                          ? "bg-white/70 text-slate-700"
                          : "border border-dashed border-emerald-300 bg-emerald-50/60 font-semibold text-emerald-700"
                      }`}
                    >
                      <span className="font-semibold">{row.time}</span>
                      <span className="truncate pl-3">{row.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating chip: booking confirmed */}
              <div className="hero-float-delayed absolute -top-6 -right-4 flex items-center gap-2.5 rounded-2xl glass p-3.5 shadow-lift ring-1 ring-white/20 sm:-right-10">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-success-light text-success">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-xs font-bold text-ink">
                    Booking confirmed
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    Room 101 · 11:00 – 12:30
                  </span>
                </span>
              </div>

              {/* Floating chip: bus */}
              <div className="hero-float-delayed absolute -bottom-6 -left-4 flex items-center gap-2.5 rounded-2xl glass p-3.5 shadow-lift ring-1 ring-white/20 sm:-left-10">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary-dark">
                  <Bus className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-xs font-bold text-ink">
                    Route 2 · Farmgate
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    Arriving in 4 min — on time
                  </span>
                </span>
              </div>
            </div>
          </FadeUp>
        </div>

        {/* Feature grid */}
        <div className="mt-20 sm:mt-28">
          <FadeUp>
            <div className="text-center">
              <h2 className="font-heading text-2xl font-bold sm:text-3xl">
                Everything your campus day needs
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-zinc-400 sm:text-base">
                Five tools, one login. Built for how students actually live.
              </p>
            </div>
          </FadeUp>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <FadeUp key={feature.href} delay={120 * (index + 1)}>
                <Link
                  href={feature.href}
                  className="group flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-white/25 hover:bg-white/10 hover:shadow-lift"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white transition-colors duration-300 group-hover:bg-white group-hover:text-black">
                    <feature.icon className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="font-heading text-lg font-bold">
                      {feature.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                      {feature.description}
                    </p>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-300 transition-colors duration-200 group-hover:text-white">
                    Explore
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                </Link>
              </FadeUp>
            ))}

            {/* Sixth card — sign in CTA */}
            <FadeUp delay={120 * (FEATURES.length + 1)}>
              <Link
                href={primaryCta.href}
                className="group flex h-full flex-col items-start justify-center gap-3 rounded-3xl bg-white p-6 text-black shadow-lift transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift active:scale-[0.99]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary-dark">
                  <Users className="h-6 w-6" />
                </span>
                <h3 className="font-heading text-lg font-bold">
                  {loggedIn ? "Back to your dashboard" : "Ready to get started?"}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  {loggedIn
                    ? "Your bookings, buses and notices are waiting."
                    : "Create a free student account in under a minute."}
                </p>
                <span className="mt-auto inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 group-hover:bg-primary-dark">
                  {primaryCta.label}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </FadeUp>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-8 text-xs text-zinc-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} CampusEase · National Institute of Textile Engineering and Research, Nayarhat, Savar, Dhaka
          </p>
          <div className="flex items-center gap-5">
            <Link href="/rooms" className="transition-colors duration-200 hover:text-white">
              Rooms
            </Link>
            <Link href="/bus" className="transition-colors duration-200 hover:text-white">
              Buses
            </Link>
            <Link href="/notices" className="transition-colors duration-200 hover:text-white">
              Notices
            </Link>
            <Link href="/login" className="transition-colors duration-200 hover:text-white">
              Sign in
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
