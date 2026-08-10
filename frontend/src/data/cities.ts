export interface City {
  name: string;
  image: string;
  slug: string;
  state: string;
}

/**
 * Phase-1 cities only (20) — popular / display order.
 * States: Telangana, Andhra Pradesh, Karnataka, Tamil Nadu
 * Images: /public/assets/city-logos
 */
export const allCities: City[] = [
  // Telangana
  { name: "Hyderabad", image: "/assets/city-logos/hyderabad.jpg", slug: "hyderabad", state: "Telangana" },
  { name: "Secunderabad", image: "/assets/city-logos/Secunderabad.jpg", slug: "secunderabad", state: "Telangana" },
  { name: "Warangal", image: "/assets/city-logos/Warangal.jpg", slug: "warangal", state: "Telangana" },
  { name: "Karimnagar", image: "/assets/city-logos/Karimnagar.webp", slug: "karimnagar", state: "Telangana" },
  { name: "Khammam", image: "/assets/city-logos/Khammam.jpg", slug: "khammam", state: "Telangana" },
  { name: "Nizamabad", image: "/assets/city-logos/Nizamabad.jpg", slug: "nizamabad", state: "Telangana" },
  // Andhra Pradesh
  { name: "Visakhapatnam", image: "/assets/city-logos/Visakhapatnam.jpg", slug: "visakhapatnam", state: "Andhra Pradesh" },
  { name: "Vijayawada", image: "/assets/city-logos/Vijayawada.webp", slug: "vijayawada", state: "Andhra Pradesh" },
  { name: "Tirupati", image: "/assets/city-logos/Tirupati.jpg", slug: "tirupati", state: "Andhra Pradesh" },
  { name: "Guntur", image: "/assets/city-logos/Guntur.jpg", slug: "guntur", state: "Andhra Pradesh" },
  { name: "Rajahmundry", image: "/assets/city-logos/Rajahmundry.webp", slug: "rajahmundry", state: "Andhra Pradesh" },
  { name: "Kakinada", image: "/assets/city-logos/Kakinada.jpg", slug: "kakinada", state: "Andhra Pradesh" },
  // Karnataka
  { name: "Bengaluru", image: "/assets/city-logos/Bengaluru.jpg", slug: "bengaluru", state: "Karnataka" },
  { name: "Mysuru", image: "/assets/city-logos/Mysuru.jpg", slug: "mysuru", state: "Karnataka" },
  { name: "Mangaluru", image: "/assets/city-logos/Mangaluru.webp", slug: "mangaluru", state: "Karnataka" },
  { name: "Hubballi", image: "/assets/city-logos/Hubballi.jpeg", slug: "hubballi", state: "Karnataka" },
  // Tamil Nadu
  { name: "Chennai", image: "/assets/city-logos/Chennai.jpg", slug: "chennai", state: "Tamil Nadu" },
  { name: "Coimbatore", image: "/assets/city-logos/Coimbatore.jpg", slug: "coimbatore", state: "Tamil Nadu" },
  { name: "Madurai", image: "/assets/city-logos/Madurai.jpg", slug: "madurai", state: "Tamil Nadu" },
  { name: "Tiruchirappalli", image: "/assets/city-logos/Tiruchirappalli.jpg", slug: "tiruchirappalli", state: "Tamil Nadu" },
];

/** Only the 4 supported states, in display order */
export const indianStates = [
  "Telangana",
  "Andhra Pradesh",
  "Karnataka",
  "Tamil Nadu",
] as const;

export type IndianState = (typeof indianStates)[number];

/** Cities grouped by state (state order matches indianStates) */
export function getCitiesByState(): Record<string, City[]> {
  const grouped: Record<string, City[]> = {};
  for (const state of indianStates) {
    grouped[state] = allCities.filter((c) => c.state === state);
  }
  return grouped;
}
