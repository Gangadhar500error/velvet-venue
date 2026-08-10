import { mockBusinessProfiles } from "../business-profile/data";
import {
  AvailabilityDay,
  BookingStatus,
  DocumentStatus,
  PaymentStatus,
  RatingDistributionRow,
  Venue,
  VenueBooking,
  VenueDocument,
  VenueFormValues,
  VenueReview,
  VenueStatus,
  ApprovalStatus,
} from "./types";
import { buildMultiSlotAvailability } from "./availability";

export const cityOptions = [
  "Hyderabad",
  "Secunderabad",
  "Warangal",
  "Karimnagar",
  "Khammam",
  "Nizamabad",
  "Visakhapatnam",
  "Vijayawada",
  "Tirupati",
  "Guntur",
  "Rajahmundry",
  "Kakinada",
  "Bengaluru",
  "Mysuru",
  "Mangaluru",
  "Hubballi",
  "Chennai",
  "Coimbatore",
  "Madurai",
  "Tiruchirappalli",
];

export const categoryOptions = [
  "Banquet Hall",
  "Farmhouse",
  "Hotel",
  "Resort",
  "Lawn",
  "Rooftop",
  "Convention Center",
  "Wedding Venue",
];

export const venueTypeOptions = ["Indoor", "Outdoor", "Indoor & Outdoor", "Semi-Outdoor"];

export const eventCategoryOptions = [
  "Wedding",
  "Reception",
  "Birthday",
  "Engagement",
  "Corporate",
  "Conference",
  "Baby Shower",
  "Private Party",
  "Cocktail",
  "Other",
];

/** Admin-configured platform commission — vendors cannot edit this */
export const PLATFORM_COMMISSION_PERCENT = 2;

export const DEFAULT_PRICING_SLOTS: import("./types").PricingSlot[] = [
  {
    id: "slot-full",
    key: "full_day",
    name: "Full Day",
    enabled: true,
    timeLabel: "9 AM – 11 PM",
    price: 100000,
    minBookingAmount: 20000,
    maxGuests: 400,
  },
  {
    id: "slot-morning",
    key: "morning",
    name: "Morning",
    enabled: true,
    timeLabel: "6 AM – 11 AM",
    price: 30000,
    minBookingAmount: 10000,
    maxGuests: 400,
  },
  {
    id: "slot-afternoon",
    key: "afternoon",
    name: "Afternoon",
    enabled: true,
    timeLabel: "12 PM – 4 PM",
    price: 35000,
    minBookingAmount: 10000,
    maxGuests: 400,
  },
  {
    id: "slot-evening",
    key: "evening",
    name: "Evening",
    enabled: true,
    timeLabel: "5 PM – 9 PM",
    price: 45000,
    minBookingAmount: 15000,
    maxGuests: 400,
  },
  {
    id: "slot-night",
    key: "night",
    name: "Night",
    enabled: true,
    timeLabel: "9 PM – 12 AM",
    price: 25000,
    minBookingAmount: 8000,
    maxGuests: 400,
  },
];

export function defaultPricingSlots() {
  return DEFAULT_PRICING_SLOTS.map((s) => ({ ...s }));
}

export const DEFAULT_FOOD_SLOTS: import("./types").FoodSlot[] = [
  {
    id: "food-breakfast",
    key: "breakfast",
    name: "Breakfast",
    enabled: true,
    timeLabel: "7 AM – 10 AM",
    vegPlateCost: 250,
    nonVegPlateCost: 350,
    minGuests: 50,
    maxGuests: 400,
  },
  {
    id: "food-lunch",
    key: "lunch",
    name: "Lunch",
    enabled: true,
    timeLabel: "12 PM – 3 PM",
    vegPlateCost: 500,
    nonVegPlateCost: 700,
    minGuests: 100,
    maxGuests: 600,
  },
  {
    id: "food-dinner",
    key: "dinner",
    name: "Dinner",
    enabled: true,
    timeLabel: "7 PM – 11 PM",
    vegPlateCost: 700,
    nonVegPlateCost: 900,
    minGuests: 100,
    maxGuests: 600,
  },
];

export function defaultFoodSlots() {
  return DEFAULT_FOOD_SLOTS.map((s) => ({ ...s }));
}

export function defaultFoodPricing() {
  return {
    vegPlateCost: 500,
    nonVegPlateCost: 700,
    minPlates: 100,
    maxPlates: 800,
    childrenPlateCost: 0,
    taxesIncluded: false,
  };
}

function normalizeStoredMethod(
  method?: string | null
): import("./types").PricingMethod {
  if (method === "slot_based") return "slot_based";
  return "full_day";
}

export function defaultAddons() {
  return [
    { id: "addon-1", name: "Decoration", price: 0, mandatory: false, active: true },
    { id: "addon-2", name: "Photography", price: 0, mandatory: false, active: true },
    { id: "addon-3", name: "DJ", price: 0, mandatory: false, active: true },
    { id: "addon-4", name: "Generator", price: 0, mandatory: false, active: true },
    { id: "addon-5", name: "Parking", price: 0, mandatory: false, active: true },
    { id: "addon-6", name: "Valet", price: 0, mandatory: false, active: true },
    { id: "addon-7", name: "Projector", price: 0, mandatory: false, active: true },
    { id: "addon-8", name: "Flower Decorations", price: 0, mandatory: false, active: true },
  ];
}

export const weeklyOffOptions = ["None", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export interface AmenityOption {
  key: string;
  label: string;
  icon: string;
}

export const amenityOptions: AmenityOption[] = [
  { key: "Parking", label: "Parking", icon: "Car" },
  { key: "AC", label: "Air Conditioning", icon: "Snowflake" },
  { key: "Power Backup", label: "Power Backup", icon: "Zap" },
  { key: "WiFi", label: "WiFi", icon: "Wifi" },
  { key: "Bridal Room", label: "Bridal Room", icon: "Gem" },
  { key: "Dining Hall", label: "Dining Hall", icon: "UtensilsCrossed" },
  { key: "Stage", label: "Stage", icon: "Mic2" },
  { key: "Decoration", label: "Decoration", icon: "PartyPopper" },
  { key: "Music", label: "Music System", icon: "Music" },
  { key: "DJ", label: "DJ", icon: "Disc3" },
  { key: "Catering", label: "Catering", icon: "ChefHat" },
  { key: "Projector", label: "Projector", icon: "Projector" },
  { key: "Swimming Pool", label: "Swimming Pool", icon: "Waves" },
  { key: "Garden", label: "Garden", icon: "Trees" },
  { key: "Valet Parking", label: "Valet Parking", icon: "KeyRound" },
  { key: "Wheelchair Access", label: "Wheelchair Access", icon: "Accessibility" },
  { key: "Kids Area", label: "Kids Area", icon: "Baby" },
];

export interface BusinessOption {
  id: string;
  businessId: string;
  name: string;
  businessType: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  supportEmail: string;
  supportPhone: string;
  city: string;
  state: string;
  gstNumber: string;
  panNumber: string;
  addressLine1: string;
}

export const businessOptions: BusinessOption[] = mockBusinessProfiles.map((b) => ({
  id: b.id,
  businessId: b.businessId,
  name: b.businessName,
  businessType: b.businessType,
  ownerId: b.ownerId,
  ownerName: b.ownerName,
  ownerEmail: b.ownerEmail,
  ownerPhone: b.ownerPhone,
  supportEmail: b.supportEmail,
  supportPhone: b.supportPhone,
  city: b.city,
  state: b.state,
  gstNumber: b.gstNumber,
  panNumber: b.panNumber,
  addressLine1: b.addressLine1,
}));

export function getBusinessOption(businessId: string) {
  return businessOptions.find((b) => b.id === businessId || b.businessId === businessId);
}

export interface OwnerOption {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export const ownerOptions: OwnerOption[] = Array.from(
  new Map(
    mockBusinessProfiles.map((b) => [
      b.ownerId,
      { id: b.ownerId, name: b.ownerName, email: b.ownerEmail, phone: b.ownerPhone },
    ])
  ).values()
);

export function getOwnerOption(ownerId: string) {
  return ownerOptions.find((o) => o.id === ownerId);
}

export const DOCUMENT_SLOT_NAMES = [
  "Venue License",
  "Fire Safety Certificate",
  "Insurance Certificate",
  "Government Approval",
  "Food License",
  "Other Documents",
] as const;

export function defaultDocumentSlots(): VenueDocument[] {
  return DOCUMENT_SLOT_NAMES.map((name, idx) => ({
    id: `new-vdoc-${idx + 1}`,
    name,
    status: "pending" as const,
    uploadedDate: "",
    verifiedBy: "—",
  }));
}

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "VN"
  );
}

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16) || "venue";
}

function shiftDate(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const customerNamePool = [
  "Aarav Mehta",
  "Ishita Sharma",
  "Karan Malhotra",
  "Sneha Reddy",
  "Vikram Joshi",
  "Ananya Gupta",
  "Rohit Verma",
  "Pooja Nair",
  "Aditya Singh",
  "Neha Kapoor",
  "Siddharth Rao",
  "Divya Iyer",
];

function buildBookings(prefix: string, seed: number, count: number, startingPrice: number): VenueBooking[] {
  const statuses: BookingStatus[] = ["confirmed", "completed", "completed", "pending", "cancelled", "confirmed"];
  const payments: PaymentStatus[] = ["paid", "paid", "partial", "pending", "refunded", "paid"];
  const bookings: VenueBooking[] = [];
  for (let i = 0; i < count; i += 1) {
    const idx = seed + i;
    const status = statuses[idx % statuses.length];
    const payment = status === "cancelled" ? "refunded" : payments[idx % payments.length];
    bookings.push({
      id: `${prefix}-bk-${i + 1}`,
      bookingId: `BKG-${9000 + seed * 11 + i}`,
      customerName: customerNamePool[idx % customerNamePool.length],
      eventType: eventCategoryOptions[idx % eventCategoryOptions.length],
      bookingDate: shiftDate(-(45 - idx * 3)),
      eventDate: shiftDate(idx % 2 === 0 ? 12 + idx * 5 : -(idx * 3 + 4)),
      guests: 80 + (idx % 6) * 45,
      amount: Math.round((startingPrice || 60000) * (0.8 + (idx % 5) * 0.15)),
      paymentStatus: payment,
      status,
    });
  }
  return bookings;
}

const reviewComments = [
  "Absolutely stunning venue — the staff was extremely helpful throughout our event.",
  "Great ambience and spacious hall, though parking could be better managed during peak hours.",
  "Our wedding reception was magical here. The decor team exceeded our expectations!",
  "Good venue for corporate events, AV setup was seamless and the team was professional.",
  "Decent experience overall, catering was a little expensive but quality was good.",
  "The team went above and beyond to make our engagement ceremony truly special.",
  "Loved the ambience and the on-site coordination. Would definitely book again.",
  "Value for money and very responsive management. Minor delays in setup though.",
];

function buildReviews(prefix: string, seed: number, count: number): VenueReview[] {
  const ratingsCycle = [5, 4, 5, 3, 4, 5, 4, 5];
  const reviews: VenueReview[] = [];
  for (let i = 0; i < count; i += 1) {
    const idx = seed + i;
    const customerName = customerNamePool[(idx + 3) % customerNamePool.length];
    const rating = ratingsCycle[idx % ratingsCycle.length];
    const date = shiftDate(-(idx * 8 + 6));
    const hasReply = idx % 3 === 0;
    reviews.push({
      id: `${prefix}-rv-${i + 1}`,
      customerName,
      rating,
      comment: reviewComments[idx % reviewComments.length],
      date,
      reply: hasReply
        ? "Thank you so much for your wonderful feedback! We look forward to hosting you again."
        : undefined,
      replyDate: hasReply ? shiftDate(-(idx * 8 + 3)) : undefined,
      imagesCount: idx % 4 === 0 ? 3 : idx % 3 === 0 ? 1 : 0,
      verifiedBooking: idx % 4 !== 3,
      eventType: eventCategoryOptions[idx % eventCategoryOptions.length],
      bookingDate: shiftDate(-(idx * 8 + 30)),
      avatarInitials: initialsOf(customerName),
      recommendation: rating >= 4,
    });
  }
  return reviews;
}

function buildAvailability(
  seed: number,
  bookings: VenueBooking[],
  pricingMethod: import("./types").PricingMethod = "full_day",
  pricingSlots?: import("./types").PricingSlot[]
): AvailabilityDay[] {
  return buildMultiSlotAvailability(seed, bookings, pricingSlots, pricingMethod);
}

function buildRatingDistribution(reviews: VenueReview[]): RatingDistributionRow[] {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => {
    const s = Math.round(r.rating);
    if (counts[s] !== undefined) counts[s] += 1;
  });
  return [5, 4, 3, 2, 1].map((stars) => ({
    stars: stars as 1 | 2 | 3 | 4 | 5,
    count: counts[stars],
  }));
}

function buildDocuments(approval: ApprovalStatus, createdAt: string): VenueDocument[] {
  const baseDate = createdAt ? createdAt.slice(0, 10) : "2024-01-01";
  const statusFor = (idx: number): DocumentStatus => {
    if (approval === "approved") return idx < 5 ? "verified" : "pending";
    if (approval === "rejected") return idx === 0 ? "rejected" : idx < 4 ? "uploaded" : "pending";
    return idx < 2 ? "uploaded" : "pending";
  };
  return DOCUMENT_SLOT_NAMES.map((name, idx) => {
    const status = statusFor(idx);
    const slugName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const hasFile = status !== "pending";
    const expiryDate = hasFile && name !== "Other Documents" ? shiftDate(idx % 2 === 0 ? 20 + idx * 40 : -(10 + idx * 5)) : undefined;
    return {
      id: `${baseDate}-vdoc${idx + 1}`,
      name,
      status,
      uploadedDate: hasFile ? baseDate : "",
      verifiedBy: status === "verified" ? "Admin User" : "—",
      fileName: hasFile ? `${slugName}.pdf` : undefined,
      fileSize: hasFile ? `${(0.5 + idx * 0.3).toFixed(1)} MB` : undefined,
      expiryDate,
    };
  });
}

type VenueBase = Partial<Venue> &
  Pick<
    Venue,
    | "id"
    | "venueId"
    | "name"
    | "businessId"
    | "businessName"
    | "ownerId"
    | "ownerName"
    | "ownerEmail"
    | "ownerPhone"
    | "category"
    | "city"
    | "state"
    | "status"
    | "approval"
    | "createdAt"
    | "updatedAt"
  >;

function enrichVenue(base: VenueBase, seed: number): Venue {
  const bookingCount = base.bookings ? base.bookings.length : base.status === "draft" ? 0 : 5 + (seed % 4);
  const reviewCount =
    base.reviews ? base.reviews.length : base.status === "draft" || base.status === "pending" ? 0 : 3 + (seed % 3);

  const bookings = base.bookings ?? buildBookings(base.venueId, seed, bookingCount, base.startingPrice ?? 60000);
  const reviews = base.reviews ?? buildReviews(base.venueId, seed, reviewCount);
  const documents = base.documents ?? buildDocuments(base.approval, base.createdAt);
  const pricingMethod = base.pricingMethod ?? "full_day";
  const pricingSlots = base.pricingSlots ?? defaultPricingSlots();
  const availability =
    base.availability ?? buildAvailability(seed, bookings, pricingMethod, pricingSlots);
  const ratingDistribution = base.ratingDistribution ?? buildRatingDistribution(reviews);

  const totalBookings = bookings.length;
  const upcomingBookings = bookings.filter((b) => b.status === "confirmed" || b.status === "pending").length;
  const completedBookings = bookings.filter((b) => b.status === "completed").length;
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled").length;
  const revenue = bookings
    .filter((b) => b.paymentStatus === "paid" || b.paymentStatus === "partial")
    .reduce((sum, b) => sum + b.amount, 0);
  const rating = reviews.length
    ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
    : 0;

  const defaults = {
    supportEmail: `support@${slug(base.businessName)}.com`,
    supportPhone: base.ownerPhone,
    venueType: "Indoor",
    featured: false,
    shortDescription: "",
    detailedDescription: "",
    highlights: [] as string[],
    houseRules:
      "Standard venue house rules apply. Please contact venue management for detailed guidelines before booking.",
    coverImage: "",
    galleryImages: [] as string[],
    images360: [] as string[],
    videoUrl: "",
    addressLine1: "",
    addressLine2: "",
    country: "India",
    zipCode: "",
    mapsLink: "",
    latitude: "",
    longitude: "",
    seatingCapacity: 200,
    diningCapacity: 150,
    floatingCapacity: 250,
    theatreCapacity: 300,
    classroomCapacity: 120,
    standingCapacity: 350,
    startingPrice: 60000,
    weekendPrice: 75000,
    peakPrice: 95000,
    securityDeposit: 25000,
    cleaningCharges: 3000,
    bookingModel: "venue_only" as const,
    pricingMethod: "full_day" as const,
    foodPricingMethod: "slot_based" as const,
    pricingSlots: defaultPricingSlots(),
    foodPricing: defaultFoodPricing(),
    foodSlots: defaultFoodSlots(),
    addons: defaultAddons(),
    minOnlineBookingAmount: 20000,
    onlineBookingAmountMode: "percent" as const,
    gstMode: "excluded" as const,
    gstPercent: 18,
    cancellationPreset: "Moderate" as const,
    bookingConfirmation: "automatic" as const,
    maxAdvanceBookingDays: 180,
    minNoticePeriodHours: 48,
    balancePaymentDue: "Before event day",
    taxNotes: "",
    amenities: ["Parking", "AC", "Power Backup", "WiFi"] as string[],
    cancellationPolicy:
      "Free cancellation up to 15 days before the event date. 50% charges apply for cancellations within 15 days.",
    refundPolicy: "Refunds are processed within 7-10 business days to the original payment method.",
    advancePaymentPercent: 25,
    smokingPolicy: "Not Allowed",
    alcoholPolicy: "Allowed with valid license",
    outsideCatering: false,
    outsideDecorations: false,
    outsidePhotography: true,
    petsAllowed: false,
    noiseRestrictions: "Music must be lowered after 11:00 PM as per local noise regulations.",
    notes: "",
    nearbyLandmark: "",
    weeklyOff: "None",
    checkInTime: "09:00 AM",
    checkOutTime: "11:00 PM",
    contactPerson: base.ownerName,
    contactPhone: base.ownerPhone,
    contactEmail: base.ownerEmail,
    parkingCapacity: 60,
    wheelchairAccessible: false,
    powerBackup: true,
    liftAvailable: false,
    kitchenAvailable: true,
    bridalRoomCount: 1,
    restroomCount: 4,
    indoorArea: "",
    outdoorArea: "",
    displayPriority: 5,
    minGuests: 50,
    maxGuests: 500,
    operatingHours: "9:00 AM - 11:00 PM",
    bookingDuration: "8 hours",
    eventCategories: ["Wedding", "Reception"] as string[],
    createdBy: "System",
    updatedBy: "Admin User",
    todaysBookings: seed % 3,
    availabilityLabel:
      base.status === "inactive" || base.status === "archived"
        ? ("blocked" as const)
        : seed % 5 === 0
        ? ("busy" as const)
        : ("available" as const),
  };

  return {
    ...defaults,
    ...base,
    initials: base.initials || initialsOf(base.name),
    bookings,
    reviews,
    documents,
    availability,
    ratingDistribution,
    totalBookings,
    upcomingBookings,
    completedBookings,
    cancelledBookings,
    revenue,
    rating,
    totalReviews: reviews.length,
  };
}

export const mockVenues: Venue[] = [
  enrichVenue(
    {
      id: "1",
      venueId: "VEN-40011",
      name: "The Grand Orchid Banquet",
      businessId: "BIZ-300101",
      businessName: "Orchid Events Pvt Ltd",
      ownerId: "1",
      ownerName: "Rahul Sharma",
      ownerEmail: "rahul.sharma@email.com",
      ownerPhone: "+91 98765 43210",
      category: "Banquet Hall",
      venueType: "Indoor",
      city: "Hyderabad",
      state: "Telangana",
      status: "published",
      approval: "approved",
      featured: true,
      shortDescription: "Hyderabad's most sought-after banquet hall for grand weddings and receptions.",
      detailedDescription:
        "The Grand Orchid Banquet is a premium indoor venue in the heart of Bandra West, offering a lavish crystal-chandelier hall, dedicated bridal suite and a professional in-house event management team. Perfect for weddings, receptions and large corporate galas with capacity for up to 800 guests.",
      highlights: [
        "Crystal chandelier main hall with 20 ft ceilings",
        "Dedicated bridal and groom suites",
        "In-house catering with customizable menus",
        "Ample valet parking for 200+ vehicles",
      ],
      coverImage: "https://picsum.photos/seed/orchid-banquet/1200/700",
      galleryImages: [
        "https://picsum.photos/seed/orchid-banquet-1/900/600",
        "https://picsum.photos/seed/orchid-banquet-2/900/600",
        "https://picsum.photos/seed/orchid-banquet-3/900/600",
        "https://picsum.photos/seed/orchid-banquet-4/900/600",
        "https://picsum.photos/seed/orchid-banquet-5/900/600",
      ],
      images360: ["https://picsum.photos/seed/orchid-banquet-360-1/1200/700"],
      videoUrl: "https://www.youtube.com/watch?v=demo-orchid-banquet",
      addressLine1: "14, Linking Road",
      addressLine2: "Bandra West",
      zipCode: "400050",
      mapsLink: "https://maps.google.com/?q=Banjara+Hills+Hyderabad",
      latitude: "19.0596",
      longitude: "72.8295",
      seatingCapacity: 600,
      diningCapacity: 500,
      floatingCapacity: 800,
      theatreCapacity: 700,
      classroomCapacity: 300,
      standingCapacity: 800,
      startingPrice: 185000,
      weekendPrice: 225000,
      peakPrice: 285000,
      securityDeposit: 50000,
      amenities: [
        "Parking",
        "Valet Parking",
        "AC",
        "Power Backup",
        "WiFi",
        "Bridal Room",
        "Dining Hall",
        "Stage",
        "Decoration",
        "Catering",
        "DJ",
        "Wheelchair Access",
      ],
      cancellationPolicy: "Free cancellation up to 30 days before the event. 50% charges apply within 30 days.",
      advancePaymentPercent: 30,
      alcoholPolicy: "Allowed with valid license",
      outsideCatering: false,
      outsideDecorations: true,
      minGuests: 200,
      maxGuests: 800,
      operatingHours: "8:00 AM - 12:00 AM",
      bookingDuration: "10 hours",
      eventCategories: ["Wedding", "Reception", "Engagement", "Corporate"],
      notes: "Flagship venue for Orchid Events. Consistently top-rated with strong repeat bookings.",
      createdAt: "2024-01-20T10:00:00",
      updatedAt: "2026-07-30T09:24:00",
    },
    1
  ),
  enrichVenue(
    {
      id: "2",
      venueId: "VEN-40012",
      name: "Orchid Rooftop Lounge",
      businessId: "BIZ-300101",
      businessName: "Orchid Events Pvt Ltd",
      ownerId: "1",
      ownerName: "Rahul Sharma",
      ownerEmail: "rahul.sharma@email.com",
      ownerPhone: "+91 98765 43210",
      category: "Rooftop",
      venueType: "Outdoor",
      city: "Hyderabad",
      state: "Telangana",
      status: "published",
      approval: "approved",
      shortDescription: "Chic open-air rooftop with skyline views, ideal for cocktail nights and sundowners.",
      detailedDescription:
        "Orchid Rooftop Lounge offers panoramic views of the Hyderabad skyline with a stylish open-air deck, ambient lighting and a fully stocked bar counter. A favorite for cocktail parties, sundowner receptions and intimate celebrations.",
      highlights: [
        "360° skyline views of Hyderabad",
        "Dedicated bar counter and mixologist on request",
        "Ambient string lighting and lounge seating",
      ],
      coverImage: "https://picsum.photos/seed/orchid-rooftop/1200/700",
      galleryImages: [
        "https://picsum.photos/seed/orchid-rooftop-1/900/600",
        "https://picsum.photos/seed/orchid-rooftop-2/900/600",
        "https://picsum.photos/seed/orchid-rooftop-3/900/600",
      ],
      addressLine1: "14, Linking Road, Terrace Level",
      addressLine2: "Bandra West",
      zipCode: "400050",
      mapsLink: "https://maps.google.com/?q=Banjara+Hills+Hyderabad",
      latitude: "19.0598",
      longitude: "72.8296",
      seatingCapacity: 120,
      diningCapacity: 100,
      floatingCapacity: 180,
      theatreCapacity: 150,
      classroomCapacity: 60,
      standingCapacity: 200,
      startingPrice: 95000,
      weekendPrice: 120000,
      peakPrice: 145000,
      securityDeposit: 30000,
      amenities: ["Parking", "AC", "WiFi", "Music", "DJ", "Decoration", "Catering"],
      advancePaymentPercent: 25,
      alcoholPolicy: "Allowed with valid license",
      outsideCatering: false,
      outsideDecorations: true,
      minGuests: 30,
      maxGuests: 200,
      operatingHours: "5:00 PM - 1:00 AM",
      bookingDuration: "6 hours",
      eventCategories: ["Cocktail", "Birthday", "Corporate", "Engagement"],
      notes: "Popular for evening cocktail events; sound restrictions apply after 11 PM per local regulations.",
      createdAt: "2024-02-05T11:00:00",
      updatedAt: "2026-07-28T14:12:00",
    },
    2
  ),
  enrichVenue(
    {
      id: "3",
      venueId: "VEN-40015",
      name: "Garden Pavilion",
      businessId: "BIZ-300101",
      businessName: "Orchid Events Pvt Ltd",
      ownerId: "1",
      ownerName: "Rahul Sharma",
      ownerEmail: "rahul.sharma@email.com",
      ownerPhone: "+91 98765 43210",
      category: "Lawn",
      venueType: "Outdoor",
      city: "Bengaluru",
      state: "Telangana",
      status: "pending",
      approval: "pending",
      shortDescription: "Sprawling green lawn venue awaiting final approval for large outdoor celebrations.",
      detailedDescription:
        "Garden Pavilion is a newly onboarded outdoor lawn venue in Bengaluru spanning over 2 acres of landscaped gardens, designed for large-scale weddings and destination-style celebrations. Currently under review pending final documentation.",
      highlights: ["2-acre landscaped lawn", "Dedicated mandap and stage zone", "On-site guest parking for 150 cars"],
      addressLine1: "Plot 22, Baner-Pashan Link Road",
      addressLine2: "Near Balewadi",
      zipCode: "411045",
      mapsLink: "https://maps.google.com/?q=Indiranagar+Bengaluru",
      latitude: "18.5590",
      longitude: "73.7868",
      seatingCapacity: 500,
      diningCapacity: 400,
      floatingCapacity: 600,
      theatreCapacity: 550,
      classroomCapacity: 200,
      standingCapacity: 650,
      startingPrice: 150000,
      weekendPrice: 185000,
      peakPrice: 230000,
      securityDeposit: 40000,
      amenities: ["Parking", "Power Backup", "Garden", "Stage", "Decoration", "Bridal Room"],
      advancePaymentPercent: 30,
      outsideCatering: true,
      outsideDecorations: true,
      minGuests: 150,
      maxGuests: 700,
      operatingHours: "10:00 AM - 11:00 PM",
      bookingDuration: "10 hours",
      eventCategories: ["Wedding", "Reception"],
      notes: "Awaiting government approval documents and fire safety certification before publishing.",
      createdAt: "2026-06-18T09:30:00",
      updatedAt: "2026-07-25T16:40:00",
    },
    3
  ),
  enrichVenue(
    {
      id: "4",
      venueId: "VEN-50001",
      name: "Patel Grand Celebration Hall",
      businessId: "BIZ-300102",
      businessName: "Patel Celebrations",
      ownerId: "2",
      ownerName: "Priya Patel",
      ownerEmail: "priya.patel@email.com",
      ownerPhone: "+91 98201 55678",
      category: "Banquet Hall",
      venueType: "Indoor",
      city: "Karimnagar",
      state: "Telangana",
      status: "published",
      approval: "approved",
      shortDescription: "Boutique banquet hall on CG Road known for warm hospitality and Telangana wedding traditions.",
      detailedDescription:
        "Patel Grand Celebration Hall is a beautifully appointed indoor venue offering traditional Telangana wedding ambience combined with modern amenities. Centrally located with easy access from across Karimnagar.",
      highlights: ["Traditional mandap setup included", "In-house Gujarati & Rajasthani catering", "Dedicated kids play zone"],
      coverImage: "https://picsum.photos/seed/patel-hall/1200/700",
      galleryImages: [
        "https://picsum.photos/seed/patel-hall-1/900/600",
        "https://picsum.photos/seed/patel-hall-2/900/600",
        "https://picsum.photos/seed/patel-hall-3/900/600",
      ],
      addressLine1: "22, CG Road",
      addressLine2: "Navrangpura",
      zipCode: "380009",
      mapsLink: "https://maps.google.com/?q=Mukarampura+Karimnagar",
      latitude: "23.0333",
      longitude: "72.5628",
      seatingCapacity: 350,
      diningCapacity: 300,
      floatingCapacity: 450,
      theatreCapacity: 400,
      classroomCapacity: 150,
      standingCapacity: 500,
      startingPrice: 110000,
      weekendPrice: 135000,
      peakPrice: 165000,
      securityDeposit: 30000,
      amenities: ["Parking", "AC", "Power Backup", "WiFi", "Dining Hall", "Stage", "Catering", "Kids Area", "Bridal Room"],
      advancePaymentPercent: 20,
      outsideCatering: false,
      outsideDecorations: false,
      minGuests: 100,
      maxGuests: 500,
      operatingHours: "9:00 AM - 11:00 PM",
      bookingDuration: "8 hours",
      eventCategories: ["Wedding", "Reception", "Birthday", "Engagement"],
      notes: "Strong repeat customer base within the local Gujarati community.",
      createdAt: "2024-03-10T10:00:00",
      updatedAt: "2026-07-27T12:00:00",
    },
    4
  ),
  enrichVenue(
    {
      id: "5",
      venueId: "VEN-50002",
      name: "Reddy Convention Centre",
      businessId: "BIZ-300103",
      businessName: "Reddy Convention Spaces",
      ownerId: "3",
      ownerName: "Arjun Reddy",
      ownerEmail: "arjun.reddy@email.com",
      ownerPhone: "+91 99860 11223",
      category: "Convention Center",
      venueType: "Indoor",
      city: "Hyderabad",
      state: "Telangana",
      status: "pending",
      approval: "pending",
      shortDescription: "Modern convention centre in Jubilee Hills built for large conferences and exhibitions.",
      detailedDescription:
        "Reddy Convention Centre offers column-free exhibition floors, breakout rooms and advanced AV infrastructure tailored for Hyderabad's growing corporate and conference market. Newly onboarded and pending compliance verification.",
      highlights: ["Column-free 15,000 sq. ft. exhibition floor", "4 breakout conference rooms", "High-speed WiFi throughout"],
      addressLine1: "Plot 8, Jubilee Hills",
      addressLine2: "Road No. 36",
      zipCode: "500033",
      mapsLink: "https://maps.google.com/?q=Jubilee+Hills+Road+36+Hyderabad",
      latitude: "17.4326",
      longitude: "78.4071",
      seatingCapacity: 800,
      diningCapacity: 300,
      floatingCapacity: 1000,
      theatreCapacity: 900,
      classroomCapacity: 400,
      standingCapacity: 1200,
      startingPrice: 220000,
      weekendPrice: 260000,
      peakPrice: 310000,
      securityDeposit: 60000,
      amenities: ["Parking", "AC", "Power Backup", "WiFi", "Projector", "Stage", "Wheelchair Access"],
      advancePaymentPercent: 35,
      outsideCatering: true,
      outsideDecorations: true,
      minGuests: 200,
      maxGuests: 1200,
      operatingHours: "8:00 AM - 10:00 PM",
      bookingDuration: "12 hours",
      eventCategories: ["Conference", "Corporate", "Exhibition"],
      notes: "New partnership onboarded via referral. Government approval documents under review.",
      createdAt: "2026-07-05T11:30:00",
      updatedAt: "2026-07-28T11:05:00",
    },
    5
  ),
  enrichVenue(
    {
      id: "6",
      venueId: "VEN-50003",
      name: "Tamil Heritage Wedding Hall",
      businessId: "BIZ-300104",
      businessName: "Tamil Heritage Venues",
      ownerId: "4",
      ownerName: "Ananya Iyer",
      ownerEmail: "ananya.iyer@email.com",
      ownerPhone: "+91 94440 77889",
      category: "Wedding Venue",
      venueType: "Indoor & Outdoor",
      city: "Chennai",
      state: "Tamil Nadu",
      status: "published",
      approval: "approved",
      featured: true,
      shortDescription: "Heritage-style wedding venue in T Nagar blending Tamil architecture with modern comfort.",
      detailedDescription:
        "Tamil Heritage Wedding Hall combines traditional Dravidian architecture with contemporary amenities, offering both an indoor Kalyana Mandapam and an open courtyard for traditional ceremonies. One of the highest rated venues on the platform.",
      highlights: [
        "Authentic Kalyana Mandapam with traditional pillars",
        "Open courtyard for muhurtham ceremonies",
        "In-house Tamil catering with live counters",
        "Dedicated bridal dressing rooms",
      ],
      coverImage: "https://picsum.photos/seed/tamil-heritage/1200/700",
      galleryImages: [
        "https://picsum.photos/seed/tamil-heritage-1/900/600",
        "https://picsum.photos/seed/tamil-heritage-2/900/600",
        "https://picsum.photos/seed/tamil-heritage-3/900/600",
        "https://picsum.photos/seed/tamil-heritage-4/900/600",
      ],
      images360: ["https://picsum.photos/seed/tamil-heritage-360/1200/700"],
      addressLine1: "7, T Nagar Main Road",
      addressLine2: "Near Panagal Park",
      zipCode: "600017",
      mapsLink: "https://maps.google.com/?q=T+Nagar+Main+Road+Chennai",
      latitude: "13.0418",
      longitude: "80.2341",
      seatingCapacity: 450,
      diningCapacity: 400,
      floatingCapacity: 600,
      theatreCapacity: 550,
      classroomCapacity: 200,
      standingCapacity: 650,
      startingPrice: 130000,
      weekendPrice: 160000,
      peakPrice: 200000,
      securityDeposit: 35000,
      amenities: ["Parking", "AC", "Power Backup", "WiFi", "Bridal Room", "Dining Hall", "Stage", "Catering", "Decoration"],
      advancePaymentPercent: 25,
      outsideCatering: false,
      outsideDecorations: false,
      minGuests: 100,
      maxGuests: 650,
      operatingHours: "6:00 AM - 11:00 PM",
      bookingDuration: "12 hours",
      eventCategories: ["Wedding", "Reception", "Engagement"],
      notes: "One of the highest rated businesses on the platform. No open compliance issues.",
      createdAt: "2023-12-01T08:45:00",
      updatedAt: "2026-07-30T07:40:00",
    },
    6
  ),
  enrichVenue(
    {
      id: "7",
      venueId: "VEN-50004",
      name: "Singh Palace Banquet",
      businessId: "BIZ-300105",
      businessName: "Singh Palace Events",
      ownerId: "5",
      ownerName: "Vikram Singh",
      ownerEmail: "vikram.singh@email.com",
      ownerPhone: "+91 98111 33445",
      category: "Banquet Hall",
      venueType: "Indoor",
      city: "Hyderabad",
      state: "Hyderabad",
      status: "inactive",
      approval: "rejected",
      shortDescription: "Palace-themed banquet hall in Connaught Place, currently inactive pending re-verification.",
      detailedDescription:
        "Singh Palace Banquet offers a regal, palace-inspired interior in the heart of Central Hyderabad. The venue is temporarily inactive as verification documents are being resubmitted following an expired trade license.",
      highlights: ["Palace-themed interior with hand-carved décor", "Central Hyderabad location", "Grand entrance porch for baraat"],
      addressLine1: "B-12, Connaught Place",
      addressLine2: "Block B",
      zipCode: "110001",
      mapsLink: "https://maps.google.com/?q=Jubilee+Hills+Hyderabad",
      latitude: "28.6315",
      longitude: "77.2167",
      seatingCapacity: 300,
      diningCapacity: 250,
      floatingCapacity: 400,
      theatreCapacity: 350,
      classroomCapacity: 150,
      standingCapacity: 450,
      startingPrice: 140000,
      weekendPrice: 170000,
      peakPrice: 210000,
      securityDeposit: 35000,
      amenities: ["Parking", "AC", "Power Backup", "Stage", "Decoration", "Catering"],
      advancePaymentPercent: 25,
      outsideCatering: false,
      outsideDecorations: false,
      minGuests: 100,
      maxGuests: 450,
      operatingHours: "9:00 AM - 11:00 PM",
      bookingDuration: "8 hours",
      eventCategories: ["Wedding", "Reception"],
      notes: "Verification rejected due to expired trade license. Owner notified to re-submit documents.",
      createdAt: "2025-09-15T14:00:00",
      updatedAt: "2026-05-12T14:20:00",
    },
    7
  ),
  enrichVenue(
    {
      id: "8",
      venueId: "VEN-50005",
      name: "Coastal Backwater Resort",
      businessId: "BIZ-300106",
      businessName: "Coastal Celebrations LLP",
      ownerId: "6",
      ownerName: "Sneha Nair",
      ownerEmail: "sneha.nair@email.com",
      ownerPhone: "+91 98470 22334",
      category: "Resort",
      venueType: "Indoor & Outdoor",
      city: "Chennai",
      state: "Tamil Nadu",
      status: "published",
      approval: "approved",
      shortDescription: "Serene backwater resort in Madurai offering destination wedding experiences.",
      detailedDescription:
        "Coastal Backwater Resort blends Kerala's traditional architecture with waterfront views, offering both an indoor banquet hall and an open backwater deck for sunset ceremonies. A favorite for destination weddings and retreats.",
      highlights: ["Private backwater deck for sunset ceremonies", "On-site guest villas for outstation guests", "Kerala Sadhya catering specialists"],
      coverImage: "https://picsum.photos/seed/coastal-resort/1200/700",
      galleryImages: [
        "https://picsum.photos/seed/coastal-resort-1/900/600",
        "https://picsum.photos/seed/coastal-resort-2/900/600",
        "https://picsum.photos/seed/coastal-resort-3/900/600",
      ],
      addressLine1: "Marine Drive",
      addressLine2: "Near Boat Jetty",
      zipCode: "682031",
      mapsLink: "https://maps.google.com/?q=Anna+Nagar+Madurai",
      latitude: "9.9658",
      longitude: "76.2424",
      seatingCapacity: 250,
      diningCapacity: 200,
      floatingCapacity: 350,
      theatreCapacity: 300,
      classroomCapacity: 100,
      standingCapacity: 400,
      startingPrice: 160000,
      weekendPrice: 195000,
      peakPrice: 240000,
      securityDeposit: 40000,
      amenities: ["Parking", "AC", "WiFi", "Swimming Pool", "Garden", "Catering", "Decoration", "Bridal Room"],
      advancePaymentPercent: 30,
      outsideCatering: false,
      outsideDecorations: true,
      minGuests: 60,
      maxGuests: 400,
      operatingHours: "7:00 AM - 11:00 PM",
      bookingDuration: "24 hours",
      eventCategories: ["Wedding", "Reception", "Engagement"],
      notes: "Solid compliance track record with quarterly document refresh.",
      createdAt: "2024-07-01T12:00:00",
      updatedAt: "2026-07-27T16:55:00",
    },
    8
  ),
  enrichVenue(
    {
      id: "9",
      venueId: "VEN-50006",
      name: "Mehta Corporate Event Center",
      businessId: "BIZ-300107",
      businessName: "Mehta Event Solutions",
      ownerId: "7",
      ownerName: "Rohan Mehta",
      ownerEmail: "rohan.mehta@email.com",
      ownerPhone: "+91 98920 66778",
      category: "Convention Center",
      venueType: "Indoor",
      city: "Bengaluru",
      state: "Telangana",
      status: "archived",
      approval: "approved",
      shortDescription: "Corporate event space in Baner archived while the property undergoes renovation.",
      detailedDescription:
        "Mehta Corporate Event Center was a go-to venue for corporate offsites and product launches near Baner Road. The listing has been archived while the venue undergoes a full renovation, per the owner's request.",
      highlights: ["Modular breakout rooms", "Dedicated AV and streaming setup", "Close to IT parks in Baner"],
      addressLine1: "Baner Road",
      addressLine2: "Near DSK Ranwara",
      zipCode: "411045",
      mapsLink: "https://maps.google.com/?q=Koramangala+Bengaluru",
      latitude: "18.5679",
      longitude: "73.7783",
      seatingCapacity: 220,
      diningCapacity: 150,
      floatingCapacity: 300,
      theatreCapacity: 280,
      classroomCapacity: 180,
      standingCapacity: 350,
      startingPrice: 100000,
      weekendPrice: 120000,
      peakPrice: 145000,
      securityDeposit: 25000,
      amenities: ["Parking", "AC", "Power Backup", "WiFi", "Projector", "Catering"],
      advancePaymentPercent: 20,
      outsideCatering: true,
      outsideDecorations: true,
      minGuests: 40,
      maxGuests: 350,
      operatingHours: "8:00 AM - 9:00 PM",
      bookingDuration: "8 hours",
      eventCategories: ["Corporate", "Conference"],
      notes: "Business temporarily marked inactive at owner's request while venue is renovated.",
      createdAt: "2024-08-20T09:30:00",
      updatedAt: "2026-03-01T10:12:00",
    },
    9
  ),
  enrichVenue(
    {
      id: "10",
      venueId: "VEN-50007",
      name: "Garden Grove Lawn",
      businessId: "BIZ-300108",
      businessName: "Garden Grove Venues",
      ownerId: "8",
      ownerName: "Kavya Rao",
      ownerEmail: "kavya.rao@email.com",
      ownerPhone: "+91 99001 44556",
      category: "Lawn",
      venueType: "Outdoor",
      city: "Bengaluru",
      state: "Karnataka",
      status: "draft",
      approval: "pending",
      shortDescription: "New outdoor garden lawn in Indiranagar, still being finalized before publishing.",
      detailedDescription:
        "Garden Grove Lawn is a lush open-air venue surrounded by mature trees, currently in draft state as the team finalizes pricing, gallery images and amenities before making the listing live.",
      highlights: ["Mature tree-lined lawn", "Flexible layout for weddings or corporate offsites"],
      addressLine1: "12th Main, Indiranagar",
      addressLine2: "Near Metro Station",
      zipCode: "560038",
      mapsLink: "https://maps.google.com/?q=Indiranagar+Bengaluru",
      latitude: "12.9716",
      longitude: "77.6412",
      seatingCapacity: 300,
      diningCapacity: 250,
      floatingCapacity: 400,
      theatreCapacity: 350,
      classroomCapacity: 120,
      standingCapacity: 450,
      startingPrice: 90000,
      weekendPrice: 110000,
      peakPrice: 135000,
      securityDeposit: 20000,
      amenities: ["Parking", "Garden", "Power Backup", "Decoration"],
      advancePaymentPercent: 20,
      outsideCatering: true,
      outsideDecorations: true,
      minGuests: 80,
      maxGuests: 450,
      operatingHours: "10:00 AM - 10:00 PM",
      bookingDuration: "8 hours",
      eventCategories: ["Wedding", "Birthday", "Corporate"],
      notes: "Draft listing — pending final pricing review and gallery uploads before publishing.",
      createdAt: "2026-07-20T09:00:00",
      updatedAt: "2026-07-30T12:01:00",
    },
    10
  ),
  enrichVenue(
    {
      id: "11",
      venueId: "VEN-50008",
      name: "Royal Rajasthan Palace Lawn",
      businessId: "BIZ-300109",
      businessName: "Royal Rajasthan Banquets",
      ownerId: "9",
      ownerName: "Aman Gupta",
      ownerEmail: "aman.gupta@email.com",
      ownerPhone: "+91 98180 99887",
      category: "Lawn",
      venueType: "Outdoor",
      city: "Warangal",
      state: "Telangana",
      status: "published",
      approval: "approved",
      featured: true,
      shortDescription: "Royal heritage-style palace lawn in C-Scheme, Hyderabad's most photographed wedding venue.",
      detailedDescription:
        "Royal Rajasthan Palace Lawn recreates the grandeur of Rajasthani royalty with hand-painted archways, courtyards and a sprawling lawn ideal for destination weddings. A favorite among couples looking for a regal celebration.",
      highlights: [
        "Hand-painted Rajasthani entrance archway",
        "Courtyard fountains and heritage lighting",
        "Camel and horse baraat arrangements available",
        "In-house Rajasthani thali catering",
      ],
      coverImage: "https://picsum.photos/seed/royal-rajasthan/1200/700",
      galleryImages: [
        "https://picsum.photos/seed/royal-rajasthan-1/900/600",
        "https://picsum.photos/seed/royal-rajasthan-2/900/600",
        "https://picsum.photos/seed/royal-rajasthan-3/900/600",
        "https://picsum.photos/seed/royal-rajasthan-4/900/600",
        "https://picsum.photos/seed/royal-rajasthan-5/900/600",
      ],
      images360: ["https://picsum.photos/seed/royal-rajasthan-360/1200/700"],
      videoUrl: "https://www.youtube.com/watch?v=demo-royal-rajasthan",
      addressLine1: "C-Scheme",
      addressLine2: "Near Central Park",
      zipCode: "302001",
      mapsLink: "https://maps.google.com/?q=Hanamkonda+Warangal",
      latitude: "26.9124",
      longitude: "75.7873",
      seatingCapacity: 700,
      diningCapacity: 600,
      floatingCapacity: 900,
      theatreCapacity: 800,
      classroomCapacity: 300,
      standingCapacity: 1000,
      startingPrice: 175000,
      weekendPrice: 210000,
      peakPrice: 260000,
      securityDeposit: 45000,
      amenities: ["Parking", "Valet Parking", "Power Backup", "Garden", "Stage", "Decoration", "Catering", "DJ", "Bridal Room"],
      advancePaymentPercent: 30,
      outsideCatering: false,
      outsideDecorations: false,
      minGuests: 200,
      maxGuests: 1000,
      operatingHours: "8:00 AM - 12:00 AM",
      bookingDuration: "12 hours",
      eventCategories: ["Wedding", "Reception", "Engagement"],
      notes: "Document verification in progress for the parent business; venue listing itself is fully compliant.",
      createdAt: "2026-06-15T13:10:00",
      updatedAt: "2026-07-25T20:30:00",
    },
    11
  ),
  enrichVenue(
    {
      id: "12",
      venueId: "VEN-50009",
      name: "Bengal Heritage Hall",
      businessId: "BIZ-300110",
      businessName: "Bengal Heritage Halls",
      ownerId: "10",
      ownerName: "Meera Das",
      ownerEmail: "meera.das@email.com",
      ownerPhone: "+91 98300 11220",
      category: "Banquet Hall",
      venueType: "Indoor",
      city: "Chennai",
      state: "Tamil Nadu",
      status: "published",
      approval: "approved",
      shortDescription: "Colonial-era heritage hall on Park Street, ideal for cultural events and weddings.",
      detailedDescription:
        "Bengal Heritage Hall showcases restored colonial architecture with high ceilings, ornate chandeliers and a grand staircase entrance. Popular for Bengali weddings, cultural performances and receptions.",
      highlights: ["Restored colonial-era architecture", "Grand staircase entrance for photo ops", "In-house Bengali catering specialists"],
      coverImage: "https://picsum.photos/seed/bengal-heritage/1200/700",
      galleryImages: [
        "https://picsum.photos/seed/bengal-heritage-1/900/600",
        "https://picsum.photos/seed/bengal-heritage-2/900/600",
      ],
      addressLine1: "Park Street",
      addressLine2: "Near Maidan",
      zipCode: "700016",
      mapsLink: "https://maps.google.com/?q=T+Nagar+Chennai",
      latitude: "22.5526",
      longitude: "88.3520",
      seatingCapacity: 400,
      diningCapacity: 350,
      floatingCapacity: 500,
      theatreCapacity: 450,
      classroomCapacity: 180,
      standingCapacity: 550,
      startingPrice: 120000,
      weekendPrice: 145000,
      peakPrice: 175000,
      securityDeposit: 30000,
      amenities: ["Parking", "AC", "Power Backup", "WiFi", "Dining Hall", "Stage", "Catering", "Decoration"],
      advancePaymentPercent: 25,
      outsideCatering: false,
      outsideDecorations: false,
      minGuests: 100,
      maxGuests: 550,
      operatingHours: "9:00 AM - 11:00 PM",
      bookingDuration: "8 hours",
      eventCategories: ["Wedding", "Reception", "Exhibition"],
      notes: "Longstanding partner with excellent booking record and clean verification history.",
      createdAt: "2023-12-20T10:00:00",
      updatedAt: "2026-07-29T22:15:00",
    },
    12
  ),
];

export function formatDate(date: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: string) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function getVenueById(id: string) {
  return mockVenues.find((v) => v.id === id || v.venueId === id);
}

function slotMatches(a?: string, b?: string) {
  const norm = (s?: string) => {
    const v = (s || "Full Day").toLowerCase();
    if (v.includes("morning")) return "morning";
    if (v.includes("afternoon")) return "afternoon";
    if (v.includes("evening")) return "evening";
    if (v.includes("night")) return "night";
    if (v.includes("half")) return "half_day";
    if (v.includes("full")) return "full_day";
    return v;
  };
  return norm(a) === norm(b);
}

/** Returns true if the venue/date/slot is already booked. */
export function isVenueSlotBooked(venueRef: string, date: string, slot: string) {
  const venue = getVenueById(venueRef);
  if (!venue) return false;
  const row = venue.availability.find((a) => a.date === date && slotMatches(a.slot, slot));
  return Boolean(row && row.status === "booked" && row.bookingId);
}

export function updateVenueAvailabilityDay(
  venueRef: string,
  date: string,
  slot: string,
  patch: Partial<AvailabilityDay>
) {
  const venue = getVenueById(venueRef);
  if (!venue) return null;
  const idx = venue.availability.findIndex((a) => a.date === date && slotMatches(a.slot, slot));
  if (idx >= 0) {
    venue.availability[idx] = { ...venue.availability[idx], ...patch, date, slot: slot || venue.availability[idx].slot };
    return venue.availability[idx];
  }
  const created: AvailabilityDay = {
    date,
    slot,
    status: patch.status || "available",
    ...patch,
  };
  venue.availability.push(created);
  venue.availability.sort((a, b) => a.date.localeCompare(b.date));
  return created;
}

export function markVenueSlotBooked(
  venueRef: string,
  payload: {
    date: string;
    slot: string;
    bookingId: string;
    bookingRef: string;
    customerName: string;
    eventType: string;
    guests?: number;
  }
) {
  if (isVenueSlotBooked(venueRef, payload.date, payload.slot)) {
    return { ok: false as const, reason: "already_booked" as const };
  }
  updateVenueAvailabilityDay(venueRef, payload.date, payload.slot, {
    status: "booked",
    bookingId: payload.bookingId,
    bookingRef: payload.bookingRef,
    customerName: payload.customerName,
    eventType: payload.eventType,
    guests: payload.guests,
  });
  return { ok: true as const };
}

/** Demo helper — prepends a newly created venue into the in-memory list. */
export function addVenue(venue: Venue): Venue {
  const exists = mockVenues.some((v) => v.id === venue.id);
  if (!exists) mockVenues.unshift(venue);
  return venue;
}

export function createVenueId() {
  const n = 40000 + mockVenues.length + Math.floor(Math.random() * 90);
  return { id: String(Date.now()), venueId: `VEN-${n}` };
}

export function venueToFormValues(venue: Venue): VenueFormValues {
  return {
    name: venue.name,
    businessId: venue.businessId || "",
    businessName: venue.businessName || "",
    ownerId: venue.ownerId || "",
    ownerName: venue.ownerName || "",
    ownerEmail: venue.ownerEmail || "",
    ownerPhone: venue.ownerPhone || "",
    supportEmail: venue.supportEmail || "",
    supportPhone: venue.supportPhone || "",
    category: venue.category || "",
    venueType: venue.venueType || "",
    status: venue.status,
    approval: venue.approval,
    featured: venue.featured,
    shortDescription: venue.shortDescription || "",
    detailedDescription: venue.detailedDescription || "",
    highlights: (venue.highlights || []).join("\n"),
    houseRules: venue.houseRules || "",
    addressLine1: venue.addressLine1 || "",
    addressLine2: venue.addressLine2 || "",
    city: venue.city || "",
    state: venue.state || "",
    country: venue.country || "India",
    zipCode: venue.zipCode || "",
    mapsLink: venue.mapsLink || "",
    latitude: venue.latitude || "",
    longitude: venue.longitude || "",
    seatingCapacity: String(venue.seatingCapacity ?? ""),
    diningCapacity: String(venue.diningCapacity ?? ""),
    floatingCapacity: String(venue.floatingCapacity ?? ""),
    theatreCapacity: String(venue.theatreCapacity ?? ""),
    classroomCapacity: String(venue.classroomCapacity ?? ""),
    standingCapacity: String(venue.standingCapacity ?? ""),
    startingPrice: String(venue.startingPrice ?? ""),
    weekendPrice: String(venue.weekendPrice ?? ""),
    peakPrice: String(venue.peakPrice ?? ""),
    securityDeposit: String(venue.securityDeposit ?? ""),
    cleaningCharges: String(venue.cleaningCharges ?? ""),
    bookingModel: venue.bookingModel || "venue_only",
    pricingMethod: normalizeStoredMethod(venue.pricingMethod),
    foodPricingMethod: "slot_based",
    pricingSlots: (venue.pricingSlots?.length ? venue.pricingSlots : defaultPricingSlots()).map((s) => ({
      ...s,
    })),
    foodPricing: venue.foodPricing ? { ...venue.foodPricing } : defaultFoodPricing(),
    foodSlots: (venue.foodSlots?.length ? venue.foodSlots : defaultFoodSlots()).map((s) => ({
      ...s,
    })),
    addons: (venue.addons || []).map((a) => ({ ...a })),
    minOnlineBookingAmount: String(venue.minOnlineBookingAmount ?? 20000),
    onlineBookingAmountMode: "percent",
    gstMode: venue.gstMode || "excluded",
    gstPercent: String(venue.gstPercent ?? 18),
    cancellationPreset: venue.cancellationPreset || "Moderate",
    bookingConfirmation: venue.bookingConfirmation || "automatic",
    maxAdvanceBookingDays: String(venue.maxAdvanceBookingDays ?? 180),
    minNoticePeriodHours: String(venue.minNoticePeriodHours ?? 48),
    balancePaymentDue: venue.balancePaymentDue || "Before event day",
    taxNotes: venue.taxNotes || "",
    amenities: [...(venue.amenities || [])],
    cancellationPolicy: venue.cancellationPolicy || "",
    refundPolicy: venue.refundPolicy || "",
    advancePaymentPercent: String(venue.advancePaymentPercent ?? ""),
    smokingPolicy: venue.smokingPolicy || "",
    alcoholPolicy: venue.alcoholPolicy || "",
    outsideCatering: Boolean(venue.outsideCatering),
    outsideDecorations: Boolean(venue.outsideDecorations),
    outsidePhotography: Boolean(venue.outsidePhotography),
    petsAllowed: Boolean(venue.petsAllowed),
    noiseRestrictions: venue.noiseRestrictions || "",
    notes: venue.notes || "",
    minGuests: String(venue.minGuests ?? ""),
    maxGuests: String(venue.maxGuests ?? ""),
    operatingHours: venue.operatingHours || "",
    bookingDuration: venue.bookingDuration || "",
    eventCategories: [...(venue.eventCategories || [])],
    nearbyLandmark: venue.nearbyLandmark || "",
    weeklyOff: venue.weeklyOff || "None",
    checkInTime: venue.checkInTime || "",
    checkOutTime: venue.checkOutTime || "",
    contactPerson: venue.contactPerson || "",
    contactPhone: venue.contactPhone || "",
    contactEmail: venue.contactEmail || "",
    parkingCapacity: String(venue.parkingCapacity ?? ""),
    wheelchairAccessible: Boolean(venue.wheelchairAccessible),
    powerBackup: Boolean(venue.powerBackup),
    liftAvailable: Boolean(venue.liftAvailable),
    kitchenAvailable: Boolean(venue.kitchenAvailable),
    bridalRoomCount: String(venue.bridalRoomCount ?? ""),
    restroomCount: String(venue.restroomCount ?? ""),
    indoorArea: venue.indoorArea || "",
    outdoorArea: venue.outdoorArea || "",
    displayPriority: String(venue.displayPriority ?? ""),
  };
}

export const emptyVenueForm: VenueFormValues = {
  name: "",
  businessId: "",
  businessName: "",
  ownerId: "",
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  supportEmail: "",
  supportPhone: "",
  category: "",
  venueType: "Indoor",
  status: "draft",
  approval: "pending",
  featured: false,
  shortDescription: "",
  detailedDescription: "",
  highlights: "",
  houseRules: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "India",
  zipCode: "",
  mapsLink: "",
  latitude: "",
  longitude: "",
  seatingCapacity: "",
  diningCapacity: "",
  floatingCapacity: "",
  theatreCapacity: "",
  classroomCapacity: "",
  standingCapacity: "",
  startingPrice: "",
  weekendPrice: "",
  peakPrice: "",
  securityDeposit: "",
  cleaningCharges: "",
  bookingModel: "venue_only",
  pricingMethod: "full_day",
  foodPricingMethod: "slot_based",
  pricingSlots: defaultPricingSlots(),
  foodPricing: defaultFoodPricing(),
  foodSlots: defaultFoodSlots(),
  addons: defaultAddons(),
  minOnlineBookingAmount: "20000",
  onlineBookingAmountMode: "percent",
  gstMode: "excluded",
  gstPercent: "18",
  cancellationPreset: "Moderate",
  bookingConfirmation: "automatic",
  maxAdvanceBookingDays: "180",
  minNoticePeriodHours: "48",
  balancePaymentDue: "Before event day",
  taxNotes: "",
  amenities: [],
  cancellationPolicy: "",
  refundPolicy: "",
  advancePaymentPercent: "25",
  smokingPolicy: "Not Allowed",
  alcoholPolicy: "Not Allowed",
  outsideCatering: false,
  outsideDecorations: false,
  outsidePhotography: true,
  petsAllowed: false,
  noiseRestrictions: "",
  notes: "",
  minGuests: "",
  maxGuests: "",
  operatingHours: "",
  bookingDuration: "",
  eventCategories: [],
  nearbyLandmark: "",
  weeklyOff: "None",
  checkInTime: "",
  checkOutTime: "",
  contactPerson: "",
  contactPhone: "",
  contactEmail: "",
  parkingCapacity: "",
  wheelchairAccessible: false,
  powerBackup: false,
  liftAvailable: false,
  kitchenAvailable: false,
  bridalRoomCount: "",
  restroomCount: "",
  indoorArea: "",
  outdoorArea: "",
  displayPriority: "",
};

export function blankVenue(overrides: Partial<Venue> = {}): Venue {
  const name = overrides.name || "";
  return {
    id: "new",
    venueId: "VEN-NEW",
    name,
    businessId: "",
    businessName: "",
    ownerId: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    supportEmail: "",
    supportPhone: "",
    category: "",
    venueType: "Indoor",
    status: "draft" as VenueStatus,
    approval: "pending" as ApprovalStatus,
    featured: false,
    shortDescription: "",
    detailedDescription: "",
    highlights: [],
    houseRules: "",
    coverImage: "",
    galleryImages: [],
    images360: [],
    videoUrl: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "India",
    zipCode: "",
    mapsLink: "",
    latitude: "",
    longitude: "",
    seatingCapacity: 0,
    diningCapacity: 0,
    floatingCapacity: 0,
    theatreCapacity: 0,
    classroomCapacity: 0,
    standingCapacity: 0,
    startingPrice: 0,
    weekendPrice: 0,
    peakPrice: 0,
    securityDeposit: 0,
    cleaningCharges: 0,
    bookingModel: "venue_only",
    pricingMethod: "full_day",
    foodPricingMethod: "slot_based",
    pricingSlots: defaultPricingSlots(),
    foodPricing: defaultFoodPricing(),
    foodSlots: defaultFoodSlots(),
    addons: [],
    minOnlineBookingAmount: 20000,
    onlineBookingAmountMode: "percent",
    gstMode: "excluded",
    gstPercent: 18,
    cancellationPreset: "Moderate",
    bookingConfirmation: "automatic",
    maxAdvanceBookingDays: 180,
    minNoticePeriodHours: 48,
    balancePaymentDue: "Before event day",
    taxNotes: "",
    amenities: [],
    cancellationPolicy: "",
    refundPolicy: "",
    advancePaymentPercent: 25,
    smokingPolicy: "Not Allowed",
    alcoholPolicy: "Not Allowed",
    outsideCatering: false,
    outsideDecorations: false,
    outsidePhotography: true,
    petsAllowed: false,
    noiseRestrictions: "",
    notes: "",
    nearbyLandmark: "",
    weeklyOff: "None",
    checkInTime: "",
    checkOutTime: "",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
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
    initials: initialsOf(name || "New Venue"),
    rating: 0,
    totalReviews: 0,
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    revenue: 0,
    todaysBookings: 0,
    availabilityLabel: "available",
    minGuests: 0,
    maxGuests: 0,
    operatingHours: "",
    bookingDuration: "",
    eventCategories: [],
    createdAt: "",
    updatedAt: "",
    createdBy: "—",
    updatedBy: "—",
    bookings: [],
    reviews: [],
    documents: [],
    availability: [],
    ratingDistribution: [5, 4, 3, 2, 1].map((stars) => ({ stars: stars as 1 | 2 | 3 | 4 | 5, count: 0 })),
    ...overrides,
  };
}
