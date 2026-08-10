/** Central public route helpers for Velvet Venues */

export const ROUTES = {
  home: "/",
  venues: "/venues",
  search: "/search",
  booking: "/booking",
  profile: "/profile",
  wishlist: "/wishlist",
} as const;

/** Client-side venue type filter options (no URL / category routes) */
export const VENUE_TYPE_FILTERS = [
  { value: "all", label: "All Venues", types: [] as string[] },
  {
    value: "wedding",
    label: "Wedding Venues",
    types: ["Wedding Venue", "Luxury Venue"],
  },
  {
    value: "banquet",
    label: "Banquet Halls",
    types: ["Banquet Hall", "Function Hall"],
  },
  {
    value: "farm-house",
    label: "Farm Houses",
    types: ["Farm House"],
  },
  {
    value: "resorts-hotels",
    label: "Resorts & Hotels",
    types: ["Resort", "Hotel", "Beach Venue"],
  },
  {
    value: "party",
    label: "Party Halls",
    types: ["Party Hall"],
  },
  {
    value: "conference",
    label: "Conference Venues",
    types: ["Conference Venue"],
  },

  {
    value: "destination-wedding",
    label: "Destination Wedding Venues",
    types: ["Luxury Venue", "Beach Venue", "Resort"],
  },
] as const;

export type VenueTypeFilterValue = (typeof VENUE_TYPE_FILTERS)[number]["value"];

export function getVenueTypesForFilter(value: string): string[] | null {
  if (!value || value === "all") return null;
  const match = VENUE_TYPE_FILTERS.find((f) => f.value === value);
  return match ? [...match.types] : null;
}

/** City (and optional venue detail) paths — never category segments or ?category= */
export function venuesPath(citySlug?: string, venueId?: string): string {
  if (citySlug && venueId) return `/venues/${citySlug}/${venueId}`;
  if (citySlug) return `/venues/${citySlug}`;
  return "/";
}

export function citySlugFromName(cityName: string): string {
  return cityName.toLowerCase().replace(/\s+/g, "-");
}

/** sessionStorage key for hero → city page initial venue type (URL stays clean) */
export const VENUE_TYPE_FILTER_KEY = "vv_venue_type_filter";
