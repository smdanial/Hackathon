import type { Metadata } from "next";
import { DoorOpen } from "lucide-react";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Room Finder · CampusEase",
};

export default function RoomsPage() {
  return (
    <ComingSoon
      title="Room Finder"
      icon={DoorOpen}
      description="Find free classrooms and library seats around campus."
    />
  );
}
