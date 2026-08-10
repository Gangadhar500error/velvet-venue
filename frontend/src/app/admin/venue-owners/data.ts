import {
  AssignedBusiness,
  RegistrationSource,
  VenueOwner,
  VenueOwnerBooking,
  VenueOwnerFormValues,
  VenueOwnerStatus,
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

const sampleBusinesses: AssignedBusiness[] = [
  {
    id: "b1",
    name: "Orchid Events Pvt Ltd",
    businessType: "Private Limited",
    city: "Hyderabad",
    status: "active",
  },
  {
    id: "b2",
    name: "Orchid Hospitality",
    businessType: "LLP",
    city: "Bengaluru",
    status: "active",
  },
  {
    id: "b3",
    name: "Legacy Draft Spaces",
    businessType: "Proprietorship",
    city: "Hyderabad",
    status: "pending",
  },
];

const sampleBookings: VenueOwnerBooking[] = [
  {
    id: "1",
    bookingId: "BK-20481",
    venue: "The Grand Orchid Banquet",
    customer: "Neha Verma",
    eventType: "Wedding",
    amount: 485000,
    status: "upcoming",
    date: "2026-08-12",
  },
  {
    id: "2",
    bookingId: "BK-20312",
    venue: "Orchid Rooftop Lounge",
    customer: "Amit Joshi",
    eventType: "Corporate",
    amount: 165000,
    status: "completed",
    date: "2026-07-28",
  },
  {
    id: "3",
    bookingId: "BK-20190",
    venue: "The Grand Orchid Banquet",
    customer: "Sonal Kapoor",
    eventType: "Birthday",
    amount: 85000,
    status: "cancelled",
    date: "2026-04-22",
  },
  {
    id: "4",
    bookingId: "BK-20550",
    venue: "Garden Pavilion",
    customer: "Ravi Menon",
    eventType: "Reception",
    amount: 220000,
    status: "upcoming",
    date: "2026-09-05",
  },
];

function fullName(firstName: string, lastName: string) {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

function initialsOf(firstName: string, lastName: string) {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "VO";
}

function enrich(
  base: Partial<VenueOwner> &
    Pick<
      VenueOwner,
      | "id"
      | "ownerId"
      | "firstName"
      | "lastName"
      | "email"
      | "phone"
      | "city"
      | "status"
      | "verification"
      | "source"
      | "registrationDate"
      | "lastLogin"
      | "memberSince"
    >
): VenueOwner {
  const name = base.name || fullName(base.firstName, base.lastName);
  const businesses =
    base.businesses ??
    (base.assignedBusinesses && base.assignedBusinesses > 0
      ? sampleBusinesses.slice(0, Math.min(base.assignedBusinesses, sampleBusinesses.length))
      : []);
  const assignedBusinesses = base.assignedBusinesses ?? businesses.length;
  const totalVenues = base.totalVenues ?? assignedBusinesses * 2;
  const fallbackBusinessName = `${base.lastName} ${base.city} Events`;
  const fallbackBusinessType = "Private Limited";
  const businessName =
    base.businessName || businesses[0]?.name || fallbackBusinessName;
  const businessType =
    base.businessType || businesses[0]?.businessType || fallbackBusinessType;

  // Ensure assigned businesses list always has at least the primary business for display
  const linkedBusinesses =
    businesses.length > 0
      ? businesses.map((b, i) =>
          i === 0
            ? { ...b, name: businessName, businessType }
            : b
        )
      : [
          {
            id: "b1",
            name: businessName,
            businessType,
            city: base.city,
            status: (base.status === "inactive" ? "inactive" : "pending") as AssignedBusiness["status"],
          },
        ];

  return {
    gender: "prefer_not_to_say",
    createdBy: "System",
    createdAt: base.registrationDate,
    updatedBy: "Admin User",
    updatedAt: base.lastLogin,
    recentBookings: sampleBookings,
    ...base,
    name,
    initials: base.initials || initialsOf(base.firstName, base.lastName),
    businesses: linkedBusinesses,
    assignedBusinesses: Math.max(assignedBusinesses, linkedBusinesses.length),
    totalVenues: Math.max(totalVenues, linkedBusinesses.length),
    businessName,
    businessType,
    alternateMobile:
      base.alternateMobile || `+91 98${String(10000000 + Number(base.id) * 1111).slice(0, 8)}`,
    addressLine1: base.addressLine1 || `12, ${base.city} Residency`,
    addressLine2: base.addressLine2 || "Near City Center",
    state: base.state || "Maharashtra",
    zipCode: base.zipCode || "400001",
    country: base.country || "India",
  };
}

export const mockVenueOwners: VenueOwner[] = [
  enrich({
    id: "1",
    ownerId: "OWN-100124",
    firstName: "Rahul",
    lastName: "Sharma",
    email: "rahul.sharma@email.com",
    phone: "+91 98765 43210",
    city: "Hyderabad",
    gender: "male",
    businessName: "Orchid Events Pvt Ltd",
    businessType: "Private Limited",
    addressLine1: "14, Linking Road",
    addressLine2: "Bandra West",
    state: "Telangana",
    zipCode: "400050",
    status: "active",
    verification: "verified",
    source: "website",
    assignedBusinesses: 3,
    totalVenues: 6,
    registrationDate: "2024-01-12",
    lastLogin: "2026-07-30T09:24:00",
    memberSince: "Jan 2024",
  }),
  enrich({
    id: "2",
    ownerId: "OWN-100125",
    firstName: "Priya",
    lastName: "Patel",
    email: "priya.patel@email.com",
    phone: "+91 98201 55678",
    city: "Karimnagar",
    gender: "female",
    businessName: "Patel Celebrations",
    businessType: "Proprietorship",
    addressLine1: "22, CG Road",
    state: "Telangana",
    zipCode: "380009",
    status: "active",
    verification: "verified",
    source: "admin",
    assignedBusinesses: 2,
    totalVenues: 4,
    registrationDate: "2024-03-04",
    lastLogin: "2026-07-29T18:10:00",
    memberSince: "Mar 2024",
  }),
  enrich({
    id: "3",
    ownerId: "OWN-100126",
    firstName: "Arjun",
    lastName: "Reddy",
    email: "arjun.reddy@email.com",
    phone: "+91 99860 11223",
    city: "Hyderabad",
    gender: "male",
    businessName: "Reddy Convention Spaces",
    businessType: "Partnership",
    addressLine1: "Plot 8, Jubilee Hills",
    state: "Telangana",
    zipCode: "500033",
    status: "pending",
    verification: "pending",
    source: "referral",
    assignedBusinesses: 1,
    totalVenues: 1,
    registrationDate: "2026-07-02",
    lastLogin: "2026-07-28T11:05:00",
    memberSince: "Jul 2026",
    businesses: [
      {
        id: "b1",
        name: "Reddy Convention Spaces",
        businessType: "Partnership",
        city: "Hyderabad",
        status: "pending",
      },
    ],
  }),
  enrich({
    id: "4",
    ownerId: "OWN-100127",
    firstName: "Ananya",
    lastName: "Iyer",
    email: "ananya.iyer@email.com",
    phone: "+91 94440 77889",
    city: "Chennai",
    gender: "female",
    businessName: "Tamil Heritage Venues",
    businessType: "Private Limited",
    addressLine1: "7, T Nagar Main Road",
    state: "Tamil Nadu",
    zipCode: "600017",
    status: "active",
    verification: "verified",
    source: "website",
    assignedBusinesses: 4,
    totalVenues: 8,
    registrationDate: "2023-11-18",
    lastLogin: "2026-07-30T07:40:00",
    memberSince: "Nov 2023",
  }),
  enrich({
    id: "5",
    ownerId: "OWN-100128",
    firstName: "Vikram",
    lastName: "Singh",
    email: "vikram.singh@email.com",
    phone: "+91 98111 33445",
    city: "Hyderabad",
    gender: "male",
    businessName: "Singh Palace Events",
    businessType: "Proprietorship",
    addressLine1: "B-12, Connaught Place",
    state: "Hyderabad",
    zipCode: "110001",
    status: "inactive",
    verification: "rejected",
    source: "website",
    assignedBusinesses: 1,
    totalVenues: 1,
    registrationDate: "2025-09-09",
    lastLogin: "2026-05-12T14:20:00",
    memberSince: "Sep 2025",
    businesses: [
      {
        id: "b1",
        name: "Singh Palace Events",
        businessType: "Proprietorship",
        city: "Hyderabad",
        status: "inactive",
      },
    ],
  }),
  enrich({
    id: "6",
    ownerId: "OWN-100129",
    firstName: "Sneha",
    lastName: "Nair",
    email: "sneha.nair@email.com",
    phone: "+91 98470 22334",
    city: "Madurai",
    gender: "female",
    businessName: "Coastal Celebrations LLP",
    businessType: "LLP",
    addressLine1: "Marine Drive",
    state: "Tamil Nadu",
    zipCode: "682031",
    status: "active",
    verification: "verified",
    source: "referral",
    assignedBusinesses: 2,
    totalVenues: 3,
    registrationDate: "2024-06-22",
    lastLogin: "2026-07-27T16:55:00",
    memberSince: "Jun 2024",
  }),
  enrich({
    id: "7",
    ownerId: "OWN-100130",
    firstName: "Rohan",
    lastName: "Mehta",
    email: "rohan.mehta@email.com",
    phone: "+91 98920 66778",
    city: "Bengaluru",
    gender: "male",
    businessName: "Mehta Event Solutions",
    businessType: "Private Limited",
    addressLine1: "Baner Road",
    state: "Telangana",
    zipCode: "411045",
    status: "inactive",
    verification: "verified",
    source: "admin",
    assignedBusinesses: 1,
    totalVenues: 2,
    registrationDate: "2024-08-14",
    lastLogin: "2026-03-01T10:12:00",
    memberSince: "Aug 2024",
  }),
  enrich({
    id: "8",
    ownerId: "OWN-100131",
    firstName: "Kavya",
    lastName: "Rao",
    email: "kavya.rao@email.com",
    phone: "+91 99001 44556",
    city: "Bengaluru",
    gender: "female",
    businessName: "Garden Grove Venues",
    businessType: "Private Limited",
    addressLine1: "12th Main, Indiranagar",
    state: "Karnataka",
    zipCode: "560038",
    status: "active",
    verification: "verified",
    source: "website",
    assignedBusinesses: 2,
    totalVenues: 5,
    registrationDate: "2024-02-28",
    lastLogin: "2026-07-30T12:01:00",
    memberSince: "Feb 2024",
  }),
  enrich({
    id: "9",
    ownerId: "OWN-100132",
    firstName: "Aman",
    lastName: "Gupta",
    email: "aman.gupta@email.com",
    phone: "+91 98180 99887",
    city: "Warangal",
    gender: "male",
    businessName: "Royal Rajasthan Banquets",
    businessType: "Partnership",
    addressLine1: "C-Scheme",
    state: "Telangana",
    zipCode: "302001",
    status: "active",
    verification: "pending",
    source: "referral",
    assignedBusinesses: 1,
    totalVenues: 2,
    registrationDate: "2026-06-11",
    lastLogin: "2026-07-25T20:30:00",
    memberSince: "Jun 2026",
  }),
  enrich({
    id: "10",
    ownerId: "OWN-100133",
    firstName: "Meera",
    lastName: "Das",
    email: "meera.das@email.com",
    phone: "+91 98300 11220",
    city: "Chennai",
    gender: "female",
    businessName: "Bengal Heritage Halls",
    businessType: "Private Limited",
    addressLine1: "Park Street",
    state: "Tamil Nadu",
    zipCode: "700016",
    status: "active",
    verification: "verified",
    source: "admin",
    assignedBusinesses: 3,
    totalVenues: 7,
    registrationDate: "2023-12-05",
    lastLogin: "2026-07-29T22:15:00",
    memberSince: "Dec 2023",
  }),
  enrich({
    id: "11",
    ownerId: "OWN-100134",
    firstName: "Aditya",
    lastName: "Kapoor",
    email: "aditya.kapoor@email.com",
    phone: "+91 98712 33440",
    city: "Hubballi",
    gender: "male",
    businessName: "Kapoor Event Spaces",
    businessType: "Proprietorship",
    addressLine1: "Sector 17",
    state: "Hubballi",
    zipCode: "160017",
    status: "pending",
    verification: "pending",
    source: "website",
    assignedBusinesses: 1,
    totalVenues: 1,
    registrationDate: "2026-07-28",
    lastLogin: "2026-07-28T08:00:00",
    memberSince: "Jul 2026",
    businesses: [
      {
        id: "b1",
        name: "Kapoor Event Spaces",
        businessType: "Proprietorship",
        city: "Hubballi",
        status: "pending",
      },
    ],
    recentBookings: [
      {
        id: "1",
        bookingId: "BK-20901",
        venue: "Kapoor Banquet Hall",
        customer: "Pooja Malhotra",
        eventType: "Engagement",
        amount: 95000,
        status: "pending",
        date: "2026-08-20",
      },
    ],
  }),
  enrich({
    id: "12",
    ownerId: "OWN-100135",
    firstName: "Neha",
    lastName: "Fernandes",
    email: "neha.fernandes@email.com",
    phone: "+91 98221 55660",
    city: "Visakhapatnam",
    gender: "female",
    businessName: "Goa Beachside Venues",
    businessType: "LLP",
    addressLine1: "Calangute Beach Road",
    state: "Visakhapatnam",
    zipCode: "403516",
    status: "active",
    verification: "verified",
    source: "referral",
    assignedBusinesses: 2,
    totalVenues: 3,
    registrationDate: "2025-01-19",
    lastLogin: "2026-07-26T13:45:00",
    memberSince: "Jan 2025",
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

export function getVenueOwnerById(id: string) {
  return mockVenueOwners.find((o) => o.id === id || o.ownerId === id);
}

export function venueOwnerToFormValues(owner: VenueOwner): VenueOwnerFormValues {
  return {
    firstName: owner.firstName,
    lastName: owner.lastName,
    email: owner.email,
    phone: owner.phone,
    alternateMobile: owner.alternateMobile || "",
    gender: owner.gender || "",
    businessName: owner.businessName || "",
    businessType: owner.businessType || "",
    status: owner.status,
    verification: owner.verification,
    source: owner.source,
    city: owner.city,
    country: owner.country,
    addressLine1: owner.addressLine1 || "",
    addressLine2: owner.addressLine2 || "",
    state: owner.state || "",
    zipCode: owner.zipCode || "",
  };
}

export const emptyVenueOwnerForm: VenueOwnerFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  alternateMobile: "",
  gender: "",
  businessName: "",
  businessType: "",
  status: "pending",
  verification: "pending",
  source: "admin",
  city: "",
  country: "India",
  addressLine1: "",
  addressLine2: "",
  state: "",
  zipCode: "",
};

export function blankVenueOwner(overrides: Partial<VenueOwner> = {}): VenueOwner {
  const firstName = overrides.firstName || "";
  const lastName = overrides.lastName || "";
  const now = new Date().toISOString();
  return {
    id: "new",
    ownerId: "OWN-NEW",
    firstName,
    lastName,
    name: overrides.name || fullName(firstName, lastName),
    email: "",
    phone: "",
    alternateMobile: "",
    gender: undefined,
    businessName: "",
    businessType: "",
    city: "",
    country: "India",
    addressLine1: "",
    addressLine2: "",
    state: "",
    zipCode: "",
    initials: initialsOf(firstName || "N", lastName || "O"),
    status: "pending",
    verification: "pending",
    source: "admin",
    assignedBusinesses: 0,
    totalVenues: 0,
    registrationDate: now.slice(0, 10),
    lastLogin: "",
    memberSince: "—",
    createdBy: "—",
    createdAt: "",
    updatedBy: "—",
    updatedAt: "",
    businesses: [],
    recentBookings: [],
    ...overrides,
  };
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export type { VenueOwnerStatus, VerificationStatus, RegistrationSource };
