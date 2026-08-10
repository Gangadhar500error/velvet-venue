import { getVenueTypesForFilter } from "@/lib/routes";

export interface VenueFilterState {
  city: string;
  price_range: string;
  amenities: string[];
  availability: string;
  /** Multi-select venue type filter values (empty = all) */
  venue_types: string[];
  capacity: string;
  /** Multi-select event type values (empty = all) */
  event_types: string[];
  rating: string;
  indoor_outdoor: string;
  featured_only: boolean;
  popular_only: boolean;
  special_offers: boolean;
  /** Multi-select areas (empty = all areas) */
  areas: string[];
}

export const DEFAULT_VENUE_FILTERS = (city: string): VenueFilterState => ({
  city,
  price_range: "all",
  amenities: [],
  availability: "all",
  venue_types: [],
  capacity: "all",
  event_types: [],
  rating: "all",
  indoor_outdoor: "all",
  featured_only: false,
  popular_only: false,
  special_offers: false,
  areas: [],
});

export const AMENITY_MAP: Record<string, string> = {
  parking: "Parking",
  ac: "AC",
  stage: "Stage",
  rooms: "Rooms",
  swimming_pool: "Swimming Pool",
  lawn: "Lawn",
  dj: "DJ",
  decoration: "Decoration",
  generator: "Generator",
  catering: "Catering",
  photography: "Photography",
  valet_parking: "Valet Parking",
  pet_friendly: "Pet Friendly",
  food: "Catering",
  wheelchair: "Wheelchair Access",
  garden: "Lawn",
  projector: "Projector",
  wifi: "WiFi",
  outdoor: "Lawn",
  indoor: "AC",
  power_backup: "Generator",
  changing_rooms: "Rooms",
};

export const SIDEBAR_AMENITIES = [
  { id: "parking", label: "Parking" },
  { id: "ac", label: "AC" },
  { id: "dj", label: "DJ" },
  { id: "decoration", label: "Decoration" },
  { id: "swimming_pool", label: "Swimming Pool" },
  { id: "stage", label: "Stage" },
  { id: "food", label: "Food" },
  { id: "lawn", label: "Lawn" },
  { id: "garden", label: "Garden" },
  { id: "projector", label: "Projector" },
  { id: "wifi", label: "WiFi" },
  { id: "valet_parking", label: "Valet Parking" },
  { id: "changing_rooms", label: "Changing Rooms" },
  { id: "power_backup", label: "Power Backup" },
  { id: "outdoor", label: "Outdoor" },
  { id: "indoor", label: "Indoor" },
] as const;

export type ViewMode = "list" | "split" | "map";

export const PRICE_SLIDER_MIN = 0;
export const PRICE_SLIDER_MAX = 500000;
export const PRICE_SLIDER_STEP = 10000;

/** Union of workspace.type strings for selected venue type filters */
export function resolveVenueTypes(venueTypes: string[]): string[] | null {
  if (!venueTypes.length) return null;
  const set = new Set<string>();
  for (const value of venueTypes) {
    const types = getVenueTypesForFilter(value);
    types?.forEach((t) => set.add(t));
  }
  return set.size ? [...set] : null;
}

export function countActiveFilters(filters: VenueFilterState): number {
  let n = 0;
  n += filters.areas.length;
  n += filters.venue_types.length;
  n += filters.event_types.length;
  n += filters.amenities.length;
  if (filters.price_range !== "all") n += 1;
  if (filters.capacity !== "all") n += 1;
  if (filters.availability !== "all") n += 1;
  if (filters.rating !== "all") n += 1;
  if (filters.indoor_outdoor !== "all") n += 1;
  if (filters.featured_only) n += 1;
  if (filters.popular_only) n += 1;
  if (filters.special_offers) n += 1;
  return n;
}
