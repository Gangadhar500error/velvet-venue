import { apiRequest } from "@/lib/api";
import type {
  ApprovalStatus,
  BookingModel,
  FoodSlot,
  PricingMethod,
  PricingSlot,
  Venue,
  VenueDocument,
  VenueFilters,
  VenueFormValues,
  VenueStatus,
  DocumentStatus,
} from "@/app/admin/venues/types";
import {
  defaultAddons,
  defaultFoodPricing,
  defaultFoodSlots,
  defaultPricingSlots,
} from "@/app/admin/venues/data";

export interface VenueListParams {
  search?: string;
  status?: string;
  approval_status?: string;
  category?: string;
  venue_type?: string;
  city?: string;
  business_profile_id?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

interface ApiPricing {
  id?: string | null;
  pricing_mode: string;
  pricing_type: string;
  gst_percent: number;
  gst_mode: string;
  advance_percent: number;
  booking_window_days: number;
  minimum_notice_hours: number;
  operating_hours?: string | null;
  booking_confirmation: string;
  cancellation_preset?: string | null;
  slots: Array<{
    id: string;
    key: string;
    name: string;
    enabled: boolean;
    time_label?: string | null;
    price: number;
    min_booking_amount: number;
    max_guests?: number | null;
    display_order: number;
  }>;
  food_slots: Array<{
    id: string;
    key: string;
    name: string;
    enabled: boolean;
    time_label?: string | null;
    veg_plate_cost: number;
    non_veg_plate_cost: number;
    min_guests?: number | null;
    max_guests?: number | null;
    display_order: number;
  }>;
}

interface ApiDetail {
  id: string;
  venue_code: string;
  business_profile_id: string;
  business_name: string;
  owner_id?: string | null;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  venue_name: string;
  category?: string | null;
  venue_type?: string | null;
  short_description?: string | null;
  description?: string | null;
  house_rules?: string | null;
  highlights?: string | null;
  featured: boolean;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  google_map_url?: string | null;
  landmark?: string | null;
  minimum_guests?: number | null;
  maximum_guests?: number | null;
  seating_capacity?: number | null;
  dining_capacity?: number | null;
  floating_capacity?: number | null;
  venue_status: string;
  approval_status: string;
  availability_status: string;
  operating_hours?: string | null;
  weekly_off?: string | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  contact_person?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  support_email?: string | null;
  support_phone?: string | null;
  notes?: string | null;
  smoking_policy?: string | null;
  alcohol_policy?: string | null;
  outside_catering: boolean;
  outside_decorations: boolean;
  outside_photography: boolean;
  pets_allowed: boolean;
  cancellation_policy?: string | null;
  refund_policy?: string | null;
  cover_image_url?: string | null;
  video_url?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  initials: string;
  overview: {
    todays_bookings: number;
    upcoming_events: number;
    revenue: number;
    average_rating: number;
    reviews_count: number;
    availability_status: string;
    opening_hours?: string | null;
  };
  business_profile?: {
    id: string;
    business_name: string;
    business_type?: string | null;
    logo?: string | null;
    verified?: boolean;
  } | null;
  owner?: {
    id?: string | null;
    name?: string;
    email?: string;
    phone?: string;
  } | null;
  location?: {
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postal_code?: string | null;
    latitude?: string | null;
    longitude?: string | null;
    google_map_url?: string | null;
    landmark?: string | null;
  } | null;
  amenities: Array<string | { id?: string; name?: string; icon?: string; category?: string }>;
  services: Array<string | { id?: string; name?: string; icon?: string; description?: string }>;
  event_categories: Array<string | { id?: string; name?: string }>;
  pricing: ApiPricing;
  gallery: Array<{
    id: string;
    image_url: string;
    thumbnail_url?: string | null;
    title?: string | null;
    image_type: string;
    media_type?: string;
    is_cover?: boolean;
    caption?: string | null;
    display_order: number;
  }>;
  documents: Array<{
    id: string;
    name: string;
    document_type: string;
    status: string;
    file_name?: string | null;
    file_size?: string | null;
    file_url?: string | null;
    verified_by?: string | null;
    expiry_date?: string | null;
    verified_at?: string | null;
    uploaded_date?: string | null;
  }>;
  booking_summary?: {
    today_bookings?: number;
    upcoming_bookings?: number;
    completed_bookings?: number;
    cancelled_bookings?: number;
  };
  reviews?:
    | Array<{ id: string; customer_name?: string; rating: number; comment?: string | null }>
    | {
        average_rating?: number;
        total_reviews?: number;
        items?: Array<{
          id: string;
          customer_name: string;
          rating: number;
          comment?: string | null;
          event_type?: string | null;
          created_at: string;
          reply?: string | null;
        }>;
      };
  availability?: Array<{
    date: string;
    status: string;
    slots?: Array<{ slot_name: string; status: string }>;
  }>;
}

function catalogNames(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "name" in item) {
        return String((item as { name?: string }).name || "");
      }
      return "";
    })
    .filter(Boolean);
}

interface ApiListItem {
  id: string;
  venue_code: string;
  venue_name: string;
  category?: string | null;
  venue_type?: string | null;
  city?: string | null;
  venue_status: string;
  approval_status: string;
  availability_status: string;
  seating_capacity?: number | null;
  maximum_guests?: number | null;
  business_profile_id: string;
  business_name: string;
  owner_name: string;
  featured: boolean;
  cover_image_url?: string | null;
  starting_price: number;
  rating: number;
  total_bookings: number;
  created_at: string;
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
  venue: ApiDetail;
}

function mapStatus(value: string): VenueStatus {
  if (
    value === "published" ||
    value === "draft" ||
    value === "pending" ||
    value === "inactive" ||
    value === "archived"
  ) {
    return value;
  }
  return "draft";
}

function mapApproval(value: string): ApprovalStatus {
  if (value === "approved" || value === "pending" || value === "rejected") return value;
  return "pending";
}

function mapSlots(pricing: ApiPricing): PricingSlot[] {
  if (!pricing?.slots?.length) return defaultPricingSlots();
  return pricing.slots.map((s) => ({
    id: s.id,
    key: s.key,
    name: s.name,
    enabled: s.enabled,
    timeLabel: s.time_label || "",
    price: s.price,
    minBookingAmount: s.min_booking_amount,
    maxGuests: s.max_guests || 0,
  }));
}

function mapFoodSlots(pricing: ApiPricing): FoodSlot[] {
  if (!pricing?.food_slots?.length) return defaultFoodSlots();
  return pricing.food_slots.map((s) => ({
    id: s.id,
    key: s.key,
    name: s.name,
    enabled: s.enabled,
    timeLabel: s.time_label || "",
    vegPlateCost: s.veg_plate_cost,
    nonVegPlateCost: s.non_veg_plate_cost,
    minGuests: s.min_guests || 0,
    maxGuests: s.max_guests || 0,
  }));
}

function mapDocuments(docs: ApiDetail["documents"]): VenueDocument[] {
  return (docs || []).map((d) => ({
    id: d.id,
    name: d.name,
    status: (d.status as DocumentStatus) || "pending",
    uploadedDate: d.uploaded_date || "",
    verifiedBy: d.verified_by || "",
    fileName: d.file_name || undefined,
    fileSize: d.file_size || undefined,
  }));
}

export function mapVenueDetail(api: ApiDetail): Venue {
  const pricing = api.pricing || {
    pricing_mode: "full_day",
    pricing_type: "venue_only",
    gst_percent: 18,
    gst_mode: "excluded",
    advance_percent: 25,
    booking_window_days: 180,
    minimum_notice_hours: 24,
    booking_confirmation: "manual",
    slots: [],
    food_slots: [],
  };
  const gallery = api.gallery || [];
  const cover =
    api.cover_image_url ||
    gallery.find((g) => g.is_cover || g.image_type === "cover")?.image_url ||
    "";
  const bookingModel = (pricing.pricing_type === "venue_food"
    ? "venue_food"
    : "venue_only") as BookingModel;
  const pricingMethod = (pricing.pricing_mode === "slot_based"
    ? "slot_based"
    : "full_day") as PricingMethod;
  const overview = api.overview || {
    todays_bookings: 0,
    upcoming_events: 0,
    revenue: 0,
    average_rating: 0,
    reviews_count: 0,
    availability_status: api.availability_status,
  };
  const amenityNames = catalogNames(api.amenities);
  const eventNames = catalogNames(api.event_categories);
  const reviewsBlock = Array.isArray(api.reviews)
    ? { average_rating: overview.average_rating, total_reviews: api.reviews.length, items: api.reviews }
    : api.reviews || { average_rating: overview.average_rating, total_reviews: overview.reviews_count, items: [] };
  const bookingSummary = api.booking_summary || {};

  return {
    id: api.id,
    venueId: api.venue_code,
    name: api.venue_name,
    businessId: api.business_profile_id,
    businessName: api.business_name || api.business_profile?.business_name || "",
    ownerId: api.owner_id || api.owner?.id || "",
    ownerName: api.owner_name || api.owner?.name || "",
    ownerEmail: api.owner_email || api.owner?.email || "",
    ownerPhone: api.owner_phone || api.owner?.phone || "",
    supportEmail: api.support_email || "",
    supportPhone: api.support_phone || "",
    category: api.category || "",
    venueType: api.venue_type || "",
    status: mapStatus(api.venue_status),
    approval: mapApproval(api.approval_status),
    featured: api.featured,
    shortDescription: api.short_description || "",
    detailedDescription: api.description || "",
    highlights: (api.highlights || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    houseRules: api.house_rules || "",
    coverImage: cover,
    galleryImages: gallery.filter((g) => g.image_type === "gallery").map((g) => g.image_url),
    images360: gallery.filter((g) => g.image_type === "360").map((g) => g.image_url),
    videoUrl: api.video_url || "",
    addressLine1: api.address_line1 || api.location?.address_line1 || "",
    addressLine2: api.address_line2 || api.location?.address_line2 || "",
    city: api.city || api.location?.city || "",
    state: api.state || api.location?.state || "",
    country: api.country || api.location?.country || "",
    zipCode: api.postal_code || api.location?.postal_code || "",
    mapsLink: api.google_map_url || api.location?.google_map_url || "",
    latitude: api.latitude || api.location?.latitude || "",
    longitude: api.longitude || api.location?.longitude || "",
    seatingCapacity: api.seating_capacity || 0,
    diningCapacity: api.dining_capacity || 0,
    floatingCapacity: api.floating_capacity || 0,
    theatreCapacity: 0,
    classroomCapacity: 0,
    standingCapacity: 0,
    startingPrice: mapSlots(pricing).find((s) => s.key === "full_day")?.price || 0,
    weekendPrice: 0,
    peakPrice: 0,
    securityDeposit: 0,
    cleaningCharges: 0,
    bookingModel,
    pricingMethod,
    foodPricingMethod: "slot_based",
    pricingSlots: mapSlots(pricing),
    foodPricing: defaultFoodPricing(),
    foodSlots: mapFoodSlots(pricing),
    addons: (api.services || []).map((item, i) => {
      if (typeof item === "string") {
        return { id: `svc-${i}`, name: item, active: true };
      }
      return { id: item.id || `svc-${i}`, name: item.name || "", active: true };
    }),
    minOnlineBookingAmount: 0,
    onlineBookingAmountMode: "percent",
    gstMode: (pricing.gst_mode as "included" | "excluded") || "excluded",
    gstPercent: pricing.gst_percent,
    cancellationPreset: (pricing.cancellation_preset as Venue["cancellationPreset"]) || "Moderate",
    bookingConfirmation:
      (pricing.booking_confirmation as Venue["bookingConfirmation"]) || "manual",
    maxAdvanceBookingDays: pricing.booking_window_days,
    minNoticePeriodHours: pricing.minimum_notice_hours,
    balancePaymentDue: "At venue",
    taxNotes: "",
    amenities: amenityNames,
    cancellationPolicy: api.cancellation_policy || "",
    refundPolicy: api.refund_policy || "",
    advancePaymentPercent: pricing.advance_percent,
    smokingPolicy: api.smoking_policy || "",
    alcoholPolicy: api.alcohol_policy || "",
    outsideCatering: api.outside_catering,
    outsideDecorations: api.outside_decorations,
    outsidePhotography: api.outside_photography,
    petsAllowed: api.pets_allowed,
    noiseRestrictions: "",
    notes: api.notes || "",
    nearbyLandmark: api.landmark || api.location?.landmark || "",
    contactPerson: api.contact_person || "",
    contactPhone: api.contact_phone || "",
    contactEmail: api.contact_email || "",
    parkingCapacity: 0,
    wheelchairAccessible: false,
    powerBackup: false,
    liftAvailable: false,
    kitchenAvailable: false,
    bridalRoomCount: 0,
    restroomCount: 0,
    indoorArea: "",
    outdoorArea: "",
    displayPriority: 0,
    initials: api.initials || "VN",
    rating: reviewsBlock.average_rating || overview.average_rating || 0,
    totalReviews: reviewsBlock.total_reviews || overview.reviews_count || 0,
    totalBookings: 0,
    upcomingBookings: bookingSummary.upcoming_bookings || overview.upcoming_events || 0,
    completedBookings: bookingSummary.completed_bookings || 0,
    cancelledBookings: bookingSummary.cancelled_bookings || 0,
    revenue: overview.revenue || 0,
    todaysBookings: bookingSummary.today_bookings || overview.todays_bookings || 0,
    availabilityLabel:
      (api.availability_status as Venue["availabilityLabel"]) || "available",
    minGuests: api.minimum_guests || 0,
    maxGuests: api.maximum_guests || 0,
    operatingHours: api.operating_hours || "",
    bookingDuration: "",
    weeklyOff: api.weekly_off || "",
    checkInTime: api.check_in_time || "",
    checkOutTime: api.check_out_time || "",
    eventCategories: eventNames,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
    createdBy: api.created_by || "",
    updatedBy: api.updated_by || "",
    bookings: [],
    reviews: (reviewsBlock.items || []).map((item) => ({
      id: item.id,
      customerName: item.customer_name || "Guest",
      rating: item.rating,
      comment: item.comment || "",
      date: "created_at" in item ? String(item.created_at || "") : "",
      eventType: "event_type" in item ? String(item.event_type || "") : "",
    })),
    documents: mapDocuments(api.documents),
    availability: (api.availability || []).map((day) => ({
      date: String(day.date),
      status: day.status as Venue["availability"][number]["status"],
      slot: (day.slots || []).map((slot) => slot.slot_name).join(", ") || undefined,
    })),
    ratingDistribution: [],
  };
}

export function mapVenueListItem(api: ApiListItem): Venue {
  return {
    ...mapVenueDetail({
      id: api.id,
      venue_code: api.venue_code,
      business_profile_id: api.business_profile_id,
      business_name: api.business_name,
      owner_name: api.owner_name,
      owner_email: "",
      owner_phone: "",
      venue_name: api.venue_name,
      category: api.category,
      venue_type: api.venue_type,
      featured: api.featured,
      city: api.city,
      seating_capacity: api.seating_capacity,
      maximum_guests: api.maximum_guests,
      venue_status: api.venue_status,
      approval_status: api.approval_status,
      availability_status: api.availability_status,
      cover_image_url: api.cover_image_url,
      outside_catering: false,
      outside_decorations: false,
      outside_photography: false,
      pets_allowed: false,
      created_at: api.created_at,
      updated_at: api.created_at,
      initials: api.initials,
      overview: {
        todays_bookings: 0,
        upcoming_events: 0,
        revenue: 0,
        average_rating: api.rating,
        reviews_count: 0,
        availability_status: api.availability_status,
      },
      amenities: [],
      services: [],
      event_categories: [],
      pricing: {
        pricing_mode: "full_day",
        pricing_type: "venue_only",
        gst_percent: 18,
        gst_mode: "excluded",
        advance_percent: 25,
        booking_window_days: 180,
        minimum_notice_hours: 24,
        booking_confirmation: "manual",
        slots: [
          {
            id: "list",
            key: "full_day",
            name: "Full Day",
            enabled: true,
            price: api.starting_price,
            min_booking_amount: 0,
            display_order: 0,
          },
        ],
        food_slots: [],
      },
      gallery: [],
      documents: [],
    }),
    startingPrice: api.starting_price,
    totalBookings: api.total_bookings,
    rating: api.rating,
  };
}

export function formToCreatePayload(form: VenueFormValues) {
  const pricingType = form.bookingModel === "venue_food" ? "venue_food" : "venue_only";
  const pricingMode = form.pricingMethod === "slot_based" ? "slot_based" : "full_day";
  return {
    business_profile_id: form.businessId,
    venue_name: form.name.trim(),
    category: form.category || null,
    venue_type: form.venueType || null,
    short_description: form.shortDescription || null,
    description: form.detailedDescription || null,
    house_rules: form.houseRules || null,
    highlights: form.highlights || null,
    featured: form.featured,
    address_line1: form.addressLine1 || null,
    address_line2: form.addressLine2 || null,
    city: form.city || null,
    state: form.state || null,
    country: form.country || null,
    postal_code: form.zipCode || null,
    latitude: form.latitude || null,
    longitude: form.longitude || null,
    google_map_url: form.mapsLink || null,
    landmark: form.nearbyLandmark || null,
    minimum_guests: Number(form.minGuests) || null,
    maximum_guests: Number(form.maxGuests) || null,
    seating_capacity: Number(form.seatingCapacity) || null,
    dining_capacity: Number(form.diningCapacity) || null,
    floating_capacity: Number(form.floatingCapacity) || null,
    venue_status: form.status,
    approval_status: form.approval,
    operating_hours: form.operatingHours || null,
    weekly_off: form.weeklyOff || null,
    check_in_time: form.checkInTime || null,
    check_out_time: form.checkOutTime || null,
    contact_person: form.contactPerson || null,
    contact_phone: form.contactPhone || null,
    contact_email: form.contactEmail || null,
    support_email: form.supportEmail || null,
    support_phone: form.supportPhone || null,
    notes: form.notes || null,
    smoking_policy: form.smokingPolicy || null,
    alcohol_policy: form.alcoholPolicy || null,
    outside_catering: form.outsideCatering,
    outside_decorations: form.outsideDecorations,
    outside_photography: form.outsidePhotography,
    pets_allowed: form.petsAllowed,
    cancellation_policy: form.cancellationPolicy || null,
    refund_policy: form.refundPolicy || null,
    amenities: form.amenities || [],
    services: (form.addons || []).filter((a) => a.active !== false).map((a) => a.name),
    event_categories: form.eventCategories || [],
    pricing: {
      pricing_mode: pricingMode,
      pricing_type: pricingType,
      gst_percent: Number(form.gstPercent) || 18,
      gst_mode: form.gstMode || "excluded",
      advance_percent: Number(form.advancePaymentPercent) || 25,
      booking_window_days: Number(form.maxAdvanceBookingDays) || 180,
      minimum_notice_hours: Number(form.minNoticePeriodHours) || 24,
      operating_hours: form.operatingHours || null,
      booking_confirmation: form.bookingConfirmation || "manual",
      cancellation_preset: form.cancellationPreset || null,
      slots: (() => {
        const all = form.pricingSlots || [];
        const filtered =
          pricingMode === "full_day"
            ? all.filter((s) => s.key === "full_day")
            : all.filter((s) => s.key !== "full_day");
        return (filtered.length ? filtered : all).map((s, i) => ({
          id: /^[0-9a-f-]{36}$/i.test(s.id) ? s.id : undefined,
          key: s.key,
          name: s.name,
          enabled: s.enabled,
          time_label: s.timeLabel || null,
          price: Number(s.price) || 0,
          min_booking_amount: Number(s.minBookingAmount) || 0,
          max_guests: Number(s.maxGuests) || null,
          display_order: i,
        }));
      })(),
      food_slots:
        pricingType === "venue_food"
          ? (form.foodSlots || []).map((s, i) => ({
              id: /^[0-9a-f-]{36}$/i.test(s.id) ? s.id : undefined,
              key: s.key,
              name: s.name,
              enabled: s.enabled,
              time_label: s.timeLabel || null,
              veg_plate_cost: Number(s.vegPlateCost) || 0,
              non_veg_plate_cost: Number(s.nonVegPlateCost) || 0,
              min_guests: Number(s.minGuests) || null,
              max_guests: Number(s.maxGuests) || null,
              display_order: i,
            }))
          : [],
    },
  };
}

export function formToUpdatePayload(form: VenueFormValues) {
  const { business_profile_id: _bp, ...rest } = formToCreatePayload(form);
  void _bp;
  return rest;
}

export function filtersToParams(
  filters: VenueFilters,
  page: number,
  pageSize: number,
  sortKey: string,
  sortDir: "asc" | "desc"
): VenueListParams {
  const sortMap: Record<string, string> = {
    name: "venue_name",
    createdAt: "created_at",
    city: "city",
    seatingCapacity: "capacity",
    venueId: "venue_name",
  };
  return {
    search: filters.search || undefined,
    status: filters.status || undefined,
    approval_status: filters.approval || undefined,
    category: filters.category || undefined,
    city: filters.city || undefined,
    business_profile_id: filters.businessId || undefined,
    sort_by: sortMap[sortKey] || "venue_name",
    sort_dir: sortDir,
    page,
    page_size: pageSize,
  };
}

export interface VenueSearchItem {
  id: string;
  venue_code: string;
  venue_name: string;
  business_name: string;
  city?: string | null;
  category?: string | null;
  pricing_mode?: string | null;
  availability_status: string;
}

export interface VenueSearchResponse {
  success: boolean;
  items: VenueSearchItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export async function searchVenues(q = "", page = 1, limit = 20) {
  return apiRequest<VenueSearchResponse>("/venues/search", {
    params: { q, page, limit },
  });
}

export async function fetchVenues(params: VenueListParams = {}) {
  return apiRequest<ListResponse>("/venues", {
    params: params as Record<string, string | number | null | undefined>,
  });
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isVenueUuid(value: string) {
  return UUID_RE.test(value.trim());
}

export async function fetchVenue(id: string) {
  const key = id.trim();
  if (isVenueUuid(key)) {
    return apiRequest<ApiDetail>(`/venues/${key}`);
  }
  const found = await searchVenues(key, 1, 5);
  const match =
    found.items.find((row) => row.venue_code === key || row.id === key) || found.items[0];
  if (!match) {
    throw new Error("Venue not found.");
  }
  return apiRequest<ApiDetail>(`/venues/${match.id}`);
}

export async function createVenue(
  payload: ReturnType<typeof formToCreatePayload> & Record<string, unknown>
) {
  return apiRequest<MutationResponse>("/venues", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateVenue(
  id: string,
  payload: Partial<ReturnType<typeof formToUpdatePayload>> & Record<string, unknown>
) {
  return apiRequest<MutationResponse>(`/venues/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteVenue(id: string) {
  return apiRequest<{ success: boolean; message: string }>(`/venues/${id}`, {
    method: "DELETE",
  });
}

export async function fetchVenueMeta() {
  return apiRequest<{
    success: boolean;
    amenities: string[];
    services: string[];
    event_types: string[];
    cities: string[];
  }>("/venues/meta");
}
