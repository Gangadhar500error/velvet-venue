import { apiRequest } from "@/lib/api";
import type {
  BusinessBankAccount,
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
  bank_accounts?: Array<{
    id: string;
    account_holder_name?: string | null;
    bank_name?: string | null;
    account_number?: string | null;
    ifsc_code?: string | null;
    cancelled_cheque_url?: string | null;
    bank_proof_file_name?: string | null;
    bank_proof_file_size?: string | null;
    bank_proof_uploaded_date?: string | null;
    is_primary?: boolean;
    sort_order?: number;
  }>;
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
  support_email?: string | null;
  support_phone?: string | null;
  address_line1?: string | null;
  state?: string | null;
  pan_number?: string | null;
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
    fileUrl: doc.file_url || undefined,
  };
}

/** Map an upload/API document payload into UI document shape. */
export function mapDocumentFromUpload(doc: ApiDocument): BusinessDocument {
  return mapDocument(doc);
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

function mapBankAccount(
  bank: NonNullable<ApiDetail["bank_accounts"]>[number]
): BusinessBankAccount {
  return {
    id: bank.id,
    accountHolderName: bank.account_holder_name || "",
    bankName: bank.bank_name || "",
    accountNumber: bank.account_number || "",
    ifscCode: bank.ifsc_code || "",
    bankProofFileName: bank.bank_proof_file_name || "",
    bankProofFileSize: bank.bank_proof_file_size || "",
    bankProofUploadedDate: bank.bank_proof_uploaded_date || "",
    bankProofFileUrl: bank.cancelled_cheque_url || undefined,
    isPrimary: Boolean(bank.is_primary),
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
  const bankAccounts =
    api.bank_accounts && api.bank_accounts.length > 0
      ? api.bank_accounts.map(mapBankAccount)
      : api.account_holder_name || api.bank_name || api.account_number || api.ifsc_code
        ? [
            {
              id: `legacy-${api.id}`,
              accountHolderName: api.account_holder_name || "",
              bankName: api.bank_name || "",
              accountNumber: api.account_number || "",
              ifscCode: api.ifsc_code || "",
              bankProofFileName: api.bank_proof_file_name || "",
              bankProofFileSize: api.bank_proof_file_size || "",
              bankProofUploadedDate: api.bank_proof_uploaded_date || "",
              bankProofFileUrl: api.cancelled_cheque_url || undefined,
              isPrimary: true,
            },
          ]
        : [];
  const primary = bankAccounts.find((b) => b.isPrimary) || bankAccounts[0];
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
    accountHolderName: primary?.accountHolderName || api.account_holder_name || "",
    bankName: primary?.bankName || api.bank_name || "",
    accountNumber: primary?.accountNumber || api.account_number || "",
    ifscCode: primary?.ifscCode || api.ifsc_code || "",
    bankProofFileName: primary?.bankProofFileName || api.bank_proof_file_name || "",
    bankProofFileSize: primary?.bankProofFileSize || api.bank_proof_file_size || "",
    bankProofUploadedDate:
      primary?.bankProofUploadedDate || api.bank_proof_uploaded_date || "",
    bankProofFileUrl:
      primary?.bankProofFileUrl || api.cancelled_cheque_url || undefined,
    bankAccounts,
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
    documents: (api.documents || []).map((doc) => {
      const mapped = mapDocument(doc);
      if (
        !mapped.fileUrl &&
        api.cancelled_cheque_url &&
        mapped.name.toLowerCase().includes("cancelled cheque")
      ) {
        return { ...mapped, fileUrl: api.cancelled_cheque_url };
      }
      return mapped;
    }),
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
    supportEmail: api.support_email || "",
    supportPhone: api.support_phone || "",
    alternatePhone: "",
    addressLine1: api.address_line1 || "",
    addressLine2: "",
    city: api.city || "",
    state: api.state || "",
    country: "",
    zipCode: "",
    gstNumber: api.gst_number || "",
    businessRegistrationNumber: "",
    panNumber: api.pan_number || "",
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    bankProofFileName: "",
    bankProofFileSize: "",
    bankProofUploadedDate: "",
    bankAccounts: [],
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

export function formToCreatePayload(
  form: BusinessProfileFormValues,
  documents: BusinessDocument[] = []
) {
  const banks = (form.bankAccounts || []).filter(
    (b) =>
      b.accountHolderName.trim() ||
      b.bankName.trim() ||
      b.accountNumber.trim() ||
      b.ifscCode.trim() ||
      b.bankProofFileName.trim()
  );
  const primary = banks.find((b) => b.isPrimary) || banks[0];
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
    account_holder_name: primary?.accountHolderName || form.accountHolderName || null,
    bank_name: primary?.bankName || form.bankName || null,
    account_number: primary?.accountNumber || form.accountNumber || null,
    ifsc_code: primary?.ifscCode || form.ifscCode || null,
    bank_proof_file_name: primary?.bankProofFileName || form.bankProofFileName || null,
    bank_proof_file_size: primary?.bankProofFileSize || form.bankProofFileSize || null,
    bank_proof_uploaded_date:
      primary?.bankProofUploadedDate || form.bankProofUploadedDate || null,
    verification_status: form.verification,
    verification_notes: form.notes || null,
    status: form.status,
    bank_accounts: banks.map((b, index) => ({
      id: b.id.startsWith("tmp-") || b.id.startsWith("legacy-") ? null : b.id,
      account_holder_name: b.accountHolderName || null,
      bank_name: b.bankName || null,
      account_number: b.accountNumber || null,
      ifsc_code: b.ifscCode || null,
      cancelled_cheque_url:
        b.bankProofFileUrl &&
        !b.bankProofFileUrl.startsWith("blob:") &&
        !b.bankProofFileUrl.startsWith("data:")
          ? b.bankProofFileUrl
          : null,
      bank_proof_file_name: b.bankProofFileName || null,
      bank_proof_file_size: b.bankProofFileSize || null,
      bank_proof_uploaded_date: b.bankProofUploadedDate || null,
      is_primary: b.isPrimary || index === 0,
      sort_order: index,
    })),
    documents: documents.map((d) => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        d.id || ""
      );
      const serverFileUrl =
        d.fileUrl && !d.fileUrl.startsWith("blob:") && !d.fileUrl.startsWith("data:")
          ? d.fileUrl
          : null;
      return {
        id: isUuid ? d.id : null,
        name: d.name,
        document_type: d.name,
        status: d.status || "pending",
        file_name: d.fileName || null,
        file_size: d.fileSize || null,
        file_url: serverFileUrl,
        verified_by: d.verifiedBy || null,
        uploaded_date: d.uploadedDate || null,
      };
    }),
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

export async function approveBusinessProfile(id: string) {
  return apiRequest<MutationResponse>(`/business-profiles/${id}/approve`, {
    method: "POST",
  });
}

export async function rejectBusinessProfile(id: string, reason?: string) {
  return apiRequest<MutationResponse>(`/business-profiles/${id}/reject`, {
    method: "POST",
    params: reason ? { reason } : undefined,
  });
}

/** Resolve `/uploads/...` paths against the API origin (not `/api/v1`). */
export function resolveUploadUrl(url?: string | null): string | null {
  if (!url) return null;
  if (
    url.startsWith("blob:") ||
    url.startsWith("data:") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";
  const origin = apiBase.replace(/\/api\/v1\/?$/, "");
  return url.startsWith("/") ? `${origin}${url}` : `${origin}/${url}`;
}

export function openUploadedFile(url?: string | null) {
  const resolved = resolveUploadUrl(url);
  if (!resolved) {
    throw new Error("File is not available. Please replace or re-upload the document.");
  }
  window.open(resolved, "_blank", "noopener,noreferrer");
}

export async function downloadUploadedFile(url?: string | null, fileName?: string) {
  const resolved = resolveUploadUrl(url);
  if (!resolved) {
    throw new Error("File is not available. Please replace or re-upload the document.");
  }
  try {
    const response = await fetch(resolved);
    if (!response.ok) throw new Error("Download failed");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName || "document";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    // Fallback for blocked CORS / blob fetch: open in a new tab.
    window.open(resolved, "_blank", "noopener,noreferrer");
  }
}

export async function uploadBusinessDocument(
  profileId: string,
  file: File,
  documentType: string,
  name?: string
) {
  const body = new FormData();
  body.append("file", file);
  body.append("document_type", documentType);
  if (name) body.append("name", name);

  return apiRequest<{
    success: boolean;
    message: string;
    document: ApiDocument;
  }>(`/business-profiles/${profileId}/documents`, {
    method: "POST",
    body,
  });
}

/** Fetch all pages matching filters (capped) for export. */
export async function fetchAllBusinessProfilesForExport(
  filters: BusinessProfileFilters,
  sortKey: string,
  sortDir: "asc" | "desc",
  maxRows = 5000
) {
  const pageSize = 100;
  let page = 1;
  let totalPages = 1;
  const items: BusinessProfile[] = [];
  while (page <= totalPages && items.length < maxRows) {
    const params = filtersToParams(filters, page, pageSize, sortKey, sortDir);
    const data = await fetchBusinessProfiles(params);
    items.push(...data.items.map(mapBusinessProfileListItem));
    totalPages = Math.max(1, data.total_pages);
    if (!data.items.length) break;
    page += 1;
  }
  return items.slice(0, maxRows);
}
