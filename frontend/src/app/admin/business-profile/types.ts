export type BusinessStatus = "active" | "inactive" | "pending";
export type VerificationStatus = "verified" | "pending" | "rejected";
export type BusinessType =
  | "Private Limited"
  | "Proprietorship"
  | "Partnership"
  | "LLP"
  | "";
export type DocumentStatus =
  | "uploaded"
  | "pending"
  | "verified"
  | "rejected"
  | "suspended";
export type VenueListingStatus = "published" | "draft" | "pending" | "inactive";

export interface BusinessVenue {
  id: string;
  venueId: string;
  name: string;
  category: string;
  capacity: number;
  city: string;
  status: VenueListingStatus;
  rating: number;
  bookings: number;
}

export interface BusinessDocument {
  id: string;
  name: string;
  status: DocumentStatus;
  uploadedDate: string;
  verifiedBy: string;
  fileName?: string;
  fileSize?: string;
  /** Public or blob URL used for View / Download */
  fileUrl?: string;
}

export interface BusinessBankAccount {
  /** Client temp id or server UUID */
  id: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  bankProofFileName: string;
  bankProofFileSize: string;
  bankProofUploadedDate: string;
  /** Public or blob URL for bank proof View / Download */
  bankProofFileUrl?: string;
  isPrimary: boolean;
}

export interface BusinessProfile {
  id: string;
  businessId: string;
  businessName: string;
  legalBusinessName: string;
  businessType: string;
  businessDescription: string;
  website: string;
  yearsInBusiness: number;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  supportEmail: string;
  supportPhone: string;
  alternatePhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  gstNumber: string;
  businessRegistrationNumber: string;
  panNumber: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  bankProofFileName: string;
  bankProofFileSize: string;
  bankProofUploadedDate: string;
  bankProofFileUrl?: string;
  bankAccounts: BusinessBankAccount[];
  notes: string;
  initials: string;
  status: BusinessStatus;
  verification: VerificationStatus;
  totalVenues: number;
  publishedVenues: number;
  pendingVenues: number;
  inactiveVenues: number;
  draftVenues: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  venues: BusinessVenue[];
  documents: BusinessDocument[];
}

export interface BusinessProfileFilters {
  search: string;
  status: string;
  verification: string;
  businessType: string;
  city: string;
  owner: string;
  dateFrom: string;
  dateTo: string;
}

export type TableDensity = "comfortable" | "compact";

export type BusinessColumnKey =
  | "profile"
  | "businessId"
  | "owner"
  | "businessType"
  | "city"
  | "venues"
  | "verification"
  | "status"
  | "createdAt"
  | "actions";

export interface BusinessProfileFormValues {
  businessName: string;
  legalBusinessName: string;
  businessType: string;
  businessDescription: string;
  website: string;
  yearsInBusiness: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  supportEmail: string;
  supportPhone: string;
  alternatePhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  gstNumber: string;
  businessRegistrationNumber: string;
  panNumber: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  bankProofFileName: string;
  bankProofFileSize: string;
  bankProofUploadedDate: string;
  bankAccounts: BusinessBankAccount[];
  notes: string;
  status: BusinessStatus;
  verification: VerificationStatus;
}
