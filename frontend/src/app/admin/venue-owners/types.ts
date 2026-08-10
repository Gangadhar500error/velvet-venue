export type VenueOwnerStatus = "active" | "inactive" | "pending";
export type VerificationStatus = "verified" | "pending" | "rejected";
export type RegistrationSource = "website" | "referral" | "admin";
export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export interface AssignedBusiness {
  id: string;
  name: string;
  businessType: string;
  city: string;
  status: "active" | "inactive" | "pending";
}

export interface VenueOwnerBooking {
  id: string;
  bookingId: string;
  venue: string;
  customer: string;
  eventType: string;
  amount: number;
  status: "upcoming" | "completed" | "cancelled" | "pending";
  date: string;
}

export interface VenueOwner {
  id: string;
  ownerId: string;
  firstName: string;
  lastName: string;
  /** Full display name */
  name: string;
  email: string;
  phone: string;
  alternateMobile: string;
  gender?: Gender;
  businessName: string;
  businessType: string;
  city: string;
  country: string;
  addressLine1?: string;
  addressLine2?: string;
  state?: string;
  zipCode?: string;
  avatar?: string;
  initials: string;
  status: VenueOwnerStatus;
  verification: VerificationStatus;
  source: RegistrationSource;
  assignedBusinesses: number;
  totalVenues: number;
  registrationDate: string;
  lastLogin: string;
  memberSince: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  businesses: AssignedBusiness[];
  recentBookings: VenueOwnerBooking[];
}

export interface VenueOwnerFilters {
  search: string;
  status: string;
  city: string;
  source: string;
  verification: string;
  dateFrom: string;
  dateTo: string;
  businessesMin: string;
}

export type TableDensity = "comfortable" | "compact";

export type VenueOwnerColumnKey =
  | "profile"
  | "ownerId"
  | "email"
  | "mobile"
  | "city"
  | "businesses"
  | "verification"
  | "status"
  | "registrationDate"
  | "actions";

export interface VenueOwnerFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  alternateMobile: string;
  gender: Gender | "";
  businessName: string;
  businessType: string;
  status: VenueOwnerStatus;
  verification: VerificationStatus;
  source: RegistrationSource;
  city: string;
  country: string;
  addressLine1: string;
  addressLine2: string;
  state: string;
  zipCode: string;
}
