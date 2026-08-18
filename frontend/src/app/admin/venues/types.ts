export type VenueStatus = "published" | "draft" | "pending" | "inactive" | "archived";
export type ApprovalStatus = "approved" | "pending" | "rejected";
export type DocumentStatus = "uploaded" | "pending" | "verified" | "rejected" | "suspended";
export type AvailabilityLabel = "available" | "busy" | "blocked";
export type DayAvailabilityStatus =
  | "available"
  | "booked"
  | "partially_booked"
  | "blocked"
  | "holiday"
  | "closed"
  | "maintenance"
  | "completed"
  | "cancelled"
  | "no_booking"
  | "expired";
export type BookingStatus = "confirmed" | "pending" | "completed" | "cancelled";
export type PaymentStatus = "paid" | "partial" | "pending" | "refunded" | "failed";

export type BookingModel = "venue_only" | "venue_food";
/** Venue Only pricing model: Full Day or Slot Based */
export type PricingMethod = "full_day" | "slot_based";
export type GstMode = "included" | "excluded";
/** Advance is percentage-only; kept for compatibility */
export type OnlineBookingAmountMode = "fixed" | "percent";
export type CancellationPreset = "Flexible" | "Moderate" | "Strict" | "Custom";
export type BookingConfirmationMode = "automatic" | "manual";

export interface PricingSlot {
  id: string;
  key: string;
  name: string;
  enabled: boolean;
  timeLabel: string;
  price: number;
  minBookingAmount: number;
  maxGuests: number;
}

/** Meal / food package slots for Venue + Food */
export interface FoodSlot {
  id: string;
  key: string;
  name: string;
  enabled: boolean;
  timeLabel: string;
  vegPlateCost: number;
  nonVegPlateCost: number;
  minGuests: number;
  maxGuests: number;
}

export interface VenueAddon {
  id: string;
  name: string;
  /** Legacy — pricing is offline; kept optional for compatibility */
  price?: number;
  /** Legacy — unused in catalog UI */
  mandatory?: boolean;
  active?: boolean;
}

export interface FoodPricing {
  vegPlateCost: number;
  nonVegPlateCost: number;
  minPlates: number;
  maxPlates: number;
  childrenPlateCost?: number;
  taxesIncluded?: boolean;
}

export interface VenueBooking {
  id: string;
  bookingId: string;
  customerName: string;
  eventType: string;
  bookingDate: string;
  eventDate: string;
  guests: number;
  amount: number;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
}

export interface VenueReview {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  reply?: string;
  imagesCount?: number;
  verifiedBooking?: boolean;
  eventType?: string;
  bookingDate?: string;
  replyDate?: string;
  avatarInitials?: string;
  recommendation?: boolean;
}

export interface VenueDocument {
  id: string;
  name: string;
  status: DocumentStatus;
  uploadedDate: string;
  verifiedBy: string;
  fileName?: string;
  fileSize?: string;
  expiryDate?: string;
  fileUrl?: string;
}

export interface AvailabilityDayBooking {
  id: string;
  bookingId: string;
  customerName: string;
  guestCount: number;
  selectedSlots: string[];
  selectedFoodSlots: string[];
  paymentStatus: string;
  bookingStatus: string;
  bookingAmount?: number;
  eventType?: string;
}

export interface AvailabilityDay {
  date: string;
  status: DayAvailabilityStatus;
  bookingId?: string;
  customerName?: string;
  eventType?: string;
  guests?: number;
  slot?: string;
  slotKey?: string;
  slotKind?: "venue" | "food";
  /** Internal booking record id (UUID) for navigation */
  bookingRef?: string;
  bookingCount?: number;
  bookingIds?: string[];
  bookedSlotNames?: string[];
  availableSlotNames?: string[];
  bookedFoodSlots?: string[];
  availableFoodSlots?: string[];
  guestCount?: number;
  bookings?: AvailabilityDayBooking[];
}

export interface RatingDistributionRow {
  stars: 1 | 2 | 3 | 4 | 5;
  count: number;
}

export interface Venue {
  id: string;
  venueId: string;
  name: string;
  businessId: string;
  businessName: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  supportEmail: string;
  supportPhone: string;

  category: string;
  venueType: string;
  status: VenueStatus;
  approval: ApprovalStatus;
  featured: boolean;

  shortDescription: string;
  detailedDescription: string;
  highlights: string[];
  houseRules: string;

  coverImage: string;
  galleryImages: string[];
  images360: string[];
  videoUrl: string;

  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  mapsLink: string;
  latitude: string;
  longitude: string;

  seatingCapacity: number;
  diningCapacity: number;
  floatingCapacity: number;
  theatreCapacity: number;
  classroomCapacity: number;
  standingCapacity: number;

  startingPrice: number;
  weekendPrice: number;
  peakPrice: number;
  securityDeposit: number;
  cleaningCharges: number;

  bookingModel: BookingModel;
  /** Multi-select offerings stored in venues.booking_type */
  bookingTypes: BookingModel[];
  /** Venue Only pricing model: Full Day or Slot Based */
  pricingMethod: PricingMethod;
  /** Venue + Food is always meal-slot based (no model selector) */
  foodPricingMethod: PricingMethod;
  pricingSlots: PricingSlot[];
  foodPricing: FoodPricing;
  /** Meal slots for Venue + Food (always slot-based) */
  foodSlots: FoodSlot[];
  addons: VenueAddon[];
  /** Recommended minimum online payment (₹ fallback) */
  minOnlineBookingAmount: number;
  /** UI is percentage-only; stored as percent */
  onlineBookingAmountMode: OnlineBookingAmountMode;
  gstMode: GstMode;
  gstPercent: number;
  cancellationPreset: CancellationPreset;
  bookingConfirmation: BookingConfirmationMode;
  maxAdvanceBookingDays: number;
  minNoticePeriodHours: number;
  balancePaymentDue: string;
  taxNotes: string;

  amenities: string[];

  cancellationPolicy: string;
  refundPolicy: string;
  advancePaymentPercent: number;
  smokingPolicy: string;
  alcoholPolicy: string;
  outsideCatering: boolean;
  outsideDecorations: boolean;
  outsidePhotography: boolean;
  petsAllowed: boolean;
  noiseRestrictions: string;

  notes: string;

  nearbyLandmark: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  parkingCapacity: number;
  wheelchairAccessible: boolean;
  powerBackup: boolean;
  liftAvailable: boolean;
  kitchenAvailable: boolean;
  bridalRoomCount: number;
  restroomCount: number;
  indoorArea: string;
  outdoorArea: string;
  displayPriority: number;

  initials: string;
  rating: number;
  totalReviews: number;
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  revenue: number;
  todaysBookings: number;
  availabilityLabel: AvailabilityLabel;

  minGuests: number;
  maxGuests: number;
  operatingHours: string;
  bookingDuration: string;
  weeklyOff: string;
  checkInTime: string;
  checkOutTime: string;
  eventCategories: string[];

  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;

  bookings: VenueBooking[];
  reviews: VenueReview[];
  documents: VenueDocument[];
  availability: AvailabilityDay[];
  ratingDistribution: RatingDistributionRow[];
}

export interface VenueFilters {
  search: string;
  businessId: string;
  ownerId: string;
  category: string;
  city: string;
  approval: string;
  availability: string;
  capacityMin: string;
  priceMin: string;
  priceMax: string;
  featured: string;
  status: string;
}

export type TableDensity = "comfortable" | "compact";

export type VenueColumnKey =
  | "profile"
  | "venueId"
  | "business"
  | "category"
  | "city"
  | "capacity"
  | "startingPrice"
  | "bookings"
  | "rating"
  | "approval"
  | "status"
  | "actions";

export interface VenueFormValues {
  name: string;
  businessId: string;
  businessName: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  supportEmail: string;
  supportPhone: string;

  category: string;
  venueType: string;
  status: VenueStatus;
  approval: ApprovalStatus;
  featured: boolean;

  shortDescription: string;
  detailedDescription: string;
  highlights: string;
  houseRules: string;

  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  mapsLink: string;
  latitude: string;
  longitude: string;

  seatingCapacity: string;
  diningCapacity: string;
  floatingCapacity: string;
  theatreCapacity: string;
  classroomCapacity: string;
  standingCapacity: string;

  startingPrice: string;
  weekendPrice: string;
  peakPrice: string;
  securityDeposit: string;
  cleaningCharges: string;

  bookingModel: BookingModel;
  /** Multi-select offerings stored in venues.booking_type */
  bookingTypes: BookingModel[];
  /** Venue Only pricing model: Full Day or Slot Based */
  pricingMethod: PricingMethod;
  /** Venue + Food is always meal-slot based (no model selector) */
  foodPricingMethod: PricingMethod;
  pricingSlots: PricingSlot[];
  foodPricing: FoodPricing;
  /** Meal slots for Venue + Food (always slot-based) */
  foodSlots: FoodSlot[];
  addons: VenueAddon[];
  minOnlineBookingAmount: string;
  onlineBookingAmountMode: OnlineBookingAmountMode;
  gstMode: GstMode;
  gstPercent: string;
  cancellationPreset: CancellationPreset;
  bookingConfirmation: BookingConfirmationMode;
  maxAdvanceBookingDays: string;
  minNoticePeriodHours: string;
  balancePaymentDue: string;
  taxNotes: string;

  amenities: string[];

  cancellationPolicy: string;
  refundPolicy: string;
  advancePaymentPercent: string;
  smokingPolicy: string;
  alcoholPolicy: string;
  outsideCatering: boolean;
  outsideDecorations: boolean;
  outsidePhotography: boolean;
  petsAllowed: boolean;
  noiseRestrictions: string;

  notes: string;

  minGuests: string;
  maxGuests: string;
  operatingHours: string;
  bookingDuration: string;
  eventCategories: string[];

  nearbyLandmark: string;
  weeklyOff: string;
  checkInTime: string;
  checkOutTime: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  parkingCapacity: string;
  wheelchairAccessible: boolean;
  powerBackup: boolean;
  liftAvailable: boolean;
  kitchenAvailable: boolean;
  bridalRoomCount: string;
  restroomCount: string;
  indoorArea: string;
  outdoorArea: string;
  displayPriority: string;
}
