import type { Metadata } from "next";
import RoomFinder from "@/components/RoomFinder";

export const metadata: Metadata = {
  title: "Room Finder · CampusEase",
};

export default function RoomsPage() {
  return <RoomFinder />;
}
