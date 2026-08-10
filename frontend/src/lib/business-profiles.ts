import { apiRequest } from "@/lib/api";
import type {
  BusinessDocument,
  BusinessProfile,
  BusinessProfileFilters,
  BusinessProfileFormValues,
  BusinessStatus,
  BusinessVenue,
  DocumentStatus,
  VerificationStatus,
  VenueListingStatus,
} from "@/app/admin/business-profile/types";

export interface BusinessProfileListParams {
  search?: string;
  status?: string;
  verification_status?: string;
  business_type?: string;
  city?: string;
  venue_owner_id?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

interface ApiOverview {
  total_venues: number;
  published_venues: number;
  pending_venues: number;
  inactive_venues: number;
  draft_venues: number;
  total_bookings: number;
  revenue: number;
  upcoming_events: number;
  verification_status: string;
  business_type: string;
  created_at?: string | null;
}

interface ApiDocument {
  id: string;
  name: string;
  document_type: string;
  status: string;
  file_name?: string | null;
  file_size?: string | null;
  file_url?: string | null;
  verified_by?: string | null;
  uploaded_date?: string | null;
}

interface ApiDetail {
  id: string;
  business_code: string;
  venue_owner_id: string;
  business_name: string;
  legal_business_name: string;
  business_type: string;
  years_in_business?: number | null;
  description?: string | null;
  website?: string | null;
  support_email?: string | null;
  support_phone?: string | null;
  alternate_phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  gst_number?: string | null;
  pan_number?: string | null;
  business_registration_number?: string | null;
  account_holder_name?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  cancelled_cheque_url?: string | null;
  bank_proof_file_name?: string | null;
  bank_proof_file_size?: string | null;
  bank_proof_uploaded_date?: string | null;
  verification_status: string;
  verification_notes?: string | null;
  status: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  initials: string;
  overview: ApiOverview;
  venues: Array<{
    id: string;
    venue_code: string;
    name: string;
    category?: string | null;
    capacity?: number | null;
    city?: string | null;
    status: string;
    rating?: number;
    bookings?: number;
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
  documents: ApiDocument[];
}

interface ApiListItem {
  id: string;
  business_code: string;
  business_name: string;
  legal_business_name: string;
  business_type: string;
  city?: string | null;
  status: string;
  verification_status: string;
  venue_owner_id: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  gst_number?: string | null;
  created_at: string;
  total_venues: number;
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
  business_profile: ApiDetail;
}

function mapStatus(value: string): BusinessStatus {
  if (value === "deleted") return "inactive";
  if (value === "active" || value === "inactive" || value === "pending") return value;
  return "pending";
}

function mapVerification(value: string): VerificationStatus {
  if (value === "verified" || value === "pending" || value === "rejected") return value;
  return "pending";
}

function mapDocument(doc: ApiDocument): BusinessDocument {
  const status = (doc.status as DocumentStatus) || "pending";
  return {
    id: doc.id,
    name: doc.name,
    status,
    uploadedDate: doc.uploaded_date || "",
    verifiedBy: doc.verified_by || "",
    fileName: doc.file_name || undefined,
    fileSize: doc.file_size || undefined,
  };
}

function mapVenue(v: ApiDetail["venues"][number]): BusinessVenue {
  return {
    id: v.id,
    venueId: v.venue_code,
    name: v.name,
    category: v.category || "",
    capacity: v.capacity || 0,
    city: v.city || "",
    status: (v.status as VenueListingStatus) || "pending",
    rating: v.rating || 0,
    bookings: v.bookings || 0,
  };
}

export function mapBusinessProfileDetail(api: ApiDetail): BusinessProfile {
  const overview = api.overview || {
    total_venues: 0,
    published_venues: 0,
    pending_venues: 0,
    inactive_venues: 0,
    draft_venues: 0,
    total_bookings: 0,
    revenue: 0,
    upcoming_events: 0,
    verification_status: api.verification_status,
    business_type: api.business_type,
  };
  return {
    id: api.id,
    businessId: api.business_code,
    businessName: api.business_name,
    legalBusinessName: api.legal_business_name,
    businessType: api.business_type,
    businessDescription: api.description || "",
    website: api.website || "",
    yearsInBusiness: api.years_in_business || 0,
    ownerId: api.venue_owner_id,
    ownerName: api.owner_name,
    ownerEmail: api.owner_email,
    ownerPhone: api.owner_phone,
    supportEmail: api.support_email || "",
    supportPhone: api.support_phone || "",
    alternatePhone: api.alternate_phone || "",
    addressLine1: api.address_line1 || "",
    addressLine2: api.address_line2 || "",
    city: api.city || "",
    state: api.state || "",
    country: api.country || "",
    zipCode: api.postal_code || "",
    gstNumber: api.gst_number || "",
    businessRegistrationNumber: api.business_registration_number || "",
    panNumber: api.pan_number || "",
    accountHolderName: api.account_holder_name || "",
    bankName: api.bank_name || "",
    accountNumber: api.account_number || "",
    ifscCode: api.ifsc_code || "",
    bankProofFileName: api.bank_proof_file_name || "",
    bankProofFileSize: api.bank_proof_file_size || "",
    bankProofUploadedDate: api.bank_proof_uploaded_date || "",
    notes: api.verification_notes || "",
    initials: api.initials || "BP",
    status: mapStatus(api.status),
    verification: mapVerification(api.verification_status),
    totalVenues: overview.total_venues || 0,
    publishedVenues: overview.published_venues || 0,
    pendingVenues: overview.pending_venues || 0,
    inactiveVenues: overview.inactive_venues || 0,
    draftVenues: overview.draft_venues || 0,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
    createdBy: api.created_by || "",
    updatedBy: api.updated_by || "",
    venues: (api.venues || []).map(mapVenue),
    documents: (api.documents || []).map(mapDocument),
  };
}

export function mapBusinessProfileListItem(api: ApiListItem): BusinessProfile {
  return {
    id: api.id,
    businessId: api.business_code,
    businessName: api.business_name,
    legalBusinessName: api.legal_business_name,
    businessType: api.business_type,
    businessDescription: "",
    website: "",
    yearsInBusiness: 0,
    ownerId: api.venue_owner_id,
    ownerName: api.owner_name,
    ownerEmail: api.owner_email,
    ownerPhone: api.owner_phone,
    supportEmail: "",
    supportPhone: "",
    alternatePhone: "",
    addressLine1: "",
    addressLine2: "",
    city: api.city || "",
    state: "",
    country: "",
    zipCode: "",
    gstNumber: api.gst_number || "",
    businessRegistrationNumber: "",
    panNumber: "",
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    bankProofFileName: "",
    bankProofFileSize: "",
    bankProofUploadedDate: "",
    notes: "",
    initials: api.initials || "BP",
    status: mapStatus(api.status),
    verification: mapVerification(api.verification_status),
    totalVenues: api.total_venues || 0,
    publishedVenues: 0,
    pendingVenues: 0,
    inactiveVenues: 0,
    draftVenues: 0,
    createdAt: api.created_at,
    updatedAt: api.created_at,
    createdBy: "",
    updatedBy: "",
    venues: [],
    documents: [],
  };
}

export function formToCreatePayload(form: BusinessProfileFormValues) {
  return {
    venue_owner_id: form.ownerId,
    business_name: form.businessName.trim(),
    legal_business_name: form.legalBusinessName.trim(),
    business_type: form.businessType.trim(),
    years_in_business: form.yearsInBusiness ? Number(form.yearsInBusiness) : null,
    description: form.businessDescription || null,
    website: form.website || null,
    support_email: form.supportEmail || null,
    support_phone: form.supportPhone || null,
    alternate_phone: form.alternatePhone || null,
    address_line1: form.addressLine1 || null,
    address_line2: form.addressLine2 || null,
    city: form.city || null,
    state: form.state || null,
    country: form.country || null,
    postal_code: form.zipCode || null,
    gst_number: form.gstNumber || null,
    pan_number: form.panNumber || null,
    business_registration_number: form.businessRegistrationNumber || null,
    account_holder_name: form.accountHolderName || null,
    bank_name: form.bankName || null,
    account_number: form.accountNumber || null,
    ifsc_code: form.ifscCode || null,
    bank_proof_file_name: form.bankProofFileName || null,
    bank_proof_file_size: form.bankProofFileSize || null,
    bank_proof_uploaded_date: form.bankProofUploadedDate || null,
    verification_status: form.verification,
    verification_notes: form.notes || null,
    status: form.status,
  };
}

export function formToUpdatePayload(form: BusinessProfileFormValues) {
  const { venue_owner_id: _owner, ...rest } = formToCreatePayload(form);
  void _owner;
  return rest;
}

export function filtersToParams(
  filters: BusinessProfileFilters,
  page: number,
  pageSize: number,
  sortKey: string,
  sortDir: "asc" | "desc"
): BusinessProfileListParams {
  const sortMap: Record<string, string> = {
    businessName: "business_name",
    createdAt: "created_at",
    totalVenues: "venue_count",
    businessId: "business_name",
    city: "business_name",
  };
  return {
    search: filters.search || undefined,
    status: filters.status || undefined,
    verification_status: filters.verification || undefined,
    business_type: filters.businessType || undefined,
    city: filters.city || undefined,
    venue_owner_id: filters.owner || undefined,
    date_from: filters.dateFrom || undefined,
    date_to: filters.dateTo || undefined,
    sort_by: sortMap[sortKey] || "business_name",
    sort_dir: sortDir,
    page,
    page_size: pageSize,
  };
}

export async function fetchBusinessProfiles(params: BusinessProfileListParams = {}) {
  return apiRequest<ListResponse>("/business-profiles", {
    params: params as Record<string, string | number | null | undefined>,
  });
}

export async function fetchBusinessProfile(id: string) {
  return apiRequest<ApiDetail>(`/business-profiles/${id}`);
}

export async function createBusinessProfile(
  payload: ReturnType<typeof formToCreatePayload>
) {
  return apiRequest<MutationResponse>("/business-profiles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateBusinessProfile(
  id: string,
  payload: Partial<ReturnType<typeof formToUpdatePayload>> & Record<string, unknown>
) {
  return apiRequest<MutationResponse>(`/business-profiles/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteBusinessProfile(id: string) {
  return apiRequest<{ success: boolean; message: string }>(`/business-profiles/${id}`, {
    method: "DELETE",
  });
}
