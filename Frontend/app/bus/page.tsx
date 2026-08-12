import type { Metadata } from "next";
import BusTracker from "@/components/BusTracker";
import RequireAuth from "@/components/RequireAuth";
import { getBusRoute } from "@/lib/mockBusRoutes";

export const metadata: Metadata = {
  title: "Bus Tracker · CampusEase",
};

interface BusPageProps {
  searchParams?: Promise<{ route?: string }>;
}

export default async function BusPage({ searchParams }: BusPageProps) {
  const { route } = (await searchParams) ?? {};
  // Read the ?route= query param on page load (e.g. from the navbar dropdown).
  // Falls back to the Farmgate route when absent or unrecognized.
  const initialRoute = getBusRoute(route);
  // Key by route id so client-side navigation between ?route= values remounts
  // the tracker and actually switches maps (useState reads initialRoute once).
  return (
    <RequireAuth>
      <BusTracker key={initialRoute.id} initialRoute={initialRoute} />
    </RequireAuth>
  );
}
