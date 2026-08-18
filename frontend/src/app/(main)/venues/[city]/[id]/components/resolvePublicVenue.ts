import type { Workspace } from "../../data/workspaces";
import type { Venue, VenueAddon, VenueReview } from "@/app/admin/venues/types";
import {
  mockVenues,
  defaultPricingSlots,
  defaultFoodSlots,
  defaultFoodPricing,
  defaultAddons,
} from "@/app/admin/venues/data";

function scaleSlots(basePrice: number) {
  const slots = defaultPricingSlots();
  const full = slots.find((s) => s.key === "full_day");
  const base = Number(full?.price) || 100000;
  const factor = basePrice > 0 ? basePrice / base : 1;
  return slots.map((s) => ({
    ...s,
    price: Math.round((Number(s.price) || 0) * factor),
    minBookingAmount: Math.round((Number(s.minBookingAmount) || 0) * factor),
    maxGuests: s.maxGuests || 400,
  }));
}

function withAddonPrices(addons: VenueAddon[]): VenueAddon[] {
  const priceMap: Record<string, number> = {
    Decoration: 25000,
    Photography: 35000,
    DJ: 18000,
    Generator: 8000,
    Parking: 5000,
    Valet: 7000,
    Projector: 4000,
    "Flower Decorations": 15000,
    "Live Music": 22000,
    Anchor: 12000,
    "LED Wall": 28000,
  };
  return addons.map((a) => ({
    ...a,
    price: Number(a.price) > 0 ? a.price : priceMap[a.name] ?? 0,
    active: a.active !== false,
  }));
}

function sampleReviews(workspace: Workspace): VenueReview[] {
  const names = ["Ananya Reddy", "Karthik Rao", "Priya Sharma", "Vikram Patel", "Sneha Iyer"];
  return names.slice(0, Math.min(5, Math.max(2, Math.floor(workspace.reviewCount / 30)))).map(
    (name, i) => ({
      id: `pub-rev-${workspace.id}-${i}`,
      customerName: name,
      rating: Math.min(5, Math.max(3, Math.round(workspace.rating))),
      comment:
        i === 0
          ? `We hosted our event at ${workspace.name}. The team was professional and the space looked stunning.`
          : "Well maintained venue with good amenities and helpful staff. Would recommend.",
      date: new Date(Date.now() - i * 86400000 * 18).toISOString().slice(0, 10),
      imagesCount: i === 0 ? 3 : 0,
      verifiedBooking: true,
      eventType: workspace.eventTypes?.[0] || "Wedding",
      avatarInitials: name
        .split(" ")
        .map((w) => w[0])
        .join(""),
      recommendation: true,
    })
  );
}

/**
 * Bridge public Workspace listing data → admin Venue booking config.
 * Prefer a published admin venue in the same city for slots/meals/addons;
 * otherwise build from admin defaults scaled to the workspace starting price.
 * Display fields always come from the public workspace.
 */
export function resolvePublicVenue(workspace: Workspace): Venue {
  const cityMatch =
    mockVenues.find(
      (v) =>
        v.city.toLowerCase() === workspace.city.toLowerCase() &&
        v.status === "published"
    ) || mockVenues.find((v) => v.status === "published");

  const pricingSlots = cityMatch?.pricingSlots?.length
    ? cityMatch.pricingSlots.map((s) => {
        if (s.key !== "full_day") return { ...s };
        return { ...s, price: workspace.price || s.price };
      })
    : scaleSlots(workspace.price);

  // Ensure full_day reflects listing "starts from"
  const withFull = pricingSlots.map((s) =>
    s.key === "full_day" ? { ...s, price: workspace.price || s.price, enabled: true } : { ...s }
  );

  const foodSlots = (cityMatch?.foodSlots?.length
    ? cityMatch.foodSlots
    : defaultFoodSlots()
  ).map((s) => ({ ...s }));

  const addons = withAddonPrices(
    cityMatch?.addons?.length ? cityMatch.addons.map((a) => ({ ...a })) : defaultAddons()
  );

  const capacity = workspace.capacity || cityMatch?.maxGuests || 500;
  const images = workspace.images?.length
    ? workspace.images
    : [workspace.image].filter(Boolean);

  return {
    id: workspace.id,
    venueId: `PUB-${workspace.id}`,
    name: workspace.name,
    businessId: cityMatch?.businessId || "BIZ-PUBLIC",
    businessName: cityMatch?.businessName || "Velvet Venues Partner",
    ownerId: cityMatch?.ownerId || "owner-public",
    ownerName: cityMatch?.contactPerson || cityMatch?.ownerName || "Venue Manager",
    ownerEmail: cityMatch?.ownerEmail || "bookings@velvetvenues.com",
    ownerPhone: cityMatch?.ownerPhone || cityMatch?.contactPhone || "+91 98765 43210",
    supportEmail: cityMatch?.supportEmail || "support@velvetvenues.com",
    supportPhone: cityMatch?.supportPhone || "+91 98765 43210",
    category: workspace.type,
    venueType: cityMatch?.venueType || "Indoor",
    status: "published",
    approval: "approved",
    featured: workspace.badge === "Featured",
    shortDescription: workspace.description || "",
    detailedDescription:
      workspace.description ||
      cityMatch?.detailedDescription ||
      `Premium ${workspace.type.toLowerCase()} in ${workspace.area}, ${workspace.city}.`,
    highlights: cityMatch?.highlights?.length
      ? cityMatch.highlights
      : [
          `Capacity up to ${capacity} guests`,
          `${workspace.area} location`,
          "Verified Velvet Venues partner",
        ],
    houseRules: cityMatch?.houseRules || "Standard house rules apply. Contact venue for details.",
    coverImage: workspace.image,
    galleryImages: images,
    images360: cityMatch?.images360 || [],
    videoUrl: cityMatch?.videoUrl || "",
    addressLine1: cityMatch?.addressLine1 || workspace.area,
    addressLine2: cityMatch?.addressLine2 || "",
    city: workspace.city,
    state: cityMatch?.state || "",
    country: "India",
    zipCode: cityMatch?.zipCode || "",
    mapsLink:
      cityMatch?.mapsLink ||
      `https://maps.google.com/?q=${encodeURIComponent(`${workspace.area}, ${workspace.city}`)}`,
    latitude: cityMatch?.latitude || "",
    longitude: cityMatch?.longitude || "",
    seatingCapacity: capacity,
    diningCapacity: Math.round(capacity * 0.8),
    floatingCapacity: capacity,
    theatreCapacity: Math.round(capacity * 0.9),
    classroomCapacity: Math.round(capacity * 0.5),
    standingCapacity: capacity,
    startingPrice: workspace.price,
    weekendPrice: cityMatch?.weekendPrice || Math.round(workspace.price * 1.15),
    peakPrice: cityMatch?.peakPrice || Math.round(workspace.price * 1.35),
    securityDeposit: cityMatch?.securityDeposit || Math.round(workspace.price * 0.15),
    cleaningCharges: cityMatch?.cleaningCharges || 0,
    bookingModel: cityMatch?.bookingModel || "venue_only",
    bookingTypes: cityMatch?.bookingTypes || [cityMatch?.bookingModel || "venue_only"],
    pricingMethod: cityMatch?.pricingMethod || "full_day",
    foodPricingMethod: "slot_based",
    pricingSlots: withFull,
    foodPricing: cityMatch?.foodPricing || defaultFoodPricing(),
    foodSlots,
    addons,
    minOnlineBookingAmount: cityMatch?.minOnlineBookingAmount || Math.round(workspace.price * 0.2),
    onlineBookingAmountMode: cityMatch?.onlineBookingAmountMode || "percent",
    gstMode: cityMatch?.gstMode || "excluded",
    gstPercent: cityMatch?.gstPercent ?? 18,
    cancellationPreset: cityMatch?.cancellationPreset || "Moderate",
    bookingConfirmation: cityMatch?.bookingConfirmation || "automatic",
    maxAdvanceBookingDays: cityMatch?.maxAdvanceBookingDays ?? 180,
    minNoticePeriodHours: cityMatch?.minNoticePeriodHours ?? 48,
    balancePaymentDue: cityMatch?.balancePaymentDue || "Before event day",
    taxNotes: cityMatch?.taxNotes || "",
    amenities: workspace.amenities?.length ? workspace.amenities : cityMatch?.amenities || [],
    cancellationPolicy:
      cityMatch?.cancellationPolicy ||
      "Free cancellation up to 30 days before the event. Partial charges may apply within 30 days.",
    refundPolicy: cityMatch?.refundPolicy || "Refunds processed as per cancellation policy.",
    advancePaymentPercent: cityMatch?.advancePaymentPercent ?? 25,
    smokingPolicy: cityMatch?.smokingPolicy || "Not Allowed",
    alcoholPolicy: cityMatch?.alcoholPolicy || "Allowed with valid license",
    outsideCatering: cityMatch?.outsideCatering ?? false,
    outsideDecorations: cityMatch?.outsideDecorations ?? true,
    outsidePhotography: cityMatch?.outsidePhotography ?? true,
    petsAllowed: cityMatch?.petsAllowed ?? false,
    noiseRestrictions: cityMatch?.noiseRestrictions || "Music till 11 PM",
    notes: "",
    nearbyLandmark: cityMatch?.nearbyLandmark || workspace.area,
    contactPerson: cityMatch?.contactPerson || "Venue Manager",
    contactPhone: cityMatch?.contactPhone || cityMatch?.ownerPhone || "+91 98765 43210",
    contactEmail: cityMatch?.contactEmail || "bookings@velvetvenues.com",
    parkingCapacity: cityMatch?.parkingCapacity || 100,
    wheelchairAccessible: cityMatch?.wheelchairAccessible ?? true,
    powerBackup: cityMatch?.powerBackup ?? true,
    liftAvailable: cityMatch?.liftAvailable ?? true,
    kitchenAvailable: cityMatch?.kitchenAvailable ?? true,
    bridalRoomCount: cityMatch?.bridalRoomCount || 2,
    restroomCount: cityMatch?.restroomCount || 8,
    indoorArea: cityMatch?.indoorArea || "",
    outdoorArea: cityMatch?.outdoorArea || "",
    displayPriority: 1,
    initials: workspace.name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase(),
    rating: workspace.rating,
    totalReviews: workspace.reviewCount,
    totalBookings: cityMatch?.totalBookings || 40,
    upcomingBookings: cityMatch?.upcomingBookings || 3,
    completedBookings: cityMatch?.completedBookings || 35,
    cancelledBookings: cityMatch?.cancelledBookings || 2,
    revenue: cityMatch?.revenue || 0,
    todaysBookings: 0,
    availabilityLabel: "available",
    minGuests: cityMatch?.minGuests || 50,
    maxGuests: capacity,
    operatingHours: cityMatch?.operatingHours || "9:00 AM - 11:00 PM",
    bookingDuration: cityMatch?.bookingDuration || "Full Day / Slot Based",
    weeklyOff: cityMatch?.weeklyOff || "None",
    checkInTime: cityMatch?.checkInTime || "9:00 AM",
    checkOutTime: cityMatch?.checkOutTime || "11:00 PM",
    eventCategories: workspace.eventTypes?.length
      ? workspace.eventTypes
      : cityMatch?.eventCategories || ["Wedding", "Reception"],
    createdAt: cityMatch?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "system",
    updatedBy: "system",
    bookings: cityMatch?.bookings || [],
    reviews: cityMatch?.reviews?.length ? cityMatch.reviews : sampleReviews(workspace),
    documents: cityMatch?.documents || [],
    availability: cityMatch?.availability || [],
    ratingDistribution: cityMatch?.ratingDistribution || [
      { stars: 5, count: Math.round(workspace.reviewCount * 0.55) },
      { stars: 4, count: Math.round(workspace.reviewCount * 0.3) },
      { stars: 3, count: Math.round(workspace.reviewCount * 0.1) },
      { stars: 2, count: Math.round(workspace.reviewCount * 0.03) },
      { stars: 1, count: Math.round(workspace.reviewCount * 0.02) },
    ],
  };
}

export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}
