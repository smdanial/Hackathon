/**
 * Mock bus route data for the Bus Tracker demo.
 *
 * Each route is a list of { lat, lng } waypoints tracing a plausible path from
 * the origin stop to NITER (Savar). The coordinates are approximate — good
 * enough for a hackathon demo, not precise navigation data.
 */

export interface BusPoint {
  lat: number;
  lng: number;
}

export interface BusRoute {
  id: string;
  name: string;
  waypoints: BusPoint[];
  /** Name of the bus driver for this route. */
  driverName: string;
  /** Local-format phone number, e.g. "01712-345678" (tappable via tel: link). */
  driverPhone: string;
  /** Name of the transport supervisor for this route. */
  supervisorName: string;
  /** Local-format phone number for the supervisor. */
  supervisorPhone: string;
}

export const BUS_ROUTES: BusRoute[] = [
  {
    id: "farmgate",
    name: "Farmgate to NITER",
    waypoints: [
      { lat: 23.7581, lng: 90.3897 }, // Farmgate
      { lat: 23.7635, lng: 90.384 }, // Asad Gate
      { lat: 23.7695, lng: 90.3775 }, // Shyamoli
      { lat: 23.777, lng: 90.371 }, // Kalyanpur
      { lat: 23.785, lng: 90.36 }, // Tolarbagh
      { lat: 23.796, lng: 90.345 }, // Amin Bazar
      { lat: 23.811, lng: 90.33 }, // Baipail
      { lat: 23.825, lng: 90.312 }, // Nabinagar
      { lat: 23.841, lng: 90.293 }, // Savar Bazar
      { lat: 23.9157, lng: 90.2356 }, // NITER (Savar)
    ],
    driverName: "Rafiqul Islam",
    driverPhone: "01712-345678",
    supervisorName: "Saniyat Hosen Nirob",
    supervisorPhone: "01911-223344",
  },
  {
    id: "uttara",
    name: "Uttara to NITER",
    waypoints: [
      { lat: 23.8759, lng: 90.3795 }, // Uttara Sector 4
      { lat: 23.867, lng: 90.36 }, // Biman Bandar (Airport)
      { lat: 23.86, lng: 90.34 }, // Khilkhet
      { lat: 23.858, lng: 90.32 }, // Dhaka–Ashulia road
      { lat: 23.856, lng: 90.3 }, // Ashulia
      { lat: 23.8575, lng: 90.285 }, // Baipail–Ashulia stretch
      { lat: 23.9157, lng: 90.2356 }, // NITER (Savar)
    ],
    driverName: "Abdul Karim",
    driverPhone: "01521-334455",
    supervisorName: "Kamruzzaman Labib",
    supervisorPhone: "01933-778899",
  },
];

/** Looks up a route by its id, falling back to the first route (Farmgate). */
export function getBusRoute(routeId: string | undefined): BusRoute {
  return BUS_ROUTES.find((r) => r.id === routeId) ?? BUS_ROUTES[0];
}
