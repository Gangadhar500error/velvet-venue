import { apiRequest } from "@/lib/api";
import type {
  Customer,
  CustomerBooking,
  CustomerFilters,
  CustomerFormValues,
  CustomerInvoice,
  CustomerReview,
  CustomerStatus,
  Gender,
  RegistrationSource,
  VerificationStatus,
} from "@/app/admin/customers/types";

export interface CustomerListParams {
  search?: string;
  status?: string;
  registration_source?: string;
  verification_status?: string;
  city?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

interface ApiOverview {
  total_bookings: number;
  upcoming_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  lifetime_spend: number;
  total_paid: number;
  pending_amount: number;
  average_rating: number;
  last_booking_date: string | null;
  average_booking: number;
  reviews_count: number;
}

interface ApiCustomerDetail {
  success?: boolean;
  id: string;
  customer_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  mobile: string;
  alternate_mobile?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  profile_image?: string | null;
  registration_source: string;
  customer_type: string;
  email_verified: boolean;
  mobile_verified: boolean;
  verification_status: string;
  status: string;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  notes?: string | null;
  communication_preference: string;
  member_since: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  initials: string;
  overview: ApiOverview;
  recent_bookings: Array<{
    id: string;
    booking_code: string;
    venue_name: string;
    event_type: string;
    booking_date: string | null;
    event_date: string | null;
    guests: number;
    amount: number;
    payment_status: string;
    booking_status: string;
  }>;
  recent_invoices: Array<{
    id: string;
    invoice_number: string;
    amount: number;
    status: string;
    issued_at: string | null;
    invoice_type?: string;
    gst_amount?: number;
    booking_id?: string | null;
    booking_number?: string;
    venue_id?: string | null;
    venue_name?: string;
    business_profile_id?: string | null;
    business_name?: string;
    paid_amount?: number;
    remaining_amount?: number;
    payment_status?: string;
    payment_method?: string | null;
  }>;
  reviews: Array<{
    id: string;
    venue_name: string;
    rating: number;
    comment: string;
    created_at: string;
    reply?: string | null;
  }>;
  existed?: boolean;
}

interface ApiListItem {
  id: string;
  customer_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  mobile: string;
  city?: string | null;
  country?: string | null;
  status: string;
  verification_status: string;
  email_verified: boolean;
  mobile_verified: boolean;
  registration_source: string;
  customer_type: string;
  profile_image?: string | null;
  created_at: string;
  bookings: number;
  lifetime_spend: number;
  last_booking_date?: string | null;
  initials: string;
}

interface CustomerListResponse {
  success: boolean;
  items: ApiListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface CustomerMutationResponse {
  success: boolean;
  message: string;
  customer: ApiCustomerDetail;
  existed: boolean;
}

function mapSource(value: string): RegistrationSource {
  const allowed: RegistrationSource[] = [
    "website",
    "mobile_app",
    "referral",
    "admin",
    "partner",
  ];
  if (value === "vendor") return "partner";
  return (allowed.includes(value as RegistrationSource)
    ? value
    : "website") as RegistrationSource;
}

function mapStatus(value: string): CustomerStatus {
  if (value === "deleted") return "inactive";
  return (value as CustomerStatus) || "active";
}

function mapVerification(value: string): VerificationStatus {
  return (value as VerificationStatus) || "pending";
}

function mapBooking(b: ApiCustomerDetail["recent_bookings"][number]): CustomerBooking {
  const payment = b.payment_status as CustomerBooking["paymentStatus"];
  const bookingStatus = b.booking_status as CustomerBooking["bookingStatus"];
  return {
    id: b.id,
    bookingId: b.booking_code,
    venue: b.venue_name,
    eventType: b.event_type,
    bookingDate: b.booking_date || "",
    eventDate: b.event_date || "",
    guests: b.guests,
    amount: b.amount,
    paymentStatus: payment || "pending",
    bookingStatus: bookingStatus || "upcoming",
  };
}

function mapInvoiceStatus(status?: string | null): CustomerInvoice["status"] {
  if (status === "paid") return "paid";
  if (status === "cancelled") return "cancelled";
  return "pending";
}

function mapInvoicePaymentType(
  value?: string | null
): CustomerInvoice["paymentType"] {
  if (value === "installment" || value === "final" || value === "advance") return value;
  return "advance";
}

function mapInvoice(
  invoice: ApiCustomerDetail["recent_invoices"][number]
): CustomerInvoice {
  const amount = invoice.amount || 0;
  return {
    id: invoice.id,
    invoiceNo: invoice.invoice_number,
    invoiceDate: invoice.issued_at || "",
    paymentType: mapInvoicePaymentType(invoice.invoice_type),
    paymentMethod: invoice.payment_method || undefined,
    amountReceived: amount,
    remainingBalance: invoice.remaining_amount || 0,
    status: mapInvoiceStatus(invoice.status),
    transactionId: "",
    gstAmount: invoice.gst_amount || 0,
    bookingId: invoice.booking_number || "",
    bookingRef: invoice.booking_id || "",
    venueId: invoice.venue_id || "",
    venueName: invoice.venue_name || "",
    businessId: invoice.business_profile_id || "",
    businessName: invoice.business_name || "",
    bookingAmount: amount,
    paymentStatus: invoice.payment_status || "pending",
    invoiceAmount: amount,
    amountPaid: invoice.paid_amount || amount,
  };
}

function mapReview(r: ApiCustomerDetail["reviews"][number]): CustomerReview {
  return {
    id: r.id,
    venue: r.venue_name,
    rating: r.rating,
    comment: r.comment,
    date: r.created_at.slice(0, 10),
    reply: r.reply || undefined,
  };
}

export function mapCustomerDetail(api: ApiCustomerDetail): Customer {
  const overview = api.overview || {
    total_bookings: 0,
    upcoming_bookings: 0,
    completed_bookings: 0,
    cancelled_bookings: 0,
    lifetime_spend: 0,
    total_paid: 0,
    pending_amount: 0,
    average_rating: 0,
    last_booking_date: null,
    average_booking: 0,
    reviews_count: 0,
  };

  return {
    id: api.id,
    customerId: api.customer_code,
    name: api.full_name,
    email: api.email,
    phone: api.mobile,
    city: api.city || "",
    country: api.country || "",
    addressLine1: api.address_line1 || undefined,
    addressLine2: api.address_line2 || undefined,
    state: api.state || undefined,
    zipCode: api.postal_code || undefined,
    gender: (api.gender as Gender) || undefined,
    dob: api.date_of_birth || undefined,
    avatar: api.profile_image || undefined,
    initials: api.initials || "CU",
    status: mapStatus(api.status),
    verification: mapVerification(api.verification_status),
    emailVerified: api.email_verified,
    mobileVerified: api.mobile_verified,
    communicationPreference: (api.communication_preference as Customer["communicationPreference"]) || "email",
    bookings: overview.total_bookings,
    upcomingBookings: overview.upcoming_bookings,
    completedBookings: overview.completed_bookings,
    cancelledBookings: overview.cancelled_bookings,
    totalSpend: overview.lifetime_spend,
    averageBooking: overview.average_booking,
    totalPaid: overview.total_paid,
    pendingPayments: overview.pending_amount,
    refundedPayments: 0,
    favoriteEventType: "",
    averageRating: overview.average_rating,
    registrationDate: api.created_at.slice(0, 10),
    lastLogin: "",
    source: mapSource(api.registration_source),
    notes: api.notes || undefined,
    memberSince: api.member_since.slice(0, 10),
    reviews: overview.reviews_count,
    lastBooking: overview.last_booking_date || undefined,
    createdBy: api.created_by || "",
    createdAt: api.created_at,
    updatedBy: api.updated_by || "",
    updatedAt: api.updated_at,
    version: "1",
    journey: [],
    recentBookings: (api.recent_bookings || []).map(mapBooking),
    recentInvoices: (api.recent_invoices || []).map(mapInvoice),
    recentTransactions: [],
    recentReviews: (api.reviews || []).map(mapReview),
    activities: [],
  };
}

export function mapCustomerListItem(api: ApiListItem): Customer {
  return {
    id: api.id,
    customerId: api.customer_code,
    name: api.full_name,
    email: api.email,
    phone: api.mobile,
    city: api.city || "",
    country: api.country || "",
    initials: api.initials || "CU",
    status: mapStatus(api.status),
    verification: mapVerification(api.verification_status),
    emailVerified: api.email_verified,
    mobileVerified: api.mobile_verified,
    communicationPreference: "email",
    bookings: api.bookings || 0,
    upcomingBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalSpend: api.lifetime_spend || 0,
    averageBooking: 0,
    totalPaid: 0,
    pendingPayments: 0,
    refundedPayments: 0,
    favoriteEventType: "",
    averageRating: 0,
    registrationDate: api.created_at.slice(0, 10),
    lastLogin: "",
    source: mapSource(api.registration_source),
    memberSince: api.created_at.slice(0, 10),
    lastBooking: api.last_booking_date || undefined,
    createdBy: "",
    createdAt: api.created_at,
    updatedBy: "",
    updatedAt: api.created_at,
    version: "1",
    journey: [],
    recentBookings: [],
    recentInvoices: [],
    recentTransactions: [],
    recentReviews: [],
    activities: [],
  };
}

export function formToCreatePayload(form: CustomerFormValues) {
  const parts = form.name.trim().split(/\s+/);
  const first_name = parts[0] || form.name;
  const last_name = parts.slice(1).join(" ");
  return {
    name: form.name.trim(),
    first_name,
    last_name,
    email: form.email.trim().toLowerCase(),
    mobile: form.phone.trim(),
    gender: form.gender || null,
    date_of_birth: form.dob || null,
    registration_source: form.source === "partner" ? "vendor" : form.source,
    status: form.status === "pending" ? "pending" : form.status,
    verification_status: form.verification,
    email_verified: form.emailVerified,
    mobile_verified: form.mobileVerified,
    address_line1: form.addressLine1 || null,
    address_line2: form.addressLine2 || null,
    city: form.city || null,
    state: form.state || null,
    country: form.country || null,
    postal_code: form.zipCode || null,
    notes: form.notes || null,
    communication_preference: form.communicationPreference,
    return_existing: false,
  };
}

export function formToUpdatePayload(form: CustomerFormValues) {
  const payload = formToCreatePayload(form);
  const { registration_source: _, return_existing: __, ...rest } = payload;
  return rest;
}

export function filtersToParams(
  filters: CustomerFilters,
  page: number,
  pageSize: number,
  sortKey: string,
  sortDir: "asc" | "desc"
): CustomerListParams {
  const sortMap: Record<string, string> = {
    name: "name",
    registrationDate: "registration_date",
    bookings: "bookings",
    totalSpend: "lifetime_spend",
    customerId: "name",
    city: "name",
  };
  return {
    search: filters.search || undefined,
    status: filters.status || undefined,
    city: filters.city || undefined,
    registration_source:
      filters.source === "partner" ? "vendor" : filters.source || undefined,
    verification_status: filters.verification || undefined,
    date_from: filters.dateFrom || undefined,
    date_to: filters.dateTo || undefined,
    sort_by: sortMap[sortKey] || "name",
    sort_dir: sortDir,
    page,
    page_size: pageSize,
  };
}

export interface CustomerSearchItem {
  id: string;
  customer_code: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  phone: string;
  email: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  profile_photo?: string | null;
  is_verified?: boolean;
  is_active?: boolean;
}

export interface CustomerSearchResponse {
  success: boolean;
  items: CustomerSearchItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export async function searchCustomers(q = "", page = 1, limit = 20) {
  return apiRequest<CustomerSearchResponse>("/customers/search", {
    params: { q, page, limit },
  });
}

export async function fetchCustomers(params: CustomerListParams = {}) {
  return apiRequest<CustomerListResponse>("/customers", { params: params as Record<string, string | number | null | undefined> });
}

/** Fetch all pages matching filters (capped) for export. */
export async function fetchAllCustomersForExport(
  filters: CustomerFilters,
  sortKey: string,
  sortDir: "asc" | "desc",
  maxRows = 5000
) {
  const pageSize = 100;
  let page = 1;
  let totalPages = 1;
  const items: Customer[] = [];

  while (page <= totalPages && items.length < maxRows) {
    const params = filtersToParams(filters, page, pageSize, sortKey, sortDir);
    const data = await fetchCustomers(params);
    items.push(...data.items.map(mapCustomerListItem));
    totalPages = Math.max(1, data.total_pages);
    if (!data.items.length) break;
    page += 1;
  }

  return items.slice(0, maxRows);
}

export async function fetchCustomer(id: string) {
  return apiRequest<ApiCustomerDetail>(`/customers/${id}`);
}

export async function createCustomer(
  payload: Partial<ReturnType<typeof formToCreatePayload>> & Record<string, unknown>
) {
  return apiRequest<CustomerMutationResponse>("/customers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCustomer(
  id: string,
  payload: ReturnType<typeof formToUpdatePayload>
) {
  return apiRequest<CustomerMutationResponse>(`/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateCustomerStatus(id: string, status: CustomerStatus) {
  return apiRequest<CustomerMutationResponse>(`/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export async function deleteCustomer(id: string) {
  return apiRequest<{ success: boolean; message: string }>(`/customers/${id}`, {
    method: "DELETE",
  });
}

export async function fetchCustomerCities() {
  return apiRequest<{ success: boolean; items: string[] }>("/customers/meta/cities");
}

export async function findOrCreateCustomer(payload: {
  email?: string;
  mobile?: string;
  first_name: string;
  last_name?: string;
  registration_source?: string;
}) {
  return apiRequest<CustomerMutationResponse>("/customers/find-or-create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
