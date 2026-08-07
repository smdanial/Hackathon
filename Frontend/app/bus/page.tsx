import type { Metadata } from "next";
import { Bus } from "lucide-react";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Bus Tracker · CampusEase",
};

export default function BusPage() {
  return (
    <ComingSoon
      title="Bus Tracker"
      icon={Bus}
      description="Live location for all three campus bus routes."
    />
  );
}
