/**
 * Property Type Definitions
 * Updated structure for workspace property management
 */

export type WorkspaceType = "Coworking" | "Private Office" | "Meeting Room" | "Virtual Office";
export type PropertyStatus = "draft" | "active" | "inactive";
export type VerificationStatus = "approved" | "pending";
export type YesNo = "yes" | "no";

// Coworking Space Specific Fields
export interface CoworkingSpaceFields {
  totalSeats: number;
  hotDesksCount: number;
  dedicatedDesksCount: number;
  dailyPrice: number;
  weeklyPrice: number;
  monthlyPrice: number;
  minimumBookingDuration: string; // e.g., "1 day", "1 week", "1 month"
}

// Private Office Specific Fields
export interface PrivateOfficeFields {
  officeSizes: string[]; // ["2 seats", "4 seats", "6 seats", "10+ seats"]
  numberOfCabins: number;
  monthlyRent: number;
  securityDeposit: number;
  furnished: YesNo;
  privateAccess: YesNo;
}

// Meeting Room Specific Fields
export interface MeetingRoomFields {
  roomName: string;
  seatingCapacity: number;
  roomLayout: "boardroom" | "classroom" | "u-shape";
  hourlyPrice: number;
  halfDayPrice: number;
  fullDayPrice: number;
  projectorTv: YesNo;
  whiteboard: YesNo;
  videoConferencing: YesNo;
}

// Virtual Office Specific Fields
export interface VirtualOfficeFields {
  businessAddress: string;
  city: string;
  addressProofProvided: YesNo;
  gstRegistrationSupport: YesNo;
  mailHandling: YesNo;
  monthlyPrice: number;
  yearlyPrice: number;
}

// Common Amenities
export interface CommonAmenities {
  wifi: YesNo;
  acNonAc: "ac" | "non-ac";
  powerBackup: YesNo;
  lift: YesNo;
  parking: YesNo;
  securityCctv: YesNo;
  pantryCafeteria: YesNo;
}

// Working Days
export interface WorkingDays {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

// Main Property Interface
export interface Property {
  id: number;
  
  // Section 1: Basic Property Info
  propertyName: string;
  workspaceType: WorkspaceType;
  brandOperatorName: string;
  shortDescription: string;
  detailedDescription: string;
  
  // Section 2: Location Details
  country: string;
  state: string;
  city: string;
  areaLocality: string;
  fullAddress: string;
  pincode: string;
  googleMapLink?: string;
  latitude?: number;
  longitude?: number;
  
  // Section 3: Media Uploads
  coverImage?: string;
  galleryImages: string[];
  floorPlan?: string;
  videoLink?: string;
  
  // Section 4: Availability & Timings
  openingTime: string; // HH:MM format
  closingTime: string; // HH:MM format
  workingDays: WorkingDays;
  available24x7: YesNo;
  
  // Section 5: Contact Details
  contactPersonName: string;
  phoneNumber: string;
  emailId: string;
  
  // Section 6: Legal & Compliance
  gstRegistered: YesNo;
  gstNumber?: string; // Conditional - only if gstRegistered === "yes"
  
  // Section 7: Common Amenities
  amenities: CommonAmenities;
  
  // Section 8: Type-Specific Fields (Dynamic)
  coworkingFields?: CoworkingSpaceFields;
  privateOfficeFields?: PrivateOfficeFields;
  meetingRoomFields?: MeetingRoomFields;
  virtualOfficeFields?: VirtualOfficeFields;
  
  // Section 9: Admin Controls
  propertyStatus: PropertyStatus;
  verificationStatus: VerificationStatus;
  featuredProperty: YesNo;
  priorityRanking: number;
  
  // Section 10: SEO
  seoTitle?: string;
  seoDescription?: string;
  
  // Metadata
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
  slug?: string;
}

// Form Data Interface (for Add/Edit forms)
export interface PropertyFormData {
  // Section 1: Basic Property Info
  propertyName: string;
  workspaceType: WorkspaceType | "";
  brandOperatorName: string;
  shortDescription: string;
  detailedDescription: string;
  
  // Section 2: Location Details
  country: string;
  state: string;
  city: string;
  areaLocality: string;
  fullAddress: string;
  pincode: string;
  googleMapLink: string;
  latitude: string;
  longitude: string;
  
  // Section 3: Media Uploads
  coverImage: File | null;
  galleryImages: File[];
  floorPlan: File | null;
  videoLink: string;
  
  // Section 4: Availability & Timings
  openingTime: string;
  closingTime: string;
  workingDays: WorkingDays;
  available24x7: YesNo;
  
  // Section 5: Contact Details
  contactPersonName: string;
  phoneNumber: string;
  emailId: string;
  
  // Section 6: Legal & Compliance
  gstRegistered: YesNo;
  gstNumber: string;
  
  // Section 7: Common Amenities
  wifi: YesNo;
  acNonAc: "ac" | "non-ac" | "";
  powerBackup: YesNo;
  lift: YesNo;
  parking: YesNo;
  securityCctv: YesNo;
  pantryCafeteria: YesNo;
  
  // Section 8: Type-Specific Fields - Coworking
  totalSeats: string;
  hotDesksCount: string;
  dedicatedDesksCount: string;
  dailyPrice: string;
  weeklyPrice: string;
  monthlyPrice: string;
  minimumBookingDuration: string;
  
  // Section 8: Type-Specific Fields - Private Office
  officeSizes: string[]; // Array of selected sizes
  numberOfCabins: string;
  privateOfficeMonthlyRent: string;
  securityDeposit: string;
  furnished: YesNo;
  privateAccess: YesNo;
  
  // Section 8: Type-Specific Fields - Meeting Room
  roomName: string;
  seatingCapacity: string;
  roomLayout: "boardroom" | "classroom" | "u-shape" | "";
  hourlyPrice: string;
  halfDayPrice: string;
  fullDayPrice: string;
  projectorTv: YesNo;
  whiteboard: YesNo;
  videoConferencing: YesNo;
  
  // Section 8: Type-Specific Fields - Virtual Office
  businessAddress: string;
  virtualOfficeCity: string;
  addressProofProvided: YesNo;
  gstRegistrationSupport: YesNo;
  mailHandling: YesNo;
  virtualOfficeMonthlyPrice: string;
  yearlyPrice: string;
  
  // Section 9: Admin Controls
  propertyStatus: PropertyStatus;
  verificationStatus: VerificationStatus;
  featuredProperty: YesNo;
  priorityRanking: string;
  
  // Section 10: SEO
  seoTitle: string;
  seoDescription: string;
}

// Helper function to generate slug from property name
export function generatePropertySlug(propertyName: string): string {
  return propertyName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper function to get starting price based on workspace type
export function getStartingPrice(property: Property): number {
  switch (property.workspaceType) {
    case "Coworking":
      return property.coworkingFields?.dailyPrice || property.coworkingFields?.monthlyPrice || 0;
    case "Private Office":
      return property.privateOfficeFields?.monthlyRent || 0;
    case "Meeting Room":
      return property.meetingRoomFields?.hourlyPrice || 0;
    case "Virtual Office":
      return property.virtualOfficeFields?.monthlyPrice || 0;
    default:
      return 0;
  }
}
