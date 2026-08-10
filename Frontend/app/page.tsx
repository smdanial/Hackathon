import type { Metadata } from "next";
import Hero from "@/components/Hero";

export const metadata: Metadata = {
  title: "CampusEase — Student life, made easy",
};

export default function HomePage() {
  return <Hero />;
}
