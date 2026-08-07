import type { Metadata } from "next";
import NoticesBoard from "@/components/NoticesBoard";

export const metadata: Metadata = {
  title: "Notices · CampusEase",
};

export default function NoticesPage() {
  return <NoticesBoard />;
}
