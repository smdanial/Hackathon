import { Bell, BookOpen, Bus, DoorOpen, PackageSearch } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import DashboardCard from "@/components/DashboardCard";
import type { CardTone } from "@/components/DashboardCard";

const BADGE_TEXT = "Live status coming soon";

interface Feature {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone: CardTone;
}

const FEATURES: Feature[] = [
  {
    title: "Room Finder",
    description: "Find free rooms and library seats",
    href: "/rooms",
    icon: DoorOpen,
    tone: "primary",
  },
  {
    title: "Library",
    description: "Check seat and book availability",
    href: "/library",
    icon: BookOpen,
    tone: "emerald",
  },
  {
    title: "Bus Tracker",
    description: "See where the campus bus is right now",
    href: "/bus",
    icon: Bus,
    tone: "accent",
  },
  {
    title: "Lost & Found",
    description: "Find or report lost items",
    href: "/lost-found",
    icon: PackageSearch,
    tone: "rose",
  },
  {
    title: "Notices",
    description: "Your class, lab, and club updates",
    href: "/notices",
    icon: Bell,
    tone: "sky",
  },
];

export default function Home() {
  // Feature cards: 1 col mobile, 2 cols tablet, 3 cols desktop
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((feature) => (
        <DashboardCard key={feature.href} {...feature} badge={BADGE_TEXT} />
      ))}
    </div>
  );
}
