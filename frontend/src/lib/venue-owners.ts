import { apiRequest } from "@/lib/api";
import type {
  VenueOwner,
  VenueOwnerFilters,
  VenueOwnerFormValues,
  VenueOwnerStatus,
  VerificationStatus,
  RegistrationSource,
  Gender,
} from "@/app/admin/venue-owners/types";

export interface VenueOwnerListParams {
  search?: string;
  status?: string;
  registration_source?: string;
  verification_status?: string;
  city?: string;
  business_type?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

interface ApiOverview {
  business_profiles_count: number;
  venues_count: number;
  total_bookings: number;
  revenue: number;
  pending_payments: number;
  completed_events: number;
  upcoming_events: number;
  verification_status: string;
}

interface ApiDetail {
  id: string;
  owner_code: string;
  user_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  mobile: string;
  alternate_mobile?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  profile_image?: string | null;
  business_name?: string | null;
  business_type?: string | null;
  registration_source: string;
  verification_status: string;
  status: string;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  gst_number?: string | null;
  pan_number?: string | null;
  website?: string | null;
  description?: string | null;
  member_since: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  initials: string;
  overview: ApiOverview;
  business_profiles: Array<{
    id: string;
    business_name: string;
    business_type?: string | null;
    city?: string | null;
    status: string;
  }>;
  venues: Array<{
    id: string;
    name: string;
    venue_type?: string | null;
    capacity?: number | null;
    city?: string | null;
    status: string;
  }>;
  recent_bookings: Array<{
    id: string;
    booking_code: string;
    customer_name: string;
    venue_name: string;
    event_date?: string | null;
    amount: number;
    status: string;
  }>;
}

interface ApiListItem {
  id: string;
  owner_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  mobile: string;
  business_name?: string | null;
  business_type?: string | null;
  city?: string | null;
  country?: string | null;
  status: string;
  verification_status: string;
  registration_source: string;
  profile_image?: string | null;
  created_at: string;
  business_profiles_count: number;
  venues_count: number;
  bookings_count: number;
  revenue: number;
  initials: string;
}

interface ListResponse {
  success: boolean;
  items: ApiListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface MutationResponse {
  success: boolean;
  message: string;
  venue_owner: ApiDetail;
  existed: boolean;
}

function mapSource(value: string): RegistrationSource {
  if (value === "mobile_app") return "website";
  if (value === "referral" || value === "admin" || value === "website") return value;
  return "admin";
}

function mapStatus(value: string): VenueOwnerStatus {
  if (value === "deleted") return "inactive";
  if (value === "active" || value === "inactive" || value === "pending") return value;
  return "pending";
}

function mapVerification(value: string): VerificationStatus {
  if (value === "verified" || value === "pending" || value === "rejected") return value;
  return "pending";
}

const emptyOverview = {
  businessProfilesCount: 0,
  venuesCount: 0,
  totalBookings: 0,
  revenue: 0,
  pendingPayments: 0,
  completedEvents: 0,
  upcomingEvents: 0,
};

export function mapVenueOwnerDetail(api: ApiDetail): VenueOwner {
  const overview = api.overview;
  return {
    id: api.id,
    ownerId: api.owner_code,
    firstName: api.first_name,
    lastName: api.last_name,
    name: api.full_name,
    email: api.email,
    phone: api.mobile,
    alternateMobile: api.alternate_mobile || "",
    gender: (api.gender as Gender) || undefined,
    businessName: api.business_name || "",
    businessType: api.business_type || "",
    city: api.city || "",
    country: api.country || "",
    addressLine1: api.address_line1 || undefined,
    addressLine2: api.address_line2 || undefined,
    state: api.state || undefined,
    zipCode: api.postal_code || undefined,
    avatar: api.profile_image || undefined,
    initials: api.initials || "VO",
    status: mapStatus(api.status),
    verification: mapVerification(api.verification_status),
    source: mapSource(api.registration_source),
    assignedBusinesses: overview?.business_profiles_count || 0,
    totalVenues: overview?.venues_count || 0,
    registrationDate: api.created_at.slice(0, 10),
    lastLogin: "",
    memberSince: api.member_since.slice(0, 10),
    createdBy: api.created_by || "",
    createdAt: api.created_at,
    updatedBy: api.updated_by || "",
    updatedAt: api.updated_at,
    overview: {
      businessProfilesCount: overview?.business_profiles_count || 0,
      venuesCount: overview?.venues_count || 0,
      totalBookings: overview?.total_bookings || 0,
      revenue: overview?.revenue || 0,
      pendingPayments: overview?.pending_payments || 0,
      completedEvents: overview?.completed_events || 0,
      upcomingEvents: overview?.upcoming_events || 0,
    },
    businesses: (api.business_profiles || []).map((b) => ({
      id: b.id,
      name: b.business_name,
      businessType: b.business_type || "",
      city: b.city || "",
      status: (b.status as "active" | "inactive" | "pending") || "pending",
    })),
    venues: (api.venues || []).map((v) => ({
      id: v.id,
      name: v.name,
      venueType: v.venue_type || "",
      capacity: v.capacity ?? null,
      city: v.city || "",
      status: v.status,
    })),
    recentBookings: (api.recent_bookings || []).map((b) => ({
      id: b.id,
      bookingId: b.booking_code,
      venue: b.venue_name,
      customer: b.customer_name,
      eventType: "",
      amount: b.amount,
      status: (b.status as "upcoming" | "completed" | "cancelled" | "pending") || "pending",
      date: b.event_date || "",
    })),
  };
}

export function mapVenueOwnerListItem(api: ApiListItem): VenueOwner {
  return {
    id: api.id,
    ownerId: api.owner_code,
    firstName: api.first_name,
    lastName: api.last_name,
    name: api.full_name,
    email: api.email,
    phone: api.mobile,
    alternateMobile: "",
    businessName: api.business_name || "",
    businessType: api.business_type || "",
    city: api.city || "",
    country: api.country || "",
    initials: api.initials || "VO",
    status: mapStatus(api.status),
    verification: mapVerification(api.verification_status),
    source: mapSource(api.registration_source),
    assignedBusinesses: api.business_profiles_count || 0,
    totalVenues: api.venues_count || 0,
    registrationDate: api.created_at.slice(0, 10),
    lastLogin: "",
    memberSince: api.created_at.slice(0, 10),
    createdBy: "",
    createdAt: api.created_at,
    updatedBy: "",
    updatedAt: api.created_at,
    overview: {
      ...emptyOverview,
      businessProfilesCount: api.business_profiles_count || 0,
      venuesCount: api.venues_count || 0,
      totalBookings: api.bookings_count || 0,
      revenue: api.revenue || 0,
    },
    businesses: [],
    venues: [],
    recentBookings: [],
  };
}

export function formToCreatePayload(form: VenueOwnerFormValues) {
  return {
    first_name: form.firstName.trim(),
    last_name: form.lastName.trim(),
    email: form.email.trim().toLowerCase(),
    mobile: form.phone.trim(),
    alternate_mobile: form.alternateMobile || null,
    gender: form.gender || null,
    business_name: form.businessName || null,
    business_type: form.businessType || null,
    registration_source: form.source,
    status: form.status,
    verification_status: form.verification,
    address_line1: form.addressLine1 || null,
    address_line2: form.addressLine2 || null,
    city: form.city || null,
    state: form.state || null,
    country: form.country || null,
    postal_code: form.zipCode || null,
    return_existing: false,
  };
}

export function formToUpdatePayload(form: VenueOwnerFormValues) {
  const payload = formToCreatePayload(form);
  const { registration_source: _source, return_existing: _existed, ...update } = payload;
  void _source;
  void _existed;
  return update;
}

export function filtersToParams(
  filters: VenueOwnerFilters,
  page: number,
  pageSize: number,
  sortKey: string,
  sortDir: "asc" | "desc"
): VenueOwnerListParams {
  const sortMap: Record<string, string> = {
    name: "name",
    registrationDate: "registration_date",
    assignedBusinesses: "businesses",
    ownerId: "name",
    city: "name",
  };
  return {
    search: filters.search || undefined,
    status: filters.status || undefined,
    city: filters.city || undefined,
    registration_source: filters.source || undefined,
    verification_status: filters.verification || undefined,
    date_from: filters.dateFrom || undefined,
    date_to: filters.dateTo || undefined,
    sort_by: sortMap[sortKey] || "name",
    sort_dir: sortDir,
    page,
    page_size: pageSize,
  };
}

export async function fetchVenueOwners(params: VenueOwnerListParams = {}) {
  return apiRequest<ListResponse>("/venue-owners", {
    params: params as Record<string, string | number | null | undefined>,
  });
}

export async function fetchVenueOwner(id: string) {
  return apiRequest<ApiDetail>(`/venue-owners/${id}`);
}

export async function createVenueOwner(payload: ReturnType<typeof formToCreatePayload>) {
  return apiRequest<MutationResponse>("/venue-owners", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateVenueOwner(
  id: string,
  payload: ReturnType<typeof formToUpdatePayload>
) {
  return apiRequest<MutationResponse>(`/venue-owners/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteVenueOwner(id: string) {
  return apiRequest<{ success: boolean; message: string }>(`/venue-owners/${id}`, {
    method: "DELETE",
  });
}
