import type { Metadata } from "next";
import LibraryExplorer from "@/components/library/LibraryExplorer";
import RequireAuth from "@/components/RequireAuth";

export const metadata: Metadata = {
  title: "Library · CampusEase",
};

interface LibraryPageProps {
  searchParams?: Promise<{ tab?: string }>;
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const { tab } = (await searchParams) ?? {};
  // Read the ?tab= query param on page load (e.g. from the navbar dropdown).
  // Defaults to the Books tab when absent or unrecognized.
  const initialTab = tab === "seats" ? "seats" : "books";
  // Key by tab so client-side navigation between ?tab= values remounts the
  // explorer and actually switches sections (useState reads initialTab once).
  return (
    <RequireAuth>
      <LibraryExplorer key={initialTab} initialTab={initialTab} />
    </RequireAuth>
  );
}
