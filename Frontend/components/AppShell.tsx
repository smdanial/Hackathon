"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Bell,
  BookOpen,
  Bus,
  ChevronDown,
  ChevronLeft,
  CircleUserRound,
  DoorOpen,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Navigation,
  PackageSearch,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { authHeaders, clearSession } from "@/lib/auth";
import { useSession, useSessionSync } from "@/lib/useSession";

/** Routes that render standalone (no sidebar / topbar). The hero at "/" is
    the logged-out landing page; auth pages are standalone too. */
const STANDALONE_PATHS = ["/", "/login", "/signup", "/reset-password"];

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Room Finder", href: "/rooms", icon: DoorOpen },
  { label: "Library", href: "/library", icon: BookOpen },
  { label: "Bus Tracker", href: "/bus", icon: Bus },
  { label: "Lost & Found", href: "/lost-found", icon: PackageSearch },
  { label: "Notices", href: "/notices", icon: Bell },
  { label: "Lab Report", href: "/lab-report", icon: FileText },
  { label: "My Profile", href: "/profile", icon: CircleUserRound },
];

/** Shown in addition to the normal items, only to signed-in drivers. */
const DRIVER_ITEM: NavItem = {
  label: "Driver Console",
  href: "/bus/driver",
  icon: Navigation,
};

function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * App shell in the style of a modern admin dashboard: a dark sidebar with the
 * full navigation, a dark top bar with brand + quick links + the signed-in
 * student, and the page content in a light area on the right. Auth pages
 * render without the shell.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // The signed-in student, kept live: the session store re-reads browser
  // storage on login/logout/profile saves, and useSessionSync polls the
  // backend so admin role/profile changes land here without a reload.
  const { student } = useSession();
  const [signingOut, setSigningOut] = useState(false);

  // Live backend sync: refresh the stored session from /auth/me/ on an
  // interval so role grants/revocations and profile edits made in the admin
  // panel show up here (nav, header, driver redirect) in near real time.
  useSessionSync();

  // Drivers are restricted to the Driver Console: it is the only nav entry
  // they see, and any other page bounces back to it.
  const isDriver = student?.role === "driver";
  // Librarians don't get the Lab Report page (drivers get their own console).
  const navItems = isDriver
    ? [DRIVER_ITEM]
    : NAV_ITEMS.filter(
        (item) => item.href !== "/lab-report" || !student?.is_librarian
      );
  const topbarLinks = navItems.filter((item) => item.href !== "/profile");

  useEffect(() => {
    if (isDriver && pathname !== "/bus/driver") {
      router.replace("/bus/driver");
    }
  }, [isDriver, pathname, router]);

  // Close the mobile menu whenever the route changes (React's documented
  // pattern for adjusting state during render).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  // Escape closes the mobile menu.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await apiRequest("/auth/logout/", {
        method: "POST",
        headers: authHeaders(),
      });
    } catch {
      // Token may already be gone — still clear the local session.
    }
    clearSession();
    router.push("/login");
  };

  if (STANDALONE_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  const navRow = (item: NavItem, close: () => void) => {
    const active = pathname === item.href;
    const content = (
      <>
        <item.icon className="h-5 w-5 shrink-0" />
        {!collapsed ? (
          <span className="truncate text-sm font-medium">{item.label}</span>
        ) : null}
      </>
    );
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={close}
        title={collapsed ? item.label : undefined}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-200 ${
          collapsed ? "justify-center" : ""
        } ${
          active
            ? "bg-white font-semibold text-black"
            : "text-zinc-400 hover:bg-white/10 hover:text-white"
        }`}
      >
        {content}
      </Link>
    );
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-navbar text-white">
      {/* Collapse toggle (desktop only) */}
      <div className="flex h-16 items-center justify-end pr-3">
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden rounded-lg p-2 text-zinc-500 transition-colors duration-200 hover:bg-white/10 hover:text-white lg:block"
        >
          <ChevronLeft
            className={`h-4 w-4 transition-transform duration-200 ${
              collapsed ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
        {navItems.map((item) => navRow(item, () => setMobileOpen(false)))}
      </nav>

      {/* Bottom: profile + sign out */}
      <div className="border-t border-white/10 p-3">
        {student ? (
          <Link
            href={isDriver ? "/bus/driver" : "/profile"}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 rounded-xl p-2 transition-colors duration-200 hover:bg-white/10"
          >
            {student.profile_picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={student.profile_picture}
                alt=""
                className="h-9 w-9 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white">
                {initialsOf(student.full_name)}
              </span>
            )}
            {!collapsed ? (
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {student.full_name}
                </span>
                <span className="block truncate text-[11px] text-zinc-400">
                  {student.email}
                </span>
              </span>
            ) : null}
            {!collapsed ? (
              <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-zinc-500" />
            ) : null}
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2.5 text-sm font-semibold text-black transition-colors duration-200 hover:bg-zinc-200"
          >
            <CircleUserRound className="h-4 w-4" />
            Sign in
          </Link>
        )}

        {student ? (
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className={`mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors duration-200 hover:bg-white/10 hover:text-white disabled:opacity-60 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed ? <span>{signingOut ? "Signing out…" : "Sign out"}</span> : null}
          </button>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar — fixed width, stays while scrolling */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 transition-[width] duration-200 lg:block ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {sidebar}
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-white/10 bg-navbar px-4 text-white sm:px-5 lg:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-300 transition-colors duration-200 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Brand — the app home is the dashboard (or the driver console
              for drivers, who have no other page). */}
          <Link
            href={isDriver ? "/bus/driver" : "/dashboard"}
            className="flex items-center gap-2.5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
              <GraduationCap className="h-5 w-5 text-white" />
            </span>
            <span className="hidden sm:block">
              <span className="block font-heading text-sm font-bold tracking-wide uppercase">
                Campus Ease
              </span>
              <span className="block text-[10px] tracking-wide text-zinc-500">
                NITER.
              </span>
            </span>
          </Link>

          {/* Quick links (desktop) */}
          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            {topbarLinks.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    active
                      ? "text-white underline decoration-2 underline-offset-8"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Profile chip */}
          <div className="ml-auto">
            <Link
              href={isDriver ? "/bus/driver" : "/profile"}
              aria-current={pathname === "/profile" ? "page" : undefined}
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors duration-200 hover:bg-white/10"
            >
              {student ? (
                <>
                  {student.profile_picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={student.profile_picture}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-bold">
                      {initialsOf(student.full_name)}
                    </span>
                  )}
                  <span className="hidden text-left md:block">
                    <span className="block max-w-40 truncate text-sm font-semibold">
                      {student.full_name}
                    </span>
                    <span className="block max-w-40 truncate text-[11px] text-zinc-500">
                      {student.email}
                    </span>
                  </span>
                  <ChevronDown className="hidden h-4 w-4 text-zinc-500 md:block" />
                </>
              ) : (
                <span className="text-sm font-semibold text-zinc-300">Sign in</span>
              )}
            </Link>
          </div>
        </header>

        {/* Page content — soft gradient blobs sit behind it so the glassy
            cards above have something to refract. isolate keeps the -z-10
            blob layer inside main (above the page background). */}
        <main className="relative isolate flex-1 overflow-x-clip p-4 sm:p-6 lg:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="absolute -top-24 -left-16 h-80 w-80 rounded-full bg-indigo-400/25 blur-3xl" />
            <div className="absolute top-1/3 -right-24 h-[26rem] w-[26rem] rounded-full bg-violet-400/20 blur-3xl" />
            <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-sky-300/25 blur-3xl" />
            <div className="absolute top-10 right-1/3 h-64 w-64 rounded-full bg-emerald-300/15 blur-3xl" />
          </div>
          <div className="relative">{children}</div>
        </main>
      </div>

      {/* Mobile slide-in sidebar */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-navbar shadow-2xl"
          >
            <div className="flex h-16 items-center justify-between px-4">
              <span className="font-heading text-sm font-bold tracking-wide text-white uppercase">
                Campus Ease
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors duration-200 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      ) : null}
    </div>
  );
}
