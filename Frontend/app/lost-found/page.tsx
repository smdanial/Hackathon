import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Lost & Found · CampusEase",
};

export default function LostFoundPage() {
  return (
    <ComingSoon
      title="Lost & Found"
      icon={PackageSearch}
      description="Search for lost items or report something you found."
    />
  );
}
