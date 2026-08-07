import type { Metadata } from "next";
import { Bell } from "lucide-react";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Notices · CampusEase",
};

export default function NoticesPage() {
  return (
    <ComingSoon
      title="Notices"
      icon={Bell}
      description="Your personalized class, lab, and club updates."
    />
  );
}
