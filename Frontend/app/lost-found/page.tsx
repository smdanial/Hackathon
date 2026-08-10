import type { Metadata } from "next";
import { Suspense } from "react";
import { PackageSearch } from "lucide-react";
import LostFoundExplorer from "@/components/lost-found/LostFoundExplorer";

export const metadata: Metadata = {
  title: "Lost & Found · CampusEase",
};

/** Rendered in the initial HTML while the client explorer hydrates. */
function ExplorerFallback() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-primary-light text-primary-dark shadow-card">
        <PackageSearch className="h-7 w-7" />
      </div>
      <div className="h-10 w-48 animate-pulse rounded-full glass shadow-card" />
    </div>
  );
}

export default function LostFoundPage() {
  // LostFoundExplorer reads ?tab= via useSearchParams, so it must sit inside
  // a Suspense boundary for static prerendering (see Next.js docs).
  return (
    <Suspense fallback={<ExplorerFallback />}>
      <LostFoundExplorer />
    </Suspense>
  );
}
