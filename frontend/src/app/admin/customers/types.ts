export type CustomerStatus = "active" | "inactive" | "blocked" | "pending";
export type VerificationStatus = "verified" | "pending" | "rejected";
export type RegistrationSource = "website" | "mobile_app" | "referral" | "admin" | "partner";
export type Gender = "male" | "female" | "other" | "prefer_not_to_say";
export type CommunicationPreference = "email" | "sms" | "both" | "none";

export type JourneyStepStatus = "completed" | "current" | "pending";

export interface JourneyStep {
  key: string;
  label: string;
  status: JourneyStepStatus;
  date?: string;
}

export interface CustomerBooking {
  id: string;
  bookingId: string;
  venue: string;
  eventType: string;
  bookingDate: string;
  eventDate: string;
  guests: number;
  amount: number;
  paymentStatus: "paid" | "pending" | "refunded" | "failed";
  bookingStatus: "upcoming" | "completed" | "cancelled";
}

export interface CustomerTransaction {
  id: string;
  transactionId: string;
  booking: string;
  amount: number;
  method: string;
  status: "success" | "pending" | "failed" | "refunded";
  date: string;
}

export interface CustomerReview {
  id: string;
  venue: string;
  rating: number;
  comment: string;
  date: string;
  reply?: string;
}

export interface CustomerActivity {
  id: string;
  title: string;
  description: string;
  date: string;
  type: "register" | "verify" | "booking" | "payment" | "review" | "login";
}

export interface Customer {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  addressLine1?: string;
  addressLine2?: string;
  state?: string;
  zipCode?: string;
  gender?: Gender;
  dob?: string;
  avatar?: string;
  initials: string;
  status: CustomerStatus;
  verification: VerificationStatus;
  emailVerified: boolean;
  mobileVerified: boolean;
  communicationPreference: CommunicationPreference;
  bookings: number;
  upcomingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalSpend: number;
  averageBooking: number;
  totalPaid: number;
  pendingPayments: number;
  refundedPayments: number;
  favoriteEventType: string;
  averageRating: number;
  registrationDate: string;
  lastLogin: string;
  source: RegistrationSource;
  notes?: string;
  memberSince: string;
  reviews?: number;
  lastBooking?: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  version: string;
  journey: JourneyStep[];
  recentBookings: CustomerBooking[];
  recentTransactions: CustomerTransaction[];
  recentReviews: CustomerReview[];
  activities: CustomerActivity[];
}

export interface CustomerKpis {
  total: number;
  totalGrowth: number;
  verified: number;
  verifiedPercent: number;
  active: number;
  blocked: number;
  newThisMonth: number;
  newGrowth: number;
}

export interface CustomerFilters {
  search: string;
  status: string;
  city: string;
  source: string;
  verification: string;
  dateFrom: string;
  dateTo: string;
  bookingsMin: string;
  spendMin: string;
}

export type TableDensity = "comfortable" | "compact";

export type CustomerColumnKey =
  | "profile"
  | "customerId"
  | "mobile"
  | "email"
  | "city"
  | "bookings"
  | "totalSpend"
  | "registrationDate"
  | "verification"
  | "status"
  | "lastLogin"
  | "actions";

export interface CustomerFormValues {
  name: string;
  email: string;
  phone: string;
  gender: Gender | "";
  city: string;
  country: string;
  addressLine1: string;
  addressLine2: string;
  state: string;
  zipCode: string;
  dob: string;
  source: RegistrationSource;
  status: CustomerStatus;
  emailVerified: boolean;
  mobileVerified: boolean;
  communicationPreference: CommunicationPreference;
  verification: VerificationStatus;
  notes: string;
}
