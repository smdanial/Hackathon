import type { Metadata } from "next";
import ProfileExplorer from "@/components/profile/ProfileExplorer";

export const metadata: Metadata = {
  title: "My Profile · CampusEase",
};

export default function ProfilePage() {
  return <ProfileExplorer />;
}
