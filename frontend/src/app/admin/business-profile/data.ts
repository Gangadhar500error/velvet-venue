import {
  BusinessDocument,
  BusinessProfile,
  BusinessProfileFormValues,
  BusinessStatus,
  BusinessVenue,
  DocumentStatus,
  VenueListingStatus,
  VerificationStatus,
} from "./types";

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

export interface OwnerOption {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export const ownerOptions: OwnerOption[] = [
  { id: "1", name: "Rahul Sharma", email: "rahul.sharma@email.com", phone: "+91 98765 43210" },
  { id: "2", name: "Priya Patel", email: "priya.patel@email.com", phone: "+91 98201 55678" },
  { id: "3", name: "Arjun Reddy", email: "arjun.reddy@email.com", phone: "+91 99860 11223" },
  { id: "4", name: "Ananya Iyer", email: "ananya.iyer@email.com", phone: "+91 94440 77889" },
  { id: "5", name: "Vikram Singh", email: "vikram.singh@email.com", phone: "+91 98111 33445" },
  { id: "6", name: "Sneha Nair", email: "sneha.nair@email.com", phone: "+91 98470 22334" },
  { id: "7", name: "Rohan Mehta", email: "rohan.mehta@email.com", phone: "+91 98920 66778" },
  { id: "8", name: "Kavya Rao", email: "kavya.rao@email.com", phone: "+91 99001 44556" },
  { id: "9", name: "Aman Gupta", email: "aman.gupta@email.com", phone: "+91 98180 99887" },
  { id: "10", name: "Meera Das", email: "meera.das@email.com", phone: "+91 98300 11220" },
  { id: "11", name: "Aditya Kapoor", email: "aditya.kapoor@email.com", phone: "+91 98712 33440" },
  { id: "12", name: "Neha Fernandes", email: "neha.fernandes@email.com", phone: "+91 98221 55660" },
];

export function getOwnerOption(ownerId: string) {
  return ownerOptions.find((o) => o.id === ownerId);
}

const venueCategories = [
  "Banquet Hall",
  "Marriage Lawn",
  "Rooftop Lounge",
  "Conference Hall",
  "Resort & Villa",
  "Farmhouse",
];

export const sampleVenues: BusinessVenue[] = [
  {
    id: "v1",
    venueId: "VEN-40001",
    name: "The Grand Orchid Banquet",
    category: "Banquet Hall",
    capacity: 450,
    city: "Hyderabad",
    status: "published",
    rating: 4.5,
    bookings: 86,
  },
  {
    id: "v2",
    venueId: "VEN-40002",
    name: "Orchid Rooftop Lounge",
    category: "Rooftop Lounge",
    capacity: 180,
    city: "Hyderabad",
    status: "published",
    rating: 4.3,
    bookings: 54,
  },
  {
    id: "v3",
    venueId: "VEN-40003",
    name: "Garden Pavilion",
    category: "Marriage Lawn",
    capacity: 600,
    city: "Bengaluru",
    status: "pending",
    rating: 4.1,
    bookings: 12,
  },
];

export const DOCUMENT_SLOT_NAMES = [
  "GST Certificate",
  "PAN Card",
  "Business Registration Certificate",
  "Cancelled Cheque / Bank Proof",
  "Trade License",
  "Other Supporting Documents",
] as const;

export const sampleDocuments: BusinessDocument[] = [
  {
    id: "d1",
    name: "GST Certificate",
    status: "verified",
    uploadedDate: "2024-01-15",
    verifiedBy: "Admin User",
    fileName: "gst-certificate.pdf",
    fileSize: "1.2 MB",
  },
  {
    id: "d2",
    name: "PAN Card",
    status: "verified",
    uploadedDate: "2024-01-15",
    verifiedBy: "Admin User",
    fileName: "pan-card.pdf",
    fileSize: "420 KB",
  },
  {
    id: "d3",
    name: "Business Registration Certificate",
    status: "verified",
    uploadedDate: "2024-01-15",
    verifiedBy: "Admin User",
    fileName: "business-registration.pdf",
    fileSize: "980 KB",
  },
  {
    id: "d4",
    name: "Cancelled Cheque / Bank Proof",
    status: "uploaded",
    uploadedDate: "2024-01-18",
    verifiedBy: "—",
    fileName: "cancelled-cheque.pdf",
    fileSize: "640 KB",
  },
  {
    id: "d5",
    name: "Trade License",
    status: "pending",
    uploadedDate: "",
    verifiedBy: "—",
  },
  {
    id: "d6",
    name: "Other Supporting Documents",
    status: "pending",
    uploadedDate: "",
    verifiedBy: "—",
  },
];

/** Empty document slots for create flow */
export function defaultDocumentSlots(): BusinessDocument[] {
  return DOCUMENT_SLOT_NAMES.map((name, idx) => ({
    id: `new-doc-${idx + 1}`,
    name,
    status: "pending" as const,
    uploadedDate: "",
    verifiedBy: "—",
  }));
}

export function isValidIfsc(code: string) {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(code.trim().toUpperCase());
}

function slug(name: string) {
  return name
    .toLowerCase()
    .replace(/pvt\.?|ltd\.?|llp|private|limited/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16) || "business";
}

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "BP"
  );
}

interface VenueCounts {
  published: number;
  pending: number;
  inactive: number;
  draft: number;
}

function buildVenues(businessId: string, businessName: string, city: string, counts: VenueCounts): BusinessVenue[] {
  const plan: { status: VenueListingStatus; count: number }[] = [
    { status: "published", count: counts.published },
    { status: "pending", count: counts.pending },
    { status: "inactive", count: counts.inactive },
    { status: "draft", count: counts.draft },
  ];
  const venues: BusinessVenue[] = [];
  let index = 0;
  plan.forEach(({ status, count }) => {
    for (let i = 0; i < count; i += 1) {
      const category = venueCategories[index % venueCategories.length];
      index += 1;
      venues.push({
        id: `${businessId}-v${index}`,
        venueId: `VEN-4${businessId.replace(/\D/g, "").padStart(2, "0")}${String(index).padStart(2, "0")}`,
        name: `${businessName} ${category}`,
        category,
        capacity: 120 + index * 65,
        city,
        status,
        rating: status === "published" ? Math.min(4.9, 3.9 + index * 0.15) : 0,
        bookings: status === "published" ? 8 + index * 11 : 0,
      });
    }
  });
  return venues;
}

function buildDocuments(verification: VerificationStatus, createdAt: string): BusinessDocument[] {
  const baseDate = createdAt ? createdAt.slice(0, 10) : "2024-01-01";
  const statusFor = (idx: number): DocumentStatus => {
    if (verification === "verified") return idx < 4 ? "verified" : "pending";
    if (verification === "rejected") return idx === 0 ? "rejected" : idx < 3 ? "uploaded" : "pending";
    return idx < 2 ? "uploaded" : "pending";
  };
  return DOCUMENT_SLOT_NAMES.map((name, idx) => {
    const status = statusFor(idx);
    const slugName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return {
      id: `${baseDate}-doc${idx + 1}`,
      name,
      status,
      uploadedDate: status === "pending" ? "" : baseDate,
      verifiedBy: status === "verified" ? "Admin User" : "—",
      fileName: status === "pending" ? undefined : `${slugName}.pdf`,
      fileSize: status === "pending" ? undefined : `${(0.4 + idx * 0.2).toFixed(1)} MB`,
    };
  });
}

function enrich(
  base: Partial<BusinessProfile> &
    Pick<
      BusinessProfile,
      | "id"
      | "businessId"
      | "businessName"
      | "businessType"
      | "ownerId"
      | "ownerName"
      | "ownerEmail"
      | "ownerPhone"
      | "city"
      | "state"
      | "status"
      | "verification"
      | "createdAt"
      | "updatedAt"
    >
): BusinessProfile {
  const totalVenues =
    base.totalVenues ??
    (base.publishedVenues ?? 0) +
      (base.pendingVenues ?? 0) +
      (base.inactiveVenues ?? 0) +
      (base.draftVenues ?? 0);

  return {
    legalBusinessName: base.businessName,
    businessDescription: `${base.businessName} offers premium event venues and hospitality services in ${base.city}.`,
    website: `https://www.${slug(base.businessName)}.in`,
    yearsInBusiness: 1,
    supportEmail: `support@${slug(base.businessName)}.com`,
    supportPhone: base.ownerPhone,
    alternatePhone: base.ownerPhone,
    addressLine1: `12, ${base.city} Business Park`,
    addressLine2: "Near City Center",
    country: "India",
    zipCode: "400001",
    gstNumber: "—",
    businessRegistrationNumber: "—",
    panNumber: "—",
    accountHolderName: base.ownerName,
    bankName: "HDFC Bank",
    accountNumber: "50100" + String(1000000 + Number(base.id) * 1111).slice(0, 7),
    ifscCode: "HDFC0001234",
    bankProofFileName: "cancelled-cheque.pdf",
    bankProofFileSize: "640 KB",
    bankProofUploadedDate: base.createdAt?.slice(0, 10) || "2024-01-15",
    notes: `${base.businessName} onboarded successfully. No pending compliance issues at this time.`,
    createdBy: "System",
    updatedBy: "Admin User",
    publishedVenues: 0,
    pendingVenues: 0,
    inactiveVenues: 0,
    draftVenues: 0,
    ...base,
    initials: base.initials || initialsOf(base.businessName),
    totalVenues,
    venues:
      base.venues ??
      buildVenues(base.businessId, base.businessName, base.city, {
        published: base.publishedVenues ?? 0,
        pending: base.pendingVenues ?? 0,
        inactive: base.inactiveVenues ?? 0,
        draft: base.draftVenues ?? 0,
      }),
    documents: base.documents ?? buildDocuments(base.verification, base.createdAt),
  };
}

export const mockBusinessProfiles: BusinessProfile[] = [
  enrich({
    id: "1",
    businessId: "BIZ-300101",
    businessName: "Orchid Events Pvt Ltd",
    legalBusinessName: "Orchid Events Private Limited",
    businessType: "Private Limited",
    ownerId: "1",
    ownerName: "Rahul Sharma",
    ownerEmail: "rahul.sharma@email.com",
    ownerPhone: "+91 98765 43210",
    city: "Hyderabad",
    state: "Telangana",
    addressLine1: "14, Linking Road",
    addressLine2: "Bandra West",
    zipCode: "400050",
    supportEmail: "support@orchidevents.in",
    supportPhone: "+91 22 4012 3456",
    alternatePhone: "+91 98765 11111",
    website: "https://www.orchidevents.in",
    businessDescription: "Premium wedding and corporate event venues across Hyderabad and Bengaluru.",
    yearsInBusiness: 6,
    gstNumber: "27AAAPL1234C1Z5",
    panNumber: "AAAPL1234C",
    businessRegistrationNumber: "U74999MH2019PTC321456",
    notes: "Long-standing partner with strong booking volume. KYC documents verified in Jan 2024.",
    status: "active",
    verification: "verified",
    publishedVenues: 4,
    pendingVenues: 1,
    inactiveVenues: 1,
    draftVenues: 0,
    createdAt: "2024-01-12T09:00:00",
    updatedAt: "2026-07-30T09:24:00",
    venues: [
      {
        id: "1-v1",
        venueId: "VEN-40011",
        name: "The Grand Orchid Banquet",
        category: "Banquet Hall",
        capacity: 450,
        city: "Hyderabad",
        status: "published",
        rating: 4.5,
        bookings: 86,
      },
      {
        id: "1-v2",
        venueId: "VEN-40012",
        name: "Orchid Rooftop Lounge",
        category: "Rooftop Lounge",
        capacity: 180,
        city: "Hyderabad",
        status: "published",
        rating: 4.3,
        bookings: 54,
      },
      {
        id: "1-v3",
        venueId: "VEN-40013",
        name: "Orchid Conference Suite",
        category: "Conference Hall",
        capacity: 220,
        city: "Hyderabad",
        status: "published",
        rating: 4.2,
        bookings: 39,
      },
      {
        id: "1-v4",
        venueId: "VEN-40014",
        name: "Orchid Hospitality Villa",
        category: "Resort & Villa",
        capacity: 300,
        city: "Bengaluru",
        status: "published",
        rating: 4.4,
        bookings: 47,
      },
      {
        id: "1-v5",
        venueId: "VEN-40015",
        name: "Garden Pavilion",
        category: "Marriage Lawn",
        capacity: 600,
        city: "Bengaluru",
        status: "pending",
        rating: 0,
        bookings: 0,
      },
      {
        id: "1-v6",
        venueId: "VEN-40016",
        name: "Orchid Legacy Draft Space",
        category: "Farmhouse",
        capacity: 200,
        city: "Hyderabad",
        status: "inactive",
        rating: 0,
        bookings: 0,
      },
    ],
  }),
  enrich({
    id: "2",
    businessId: "BIZ-300102",
    businessName: "Patel Celebrations",
    legalBusinessName: "Patel Celebrations",
    businessType: "Proprietorship",
    ownerId: "2",
    ownerName: "Priya Patel",
    ownerEmail: "priya.patel@email.com",
    ownerPhone: "+91 98201 55678",
    city: "Karimnagar",
    state: "Telangana",
    addressLine1: "22, CG Road",
    addressLine2: "Navrangpura",
    zipCode: "380009",
    supportEmail: "support@patelcelebrations.com",
    supportPhone: "+91 79 4055 2233",
    alternatePhone: "+91 98201 22222",
    website: "https://www.patelcelebrations.com",
    businessDescription: "Boutique celebration venues and catering services in Gujarat.",
    yearsInBusiness: 4,
    gstNumber: "24AABPP5678D1Z2",
    panNumber: "AABPP5678D",
    businessRegistrationNumber: "UDYAM-GJ-01-0023456",
    notes: "Fast-growing proprietorship with consistent verification compliance.",
    status: "active",
    verification: "verified",
    publishedVenues: 3,
    pendingVenues: 1,
    inactiveVenues: 0,
    draftVenues: 0,
    createdAt: "2024-03-04T10:15:00",
    updatedAt: "2026-07-29T18:10:00",
  }),
  enrich({
    id: "3",
    businessId: "BIZ-300103",
    businessName: "Reddy Convention Spaces",
    legalBusinessName: "Reddy Convention Spaces",
    businessType: "Partnership",
    ownerId: "3",
    ownerName: "Arjun Reddy",
    ownerEmail: "arjun.reddy@email.com",
    ownerPhone: "+91 99860 11223",
    city: "Hyderabad",
    state: "Telangana",
    addressLine1: "Plot 8, Jubilee Hills",
    addressLine2: "Road No. 36",
    zipCode: "500033",
    supportEmail: "support@reddyconventions.in",
    supportPhone: "+91 40 4123 7788",
    alternatePhone: "+91 99860 44444",
    website: "https://www.reddyconventions.in",
    businessDescription: "Convention and conference spaces serving Hyderabad's corporate market.",
    yearsInBusiness: 1,
    gstNumber: "36AACPR2345E1Z8",
    panNumber: "AACPR2345E",
    businessRegistrationNumber: "REG/TS/2026/00891",
    notes: "New partnership onboarded via referral. Awaiting final document verification.",
    status: "pending",
    verification: "pending",
    publishedVenues: 0,
    pendingVenues: 1,
    inactiveVenues: 0,
    draftVenues: 0,
    createdAt: "2026-07-02T11:30:00",
    updatedAt: "2026-07-28T11:05:00",
  }),
  enrich({
    id: "4",
    businessId: "BIZ-300104",
    businessName: "Tamil Heritage Venues",
    legalBusinessName: "Tamil Heritage Venues Private Limited",
    businessType: "Private Limited",
    ownerId: "4",
    ownerName: "Ananya Iyer",
    ownerEmail: "ananya.iyer@email.com",
    ownerPhone: "+91 94440 77889",
    city: "Chennai",
    state: "Tamil Nadu",
    addressLine1: "7, T Nagar Main Road",
    addressLine2: "Near Panagal Park",
    zipCode: "600017",
    supportEmail: "support@tamilheritagevenues.in",
    supportPhone: "+91 44 2815 6690",
    alternatePhone: "+91 94440 33333",
    website: "https://www.tamilheritagevenues.in",
    businessDescription: "Heritage-style banquet and wedding venues across Tamil Nadu.",
    yearsInBusiness: 8,
    gstNumber: "33AAACT6789F1Z1",
    panNumber: "AAACT6789F",
    businessRegistrationNumber: "U74999TN2017PTC118823",
    notes: "One of the highest rated businesses on the platform. No open compliance issues.",
    status: "active",
    verification: "verified",
    publishedVenues: 7,
    pendingVenues: 0,
    inactiveVenues: 0,
    draftVenues: 1,
    createdAt: "2023-11-18T08:45:00",
    updatedAt: "2026-07-30T07:40:00",
  }),
  enrich({
    id: "5",
    businessId: "BIZ-300105",
    businessName: "Singh Palace Events",
    legalBusinessName: "Singh Palace Events",
    businessType: "Proprietorship",
    ownerId: "5",
    ownerName: "Vikram Singh",
    ownerEmail: "vikram.singh@email.com",
    ownerPhone: "+91 98111 33445",
    city: "Hyderabad",
    state: "Hyderabad",
    addressLine1: "B-12, Connaught Place",
    addressLine2: "Block B",
    zipCode: "110001",
    supportEmail: "support@singhpalaceevents.com",
    supportPhone: "+91 11 4356 9012",
    alternatePhone: "+91 98111 55555",
    website: "https://www.singhpalaceevents.com",
    businessDescription: "Palace-themed banquet venues in Central Hyderabad.",
    yearsInBusiness: 3,
    gstNumber: "07AABPS3456G1Z6",
    panNumber: "AABPS3456G",
    businessRegistrationNumber: "REG/DL/2023/00456",
    notes: "Verification rejected due to expired trade license. Owner notified to re-submit documents.",
    status: "inactive",
    verification: "rejected",
    publishedVenues: 0,
    pendingVenues: 0,
    inactiveVenues: 1,
    draftVenues: 0,
    createdAt: "2025-09-09T14:00:00",
    updatedAt: "2026-05-12T14:20:00",
  }),
  enrich({
    id: "6",
    businessId: "BIZ-300106",
    businessName: "Coastal Celebrations LLP",
    legalBusinessName: "Coastal Celebrations LLP",
    businessType: "LLP",
    ownerId: "6",
    ownerName: "Sneha Nair",
    ownerEmail: "sneha.nair@email.com",
    ownerPhone: "+91 98470 22334",
    city: "Madurai",
    state: "Tamil Nadu",
    addressLine1: "Marine Drive",
    addressLine2: "Near Boat Jetty",
    zipCode: "682031",
    supportEmail: "support@coastalcelebrations.in",
    supportPhone: "+91 48 4267 9012",
    alternatePhone: "+91 98470 66666",
    website: "https://www.coastalcelebrations.in",
    businessDescription: "Backwater and beachside venues for weddings and retreats in Kerala.",
    yearsInBusiness: 5,
    gstNumber: "32AAFCC7890H1Z3",
    panNumber: "AAFCC7890H",
    businessRegistrationNumber: "LLPIN-AAK-2021-0034521",
    notes: "Solid compliance track record with quarterly document refresh.",
    status: "active",
    verification: "verified",
    publishedVenues: 2,
    pendingVenues: 1,
    inactiveVenues: 0,
    draftVenues: 0,
    createdAt: "2024-06-22T12:00:00",
    updatedAt: "2026-07-27T16:55:00",
  }),
  enrich({
    id: "7",
    businessId: "BIZ-300107",
    businessName: "Mehta Event Solutions",
    legalBusinessName: "Mehta Event Solutions Private Limited",
    businessType: "Private Limited",
    ownerId: "7",
    ownerName: "Rohan Mehta",
    ownerEmail: "rohan.mehta@email.com",
    ownerPhone: "+91 98920 66778",
    city: "Bengaluru",
    state: "Telangana",
    addressLine1: "Baner Road",
    addressLine2: "Near DSK Ranwara",
    zipCode: "411045",
    supportEmail: "support@mehtaevents.in",
    supportPhone: "+91 20 6712 3400",
    alternatePhone: "+91 98920 77777",
    website: "https://www.mehtaevents.in",
    businessDescription: "Full-service event venues for corporate offsites and celebrations.",
    yearsInBusiness: 4,
    gstNumber: "27AACPM4567J1Z9",
    panNumber: "AACPM4567J",
    businessRegistrationNumber: "U74999MH2020PTC338812",
    notes: "Business temporarily marked inactive at owner's request while venues are renovated.",
    status: "inactive",
    verification: "verified",
    publishedVenues: 0,
    pendingVenues: 0,
    inactiveVenues: 2,
    draftVenues: 0,
    createdAt: "2024-08-14T09:30:00",
    updatedAt: "2026-03-01T10:12:00",
  }),
  enrich({
    id: "8",
    businessId: "BIZ-300108",
    businessName: "Garden Grove Venues",
    legalBusinessName: "Garden Grove Venues Private Limited",
    businessType: "Private Limited",
    ownerId: "8",
    ownerName: "Kavya Rao",
    ownerEmail: "kavya.rao@email.com",
    ownerPhone: "+91 99001 44556",
    city: "Bengaluru",
    state: "Karnataka",
    addressLine1: "12th Main, Indiranagar",
    addressLine2: "Near Metro Station",
    zipCode: "560038",
    supportEmail: "support@gardengrovevenues.in",
    supportPhone: "+91 80 4123 8890",
    alternatePhone: "+91 99001 88888",
    website: "https://www.gardengrovevenues.in",
    businessDescription: "Garden and outdoor venue specialists serving Bengaluru's tech corridor.",
    yearsInBusiness: 5,
    gstNumber: "29AABCG8901K1Z4",
    panNumber: "AABCG8901K",
    businessRegistrationNumber: "U74999KA2019PTC127744",
    notes: "Strong verification history and highly rated venues.",
    status: "active",
    verification: "verified",
    publishedVenues: 4,
    pendingVenues: 1,
    inactiveVenues: 0,
    draftVenues: 0,
    createdAt: "2024-02-28T09:00:00",
    updatedAt: "2026-07-30T12:01:00",
  }),
  enrich({
    id: "9",
    businessId: "BIZ-300109",
    businessName: "Royal Rajasthan Banquets",
    legalBusinessName: "Royal Rajasthan Banquets",
    businessType: "Partnership",
    ownerId: "9",
    ownerName: "Aman Gupta",
    ownerEmail: "aman.gupta@email.com",
    ownerPhone: "+91 98180 99887",
    city: "Warangal",
    state: "Telangana",
    addressLine1: "C-Scheme",
    addressLine2: "Near Central Park",
    zipCode: "302001",
    supportEmail: "support@royalrajasthanbanquets.in",
    supportPhone: "+91 141 402 5567",
    alternatePhone: "+91 98180 22233",
    website: "https://www.royalrajasthanbanquets.in",
    businessDescription: "Royal heritage-style banquet halls and palace lawns in Warangal.",
    yearsInBusiness: 2,
    gstNumber: "08AAFCR2233L1Z7",
    panNumber: "AAFCR2233L",
    businessRegistrationNumber: "REG/RJ/2026/00234",
    notes: "Document verification in progress; PAN and GST submitted, trade license pending.",
    status: "active",
    verification: "pending",
    publishedVenues: 1,
    pendingVenues: 1,
    inactiveVenues: 0,
    draftVenues: 0,
    createdAt: "2026-06-11T13:10:00",
    updatedAt: "2026-07-25T20:30:00",
  }),
  enrich({
    id: "10",
    businessId: "BIZ-300110",
    businessName: "Bengal Heritage Halls",
    legalBusinessName: "Bengal Heritage Halls Private Limited",
    businessType: "Private Limited",
    ownerId: "10",
    ownerName: "Meera Das",
    ownerEmail: "meera.das@email.com",
    ownerPhone: "+91 98300 11220",
    city: "Chennai",
    state: "Tamil Nadu",
    addressLine1: "Park Street",
    addressLine2: "Near Maidan",
    zipCode: "700016",
    supportEmail: "support@bengalheritagehalls.in",
    supportPhone: "+91 33 4056 7712",
    alternatePhone: "+91 98300 44411",
    website: "https://www.bengalheritagehalls.in",
    businessDescription: "Colonial-era heritage venues for weddings and cultural events in Chennai.",
    yearsInBusiness: 7,
    gstNumber: "19AABCB4321M1Z0",
    panNumber: "AABCB4321M",
    businessRegistrationNumber: "U74999WB2018PTC225591",
    notes: "Longstanding partner with excellent booking record and clean verification history.",
    status: "active",
    verification: "verified",
    publishedVenues: 6,
    pendingVenues: 0,
    inactiveVenues: 0,
    draftVenues: 1,
    createdAt: "2023-12-05T10:00:00",
    updatedAt: "2026-07-29T22:15:00",
  }),
  enrich({
    id: "11",
    businessId: "BIZ-300111",
    businessName: "Kapoor Event Spaces",
    legalBusinessName: "Kapoor Event Spaces",
    businessType: "Proprietorship",
    ownerId: "11",
    ownerName: "Aditya Kapoor",
    ownerEmail: "aditya.kapoor@email.com",
    ownerPhone: "+91 98712 33440",
    city: "Hubballi",
    state: "Hubballi",
    addressLine1: "Sector 17",
    addressLine2: "Near Plaza Market",
    zipCode: "160017",
    supportEmail: "support@kapooreventspaces.com",
    supportPhone: "+91 172 405 6612",
    alternatePhone: "+91 98712 66622",
    website: "https://www.kapooreventspaces.com",
    businessDescription: "Modern banquet halls catering to engagements and corporate events.",
    yearsInBusiness: 1,
    gstNumber: "04AABPK5566N1Z3",
    panNumber: "AABPK5566N",
    businessRegistrationNumber: "UDYAM-CH-02-0011278",
    notes: "Newly registered business awaiting first round of verification.",
    status: "pending",
    verification: "pending",
    publishedVenues: 0,
    pendingVenues: 1,
    inactiveVenues: 0,
    draftVenues: 0,
    createdAt: "2026-07-28T08:00:00",
    updatedAt: "2026-07-28T08:00:00",
  }),
  enrich({
    id: "12",
    businessId: "BIZ-300112",
    businessName: "Goa Beachside Venues",
    legalBusinessName: "Goa Beachside Venues LLP",
    businessType: "LLP",
    ownerId: "12",
    ownerName: "Neha Fernandes",
    ownerEmail: "neha.fernandes@email.com",
    ownerPhone: "+91 98221 55660",
    city: "Visakhapatnam",
    state: "Visakhapatnam",
    addressLine1: "Calangute Beach Road",
    addressLine2: "Near Baga Junction",
    zipCode: "403516",
    supportEmail: "support@goabeachsidevenues.in",
    supportPhone: "+91 832 405 3345",
    alternatePhone: "+91 98221 99911",
    website: "https://www.goabeachsidevenues.in",
    businessDescription: "Beachfront wedding and retreat venues along North Goa.",
    yearsInBusiness: 3,
    gstNumber: "30AAFCG6677P1Z8",
    panNumber: "AAFCG6677P",
    businessRegistrationNumber: "LLPIN-GOA-2022-0018834",
    notes: "Popular destination-wedding partner with high seasonal booking volume.",
    status: "active",
    verification: "verified",
    publishedVenues: 2,
    pendingVenues: 1,
    inactiveVenues: 0,
    draftVenues: 0,
    createdAt: "2025-01-19T11:20:00",
    updatedAt: "2026-07-26T13:45:00",
  }),
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
  }).format(amount);
}

export function getBusinessProfileById(id: string) {
  return mockBusinessProfiles.find((b) => b.id === id || b.businessId === id);
}

export function businessToFormValues(business: BusinessProfile): BusinessProfileFormValues {
  return {
    businessName: business.businessName,
    legalBusinessName: business.legalBusinessName || "",
    businessType: business.businessType || "",
    businessDescription: business.businessDescription || "",
    website: business.website || "",
    yearsInBusiness: String(business.yearsInBusiness ?? ""),
    ownerId: business.ownerId || "",
    ownerName: business.ownerName || "",
    ownerEmail: business.ownerEmail || "",
    ownerPhone: business.ownerPhone || "",
    supportEmail: business.supportEmail || "",
    supportPhone: business.supportPhone || "",
    alternatePhone: business.alternatePhone || "",
    addressLine1: business.addressLine1 || "",
    addressLine2: business.addressLine2 || "",
    city: business.city || "",
    state: business.state || "",
    country: business.country || "India",
    zipCode: business.zipCode || "",
    gstNumber: business.gstNumber || "",
    businessRegistrationNumber: business.businessRegistrationNumber || "",
    panNumber: business.panNumber || "",
    accountHolderName: business.accountHolderName || "",
    bankName: business.bankName || "",
    accountNumber: business.accountNumber || "",
    ifscCode: business.ifscCode || "",
    bankProofFileName: business.bankProofFileName || "",
    bankProofFileSize: business.bankProofFileSize || "",
    bankProofUploadedDate: business.bankProofUploadedDate || "",
    notes: business.notes || "",
    status: business.status,
    verification: business.verification,
  };
}

export const emptyBusinessForm: BusinessProfileFormValues = {
  businessName: "",
  legalBusinessName: "",
  businessType: "",
  businessDescription: "",
  website: "",
  yearsInBusiness: "",
  ownerId: "",
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  supportEmail: "",
  supportPhone: "",
  alternatePhone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "India",
  zipCode: "",
  gstNumber: "",
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
  status: "pending",
  verification: "pending",
};

export function blankBusinessProfile(overrides: Partial<BusinessProfile> = {}): BusinessProfile {
  const businessName = overrides.businessName || "";
  const now = new Date().toISOString();
  return {
    id: "new",
    businessId: "BIZ-NEW",
    businessName,
    legalBusinessName: "",
    businessType: "",
    businessDescription: "",
    website: "",
    yearsInBusiness: 0,
    ownerId: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    supportEmail: "",
    supportPhone: "",
    alternatePhone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "India",
    zipCode: "",
    gstNumber: "",
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
    initials: initialsOf(businessName || "New Business"),
    status: "pending",
    verification: "pending",
    totalVenues: 0,
    publishedVenues: 0,
    pendingVenues: 0,
    inactiveVenues: 0,
    draftVenues: 0,
    createdAt: "",
    updatedAt: "",
    createdBy: "—",
    updatedBy: "—",
    venues: [],
    documents: [],
    ...overrides,
  };
}

export type { BusinessStatus, VerificationStatus };
