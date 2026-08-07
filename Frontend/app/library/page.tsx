import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Library · CampusEase",
};

export default function LibraryPage() {
  return (
    <ComingSoon
      title="Library"
      icon={BookOpen}
      description="Check seat and book availability in the library."
    />
  );
}
