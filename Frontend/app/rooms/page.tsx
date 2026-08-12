import type { Metadata } from "next";
import RoomFinder from "@/components/RoomFinder";
import RequireAuth from "@/components/RequireAuth";

export const metadata: Metadata = {
  title: "Room Finder · CampusEase",
};

export default function RoomsPage() {
  return (
    <RequireAuth>
      <RoomFinder />
    </RequireAuth>
  );
}
