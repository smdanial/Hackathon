"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Armchair,
  Bell,
  BookMarked,
  BookOpen,
  Bus,
  ChevronDown,
  CircleUserRound,
  DoorOpen,
  ClipboardList,
  FlaskConical,
  GraduationCap,
  Home,
  Menu,
  PackagePlus,
  PackageSearch,
  Palette,
  Route,
  Search,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import NoticeModal from "@/components/NoticeModal";
import {
  NOTICE_CATEGORY_LABELS,
  type NoticeCategory,
} from "@/lib/mockNotices";

interface DropdownItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavLink {
  label: string;
  href: string;
  icon: LucideIcon;
  dropdown?: DropdownItem[];
}

const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Room Finder", href: "/rooms", icon: DoorOpen },
  {
    label: "Library",
    href: "/library",
    icon: BookOpen,
    dropdown: [
      {
        label: "Seat Availability",
        href: "/library?tab=seats",
        icon: Armchair,
      },
      { label: "Books", href: "/library?tab=books", icon: BookMarked },
    ],
  },
  {
    label: "Bus Tracker",
    href: "/bus",
    icon: Bus,
    dropdown: [
      { label: "Farmgate to NITER", href: "/bus#farmgate-to-niter", icon: Route },
      { label: "Gabtoli to NITER", href: "/bus#gabtoli-to-niter", icon: Route },
      { label: "Uttara to NITER", href: "/bus#uttara-to-niter", icon: Route },
    ],
  },
  {
    label: "Lost & Found",
    href: "/lost-found",
    icon: PackageSearch,
    dropdown: [
      { label: "Lost", href: "/lost-found?tab=lost", icon: Search },
      { label: "Found", href: "/lost-found?tab=found", icon: PackagePlus },
    ],
  },
  { label: "Notices", href: "/notices", icon: Bell },
];

// Notices has no page anchors to link to: its submenu items open the shared
// NoticeModal pre-filtered to a segment instead of navigating. Labels come
// from NOTICE_CATEGORY_LABELS so the two stay in sync.
const NOTICES_SUBMENU: { icon: LucideIcon; category: NoticeCategory }[] = [
  { icon: GraduationCap, category: "class" },
  { icon: Palette, category: "club" },
  { icon: FlaskConical, category: "lab" },
  { icon: ClipboardList, category: "ems" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  // Keyed by the parent item's href; null means nothing is open.
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  // Segment of the NoticeModal opened from the Notices submenu; null = closed.
  const [modalCategory, setModalCategory] = useState<NoticeCategory | null>(null);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const headerRef = useRef<HTMLElement>(null);

  // Close the mobile menu + dropdowns whenever the route changes. This is the
  // documented React pattern for adjusting state during render, so the panels
  // are already closed on the first paint of the new page — it also covers
  // browser back/forward navigation. It depends only on the pathname, never on
  // the host, so it behaves identically on localhost and network-IP access.
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
    setOpenDropdown(null);
    setModalCategory(null);
  }

  // Close on Escape and lock body scroll while the mobile menu is open
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setOpenDropdown(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Close a desktop dropdown when clicking/tapping outside the navbar. Uses a
  // plain pointer event, so it behaves the same with a mouse or on touch
  // devices. Skipped while the mobile menu is open: the mobile panel is a
  // sibling of the header, so taps inside it would otherwise close (and unmount)
  // a submenu before the tap's click event could navigate — mobile closing is
  // handled by the backdrop, the item toggles, and link clicks instead.
  useEffect(() => {
    if (!openDropdown || menuOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openDropdown, menuOpen]);

  // Auth pages are standalone: hide the navbar entirely, so the logo inside
  // the login/signup card is the only way back to the homepage.
  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-40 border-b border-slate-200/70 bg-navbar/90 backdrop-blur-md"
      >
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-2 sm:px-4 lg:px-6">
          {/* Logo (links home) */}
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary-dark text-white shadow-soft transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="font-heading text-xl font-bold tracking-tight text-ink">
              Campus<span className="text-primary-dark">Ease</span>
            </span>
          </Link>

          {/* Desktop links (md and up) */}
          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(({ label, href, icon: Icon, dropdown }) => {
              const active = pathname === href;
              const isOpen = openDropdown === href;
              const pillClass = `flex items-center rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-200 ${
                active
                  ? "bg-primary text-ink"
                  : "text-slate-700 hover:bg-slate-100 hover:text-ink"
              }`;

              if (label === "Notices") {
                // Split label: the label navigates to /notices, the chevron
                // toggles the panel (same open/close state as the dropdowns).
                return (
                  <div key={href} className="relative">
                    <div
                      className={`flex items-center rounded-full transition-colors duration-200 ${
                        active
                          ? "bg-primary text-ink"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Link
                        href={href}
                        aria-current={active ? "page" : undefined}
                        className="flex items-center gap-2 rounded-l-full py-2 pl-3.5 pr-1.5 text-sm font-medium transition-colors duration-200 hover:text-ink"
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setOpenDropdown(isOpen ? null : href)}
                        aria-haspopup="true"
                        aria-expanded={isOpen}
                        aria-label="Toggle Notices submenu"
                        className="flex items-center rounded-r-full py-2 pl-1 pr-3.5 text-sm font-medium transition-colors duration-200 hover:text-ink"
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>
                    {isOpen ? (
                      <div className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl bg-white p-1.5 shadow-soft">
                        {NOTICES_SUBMENU.map(({ category, icon: SubIcon }) => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => {
                              setOpenDropdown(null);
                              setModalCategory(category);
                            }}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-accent-light hover:text-ink"
                          >
                            <SubIcon className="h-4 w-4 shrink-0 text-primary-dark" />
                            {NOTICE_CATEGORY_LABELS[category]}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              }

              if (dropdown) {
                // Dropdown items are a single button: tapping the label OR the
                // chevron toggles the panel (plain click state, no hover/mouse
                // events involved).
                return (
                  <div key={href} className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenDropdown(isOpen ? null : href)}
                      aria-current={active ? "page" : undefined}
                      aria-haspopup="true"
                      aria-expanded={isOpen}
                      className={`${pillClass} gap-2`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen ? (
                      <div className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl bg-white p-1.5 shadow-soft">
                        {dropdown.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpenDropdown(null)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-accent-light hover:text-ink"
                          >
                            <item.icon className="h-4 w-4 shrink-0 text-primary-dark" />
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              }

              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`${pillClass} gap-2`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right side: profile icon + mobile hamburger */}
          <div className="flex items-center gap-1.5">
            <Link
              href="/profile"
              aria-label="My profile"
              aria-current={pathname === "/profile" ? "page" : undefined}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-200 ${
                pathname === "/profile"
                  ? "bg-primary text-ink"
                  : "text-slate-500 hover:bg-slate-100 hover:text-primary"
              }`}
            >
              <CircleUserRound className="h-5 w-5" />
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="campus-mobile-menu"
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-colors duration-200 hover:bg-slate-100 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile slide-in menu — z-50 overlay renders above the z-40 header */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop — tapping it closes the menu */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => {
              setMenuOpen(false);
              setOpenDropdown(null);
            }}
            aria-hidden="true"
          />
          <div
            id="campus-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className="absolute inset-y-0 right-0 flex w-72 max-w-[85%] flex-col bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4">
              <span className="font-heading text-lg font-bold text-ink">
                Campus<span className="text-primary-dark">Ease</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setOpenDropdown(null);
                }}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1.5 overflow-y-auto p-4">
              {NAV_LINKS.map(({ label, href, icon: Icon, dropdown }) => {
                const active = pathname === href;
                const isOpen = openDropdown === href;
                const rowClass = `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                  active
                    ? "bg-primary text-ink"
                    : "text-slate-700 hover:bg-slate-100 hover:text-ink"
                }`;

                if (label === "Notices") {
                  // Same split as desktop: label navigates, chevron toggles.
                  return (
                    <div key={href}>
                      <div
                        className={`flex items-center rounded-xl transition-colors duration-200 ${
                          active
                            ? "bg-primary text-ink"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <Link
                          href={href}
                          onClick={() => setMenuOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className="flex flex-1 items-center gap-3 rounded-l-xl px-4 py-3 text-sm font-medium transition-colors duration-200 hover:text-ink"
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          {label}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setOpenDropdown(isOpen ? null : href)}
                          aria-haspopup="true"
                          aria-expanded={isOpen}
                          aria-label="Toggle Notices submenu"
                          className="flex w-11 shrink-0 items-center justify-center rounded-r-xl transition-colors duration-200 hover:text-ink"
                        >
                          <ChevronDown
                            className={`h-5 w-5 transition-transform duration-200 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>
                      {isOpen ? (
                        <div className="ml-3 mt-1.5 flex flex-col gap-1 border-l-2 border-primary/40 pl-3">
                          {NOTICES_SUBMENU.map(({ category, icon: SubIcon }) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => {
                                setMenuOpen(false);
                                setOpenDropdown(null);
                                setModalCategory(category);
                              }}
                              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-accent-light hover:text-ink"
                            >
                              <SubIcon className="h-4 w-4 shrink-0 text-primary-dark" />
                              {NOTICE_CATEGORY_LABELS[category]}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                }

                if (dropdown) {
                  return (
                    <div key={href}>
                      <button
                        type="button"
                        onClick={() => setOpenDropdown(isOpen ? null : href)}
                        aria-current={active ? "page" : undefined}
                        aria-haspopup="true"
                        aria-expanded={isOpen}
                        className={rowClass}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {label}
                        <ChevronDown
                          className={`ml-auto h-5 w-5 transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isOpen ? (
                        <div className="ml-3 mt-1.5 flex flex-col gap-1 border-l-2 border-primary/40 pl-3">
                          {dropdown.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => {
                                setMenuOpen(false);
                                setOpenDropdown(null);
                              }}
                              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-accent-light hover:text-ink"
                            >
                              <item.icon className="h-4 w-4 shrink-0 text-primary-dark" />
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                }

                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={rowClass}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* NoticeModal opened from the Notices submenu */}
      {modalCategory ? (
        <NoticeModal
          category={modalCategory}
          onClose={() => setModalCategory(null)}
        />
      ) : null}
    </>
  );
}
