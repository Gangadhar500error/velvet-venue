/**
 * Property Service Layer
 * 
 * This abstraction layer allows easy switching between mock data (JSON) and API calls.
 * 
 * Usage:
 * - Development: Uses JSON files (set NEXT_PUBLIC_USE_MOCK_DATA=true)
 * - Production: Uses API calls (set NEXT_PUBLIC_USE_MOCK_DATA=false)
 * 
 * Backend developers only need to implement the API functions below.
 */

import { Property, PropertyFormData } from "@/types/property";
import { 
  mockProperties, 
  getPropertyById as getMockPropertyById,
  filterProperties as filterMockProperties,
  filterByWorkspaceType,
  filterByStatus,
  filterByVerificationStatus
} from "@/data/properties";
import { apiRequest } from "@/lib/api";

// Check if we should use mock data (for development)
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

// ============================================================================
// API Response Types (for backend integration)
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links?: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

export interface PropertyListParams {
  workspaceType?: Property["workspaceType"];
  propertyStatus?: Property["propertyStatus"];
  verificationStatus?: Property["verificationStatus"];
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// API Functions (Backend Implementation Required)
// ============================================================================

/**
 * Fetch all properties from API
 * Backend endpoint: GET /api/admin/properties
 */
async function fetchPropertiesFromAPI(params?: PropertyListParams): Promise<Property[]> {
  try {
    const response = await apiRequest<PaginatedResponse<Property>>("/admin/properties", {
      params: {
        workspaceType: params?.workspaceType || undefined,
        propertyStatus: params?.propertyStatus || undefined,
        verificationStatus: params?.verificationStatus || undefined,
        search: params?.search || undefined,
        page: params?.page || 1,
        limit: params?.limit || 100,
      },
    });

    return response.data || [];
  } catch (error) {
    console.error("Error fetching properties from API:", error);
    throw error;
  }
}

/**
 * Fetch single property by ID from API
 * Backend endpoint: GET /api/admin/properties/{id}
 */
async function fetchPropertyByIdFromAPI(id: number): Promise<Property | null> {
  try {
    const response = await apiRequest<ApiResponse<Property>>(`/admin/properties/${id}`);
    return response.data || null;
  } catch (error) {
    console.error(`Error fetching property ${id} from API:`, error);
    throw error;
  }
}

/**
 * Create new property via API
 * Backend endpoint: POST /api/admin/properties
 */
async function createPropertyViaAPI(formData: PropertyFormData): Promise<Property> {
  try {
    // Handle file uploads separately if needed
    const { coverImage, galleryImages, floorPlan, ...jsonData } = formData;

    // First, create the property (without images)
    const response = await apiRequest<ApiResponse<Property>>("/admin/properties", {
      method: "POST",
      body: JSON.stringify(jsonData),
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to create property");
    }

    const property = response.data;

    // Then upload images if provided
    if (coverImage instanceof File) {
      await uploadCoverImage(property.id, coverImage);
    }

    if (galleryImages && galleryImages.length > 0) {
      const imageFiles = galleryImages.filter((img): img is File => img instanceof File);
      if (imageFiles.length > 0) {
        await uploadGalleryImages(property.id, imageFiles);
      }
    }

    if (floorPlan instanceof File) {
      await uploadFloorPlan(property.id, floorPlan);
    }

    // Fetch updated property with image URLs
    return await fetchPropertyByIdFromAPI(property.id) || property;
  } catch (error) {
    console.error("Error creating property via API:", error);
    throw error;
  }
}

/**
 * Update existing property via API
 * Backend endpoint: PUT /api/admin/properties/{id}
 */
async function updatePropertyViaAPI(id: number, formData: PropertyFormData): Promise<Property> {
  try {
    const { coverImage, galleryImages, floorPlan, ...jsonData } = formData;

    // Update property data
    const response = await apiRequest<ApiResponse<Property>>(`/admin/properties/${id}`, {
      method: "PUT",
      body: JSON.stringify(jsonData),
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to update property");
    }

    const property = response.data;

    // Update images if provided
    if (coverImage instanceof File) {
      await uploadCoverImage(id, coverImage);
    }

    if (galleryImages && galleryImages.length > 0) {
      const imageFiles = galleryImages.filter((img): img is File => img instanceof File);
      if (imageFiles.length > 0) {
        await uploadGalleryImages(id, imageFiles);
      }
    }

    if (floorPlan instanceof File) {
      await uploadFloorPlan(id, floorPlan);
    }

    return await fetchPropertyByIdFromAPI(id) || property;
  } catch (error) {
    console.error(`Error updating property ${id} via API:`, error);
    throw error;
  }
}

/**
 * Delete property via API
 * Backend endpoint: DELETE /api/admin/properties/{id}
 */
async function deletePropertyViaAPI(id: number): Promise<void> {
  try {
    await apiRequest<ApiResponse<void>>(`/admin/properties/${id}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error(`Error deleting property ${id} via API:`, error);
    throw error;
  }
}

/**
 * Update property status via API
 * Backend endpoint: PATCH /api/admin/properties/{id}/status
 */
async function updatePropertyStatusViaAPI(
  id: number,
  status: Property["propertyStatus"]
): Promise<Property> {
  try {
    const response = await apiRequest<ApiResponse<Property>>(`/admin/properties/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ propertyStatus: status }),
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to update status");
    }

    return response.data;
  } catch (error) {
    console.error(`Error updating property status ${id} via API:`, error);
    throw error;
  }
}

/**
 * Update verification status via API
 * Backend endpoint: PATCH /api/admin/properties/{id}/verification
 */
async function updateVerificationStatusViaAPI(
  id: number,
  verificationStatus: Property["verificationStatus"]
): Promise<Property> {
  try {
    const response = await apiRequest<ApiResponse<Property>>(
      `/admin/properties/${id}/verification`,
      {
        method: "PATCH",
        body: JSON.stringify({ verificationStatus }),
      }
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to update verification status");
    }

    return response.data;
  } catch (error) {
    console.error(`Error updating verification status ${id} via API:`, error);
    throw error;
  }
}

/**
 * Upload cover image
 * Backend endpoint: POST /api/admin/properties/{id}/cover-image
 */
async function uploadCoverImage(id: number, file: File): Promise<string> {
  const formData = new FormData();
  formData.append("coverImage", file);

  const response = await apiRequest<ApiResponse<{ url: string }>>(
    `/admin/properties/${id}/cover-image`,
    {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    }
  );

  return response.data?.url || "";
}

/**
 * Upload gallery images
 * Backend endpoint: POST /api/admin/properties/{id}/gallery
 */
async function uploadGalleryImages(id: number, files: File[]): Promise<string[]> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("galleryImages", file);
  });

  const response = await apiRequest<ApiResponse<{ urls: string[] }>>(
    `/admin/properties/${id}/gallery`,
    {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    }
  );

  return response.data?.urls || [];
}

/**
 * Upload floor plan
 * Backend endpoint: POST /api/admin/properties/{id}/floor-plan
 */
async function uploadFloorPlan(id: number, file: File): Promise<string> {
  const formData = new FormData();
  formData.append("floorPlan", file);

  const response = await apiRequest<ApiResponse<{ url: string }>>(
    `/admin/properties/${id}/floor-plan`,
    {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    }
  );

  return response.data?.url || "";
}

// ============================================================================
// Mock Data Functions (Development)
// ============================================================================

function createPropertyMock(formData: PropertyFormData): Property {
  // Generate new ID
  const newId = Math.max(...mockProperties.map((p) => p.id)) + 1;

  // Convert form data to Property
  const newProperty: Property = {
    id: newId,
    propertyName: formData.propertyName,
    workspaceType: formData.workspaceType || "Coworking",
    brandOperatorName: formData.brandOperatorName || "",
    shortDescription: formData.shortDescription || "",
    detailedDescription: formData.detailedDescription || "",
    country: formData.country,
    state: formData.state,
    city: formData.city,
    areaLocality: formData.areaLocality,
    fullAddress: formData.fullAddress,
    pincode: formData.pincode || "",
    googleMapLink: formData.googleMapLink || "",
    latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
    longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
    coverImage: formData.coverImage instanceof File 
      ? URL.createObjectURL(formData.coverImage) 
      : formData.coverImage || "",
    galleryImages: formData.galleryImages?.map((img) =>
      img instanceof File ? URL.createObjectURL(img) : img
    ) || [],
    floorPlan: formData.floorPlan instanceof File
      ? URL.createObjectURL(formData.floorPlan)
      : formData.floorPlan || "",
    videoLink: formData.videoLink || "",
    openingTime: formData.openingTime || "",
    closingTime: formData.closingTime || "",
    workingDays: formData.workingDays || {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    },
    available24x7: formData.available24x7 || "no",
    contactPersonName: formData.contactPersonName,
    phoneNumber: formData.phoneNumber,
    emailId: formData.emailId,
    gstRegistered: formData.gstRegistered || "no",
    gstNumber: formData.gstNumber || "",
    amenities: {
      wifi: formData.wifi || "no",
      acNonAc: (formData.acNonAc || "non-ac") as "ac" | "non-ac",
      powerBackup: formData.powerBackup || "no",
      lift: formData.lift || "no",
      parking: formData.parking || "no",
      securityCctv: formData.securityCctv || "no",
      pantryCafeteria: formData.pantryCafeteria || "no",
    },
    coworkingFields: formData.workspaceType === "Coworking" ? {
      totalSeats: parseInt(formData.totalSeats) || 0,
      hotDesksCount: parseInt(formData.hotDesksCount) || 0,
      dedicatedDesksCount: parseInt(formData.dedicatedDesksCount) || 0,
      dailyPrice: parseFloat(formData.dailyPrice) || 0,
      weeklyPrice: parseFloat(formData.weeklyPrice) || 0,
      monthlyPrice: parseFloat(formData.monthlyPrice) || 0,
      minimumBookingDuration: formData.minimumBookingDuration || "",
    } : undefined,
    privateOfficeFields: formData.workspaceType === "Private Office" ? {
      officeSizes: formData.officeSizes || [],
      numberOfCabins: parseInt(formData.numberOfCabins) || 0,
      monthlyRent: parseFloat(formData.privateOfficeMonthlyRent) || 0,
      securityDeposit: parseFloat(formData.securityDeposit) || 0,
      furnished: formData.furnished || "no",
      privateAccess: formData.privateAccess || "no",
    } : undefined,
    meetingRoomFields: formData.workspaceType === "Meeting Room" ? {
      roomName: formData.roomName || "",
      seatingCapacity: parseInt(formData.seatingCapacity) || 0,
      roomLayout: (formData.roomLayout || "boardroom") as "boardroom" | "classroom" | "u-shape",
      hourlyPrice: parseFloat(formData.hourlyPrice) || 0,
      halfDayPrice: parseFloat(formData.halfDayPrice) || 0,
      fullDayPrice: parseFloat(formData.fullDayPrice) || 0,
      projectorTv: formData.projectorTv || "no",
      whiteboard: formData.whiteboard || "no",
      videoConferencing: formData.videoConferencing || "no",
    } : undefined,
    virtualOfficeFields: formData.workspaceType === "Virtual Office" ? {
      businessAddress: formData.businessAddress || "",
      city: formData.virtualOfficeCity || "",
      addressProofProvided: formData.addressProofProvided || "no",
      gstRegistrationSupport: formData.gstRegistrationSupport || "no",
      mailHandling: formData.mailHandling || "no",
      monthlyPrice: parseFloat(formData.virtualOfficeMonthlyPrice) || 0,
      yearlyPrice: parseFloat(formData.yearlyPrice) || 0,
    } : undefined,
    propertyStatus: formData.propertyStatus || "draft",
    verificationStatus: formData.verificationStatus,
    featuredProperty: formData.featuredProperty || "no",
    priorityRanking: parseInt(formData.priorityRanking) || 0,
    seoTitle: formData.seoTitle || "",
    seoDescription: formData.seoDescription || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    slug: formData.propertyName.toLowerCase().replace(/\s+/g, "-"),
  };

  // In real implementation, this would update the JSON file or state
  // For now, just return the property
  console.log("Mock: Creating property", newProperty);
  return newProperty;
}

function updatePropertyMock(id: number, formData: PropertyFormData): Property {
  const existing = getMockPropertyById(id);
  if (!existing) {
    throw new Error(`Property ${id} not found`);
  }

  // Similar to createPropertyMock but merge with existing
  const updatedProperty: Property = {
    ...existing,
    propertyName: formData.propertyName,
    workspaceType: formData.workspaceType || existing.workspaceType,
    brandOperatorName: formData.brandOperatorName || "",
    shortDescription: formData.shortDescription || "",
    detailedDescription: formData.detailedDescription || "",
    country: formData.country,
    state: formData.state,
    city: formData.city,
    areaLocality: formData.areaLocality,
    fullAddress: formData.fullAddress,
    pincode: formData.pincode || "",
    googleMapLink: formData.googleMapLink || "",
    latitude: formData.latitude ? parseFloat(formData.latitude) : existing.latitude,
    longitude: formData.longitude ? parseFloat(formData.longitude) : existing.longitude,
    coverImage: formData.coverImage instanceof File
      ? URL.createObjectURL(formData.coverImage)
      : formData.coverImage || existing.coverImage,
    galleryImages: formData.galleryImages?.map((img) =>
      img instanceof File ? URL.createObjectURL(img) : img
    ) || existing.galleryImages,
    floorPlan: formData.floorPlan instanceof File
      ? URL.createObjectURL(formData.floorPlan)
      : formData.floorPlan || existing.floorPlan,
    videoLink: formData.videoLink || "",
    openingTime: formData.openingTime || "",
    closingTime: formData.closingTime || "",
    workingDays: formData.workingDays || existing.workingDays,
    available24x7: formData.available24x7 || "no",
    contactPersonName: formData.contactPersonName,
    phoneNumber: formData.phoneNumber,
    emailId: formData.emailId,
    gstRegistered: formData.gstRegistered || "no",
    gstNumber: formData.gstNumber || "",
    amenities: {
      wifi: formData.wifi || existing.amenities.wifi,
      acNonAc: (formData.acNonAc || existing.amenities.acNonAc) as "ac" | "non-ac",
      powerBackup: formData.powerBackup || existing.amenities.powerBackup,
      lift: formData.lift || existing.amenities.lift,
      parking: formData.parking || existing.amenities.parking,
      securityCctv: formData.securityCctv || existing.amenities.securityCctv,
      pantryCafeteria: formData.pantryCafeteria || existing.amenities.pantryCafeteria,
    },
    coworkingFields: formData.workspaceType === "Coworking" ? {
      totalSeats: parseInt(formData.totalSeats) || existing.coworkingFields?.totalSeats || 0,
      hotDesksCount: parseInt(formData.hotDesksCount) || existing.coworkingFields?.hotDesksCount || 0,
      dedicatedDesksCount: parseInt(formData.dedicatedDesksCount) || existing.coworkingFields?.dedicatedDesksCount || 0,
      dailyPrice: parseFloat(formData.dailyPrice) || existing.coworkingFields?.dailyPrice || 0,
      weeklyPrice: parseFloat(formData.weeklyPrice) || existing.coworkingFields?.weeklyPrice || 0,
      monthlyPrice: parseFloat(formData.monthlyPrice) || existing.coworkingFields?.monthlyPrice || 0,
      minimumBookingDuration: formData.minimumBookingDuration || existing.coworkingFields?.minimumBookingDuration || "",
    } : existing.coworkingFields,
    privateOfficeFields: formData.workspaceType === "Private Office" ? {
      officeSizes: formData.officeSizes || existing.privateOfficeFields?.officeSizes || [],
      numberOfCabins: parseInt(formData.numberOfCabins) || existing.privateOfficeFields?.numberOfCabins || 0,
      monthlyRent: parseFloat(formData.privateOfficeMonthlyRent) || existing.privateOfficeFields?.monthlyRent || 0,
      securityDeposit: parseFloat(formData.securityDeposit) || existing.privateOfficeFields?.securityDeposit || 0,
      furnished: formData.furnished || existing.privateOfficeFields?.furnished || "no",
      privateAccess: formData.privateAccess || existing.privateOfficeFields?.privateAccess || "no",
    } : existing.privateOfficeFields,
    meetingRoomFields: formData.workspaceType === "Meeting Room" ? {
      roomName: formData.roomName || existing.meetingRoomFields?.roomName || "",
      seatingCapacity: parseInt(formData.seatingCapacity) || existing.meetingRoomFields?.seatingCapacity || 0,
      roomLayout: (formData.roomLayout || existing.meetingRoomFields?.roomLayout || "boardroom") as "boardroom" | "classroom" | "u-shape",
      hourlyPrice: parseFloat(formData.hourlyPrice) || existing.meetingRoomFields?.hourlyPrice || 0,
      halfDayPrice: parseFloat(formData.halfDayPrice) || existing.meetingRoomFields?.halfDayPrice || 0,
      fullDayPrice: parseFloat(formData.fullDayPrice) || existing.meetingRoomFields?.fullDayPrice || 0,
      projectorTv: formData.projectorTv || existing.meetingRoomFields?.projectorTv || "no",
      whiteboard: formData.whiteboard || existing.meetingRoomFields?.whiteboard || "no",
      videoConferencing: formData.videoConferencing || existing.meetingRoomFields?.videoConferencing || "no",
    } : existing.meetingRoomFields,
    virtualOfficeFields: formData.workspaceType === "Virtual Office" ? {
      businessAddress: formData.businessAddress || existing.virtualOfficeFields?.businessAddress || "",
      city: formData.virtualOfficeCity || existing.virtualOfficeFields?.city || "",
      addressProofProvided: formData.addressProofProvided || existing.virtualOfficeFields?.addressProofProvided || "no",
      gstRegistrationSupport: formData.gstRegistrationSupport || existing.virtualOfficeFields?.gstRegistrationSupport || "no",
      mailHandling: formData.mailHandling || existing.virtualOfficeFields?.mailHandling || "no",
      monthlyPrice: parseFloat(formData.virtualOfficeMonthlyPrice) || existing.virtualOfficeFields?.monthlyPrice || 0,
      yearlyPrice: parseFloat(formData.yearlyPrice) || existing.virtualOfficeFields?.yearlyPrice || 0,
    } : existing.virtualOfficeFields,
    propertyStatus: formData.propertyStatus || existing.propertyStatus,
    verificationStatus: formData.verificationStatus || existing.verificationStatus,
    featuredProperty: formData.featuredProperty || existing.featuredProperty,
    priorityRanking: parseInt(formData.priorityRanking) || existing.priorityRanking,
    seoTitle: formData.seoTitle || existing.seoTitle || "",
    seoDescription: formData.seoDescription || existing.seoDescription || "",
    updatedAt: new Date().toISOString(),
  };

  console.log("Mock: Updating property", updatedProperty);
  return updatedProperty;
}

function deletePropertyMock(id: number): void {
  console.log("Mock: Deleting property", id);
  // In real implementation, this would remove from JSON or state
}

function updatePropertyStatusMock(
  id: number,
  status: Property["propertyStatus"]
): Property {
  const property = getMockPropertyById(id);
  if (!property) {
    throw new Error(`Property ${id} not found`);
  }

  return {
    ...property,
    propertyStatus: status,
    updatedAt: new Date().toISOString(),
  };
}

function updateVerificationStatusMock(
  id: number,
  verificationStatus: Property["verificationStatus"]
): Property {
  const property = getMockPropertyById(id);
  if (!property) {
    throw new Error(`Property ${id} not found`);
  }

  return {
    ...property,
    verificationStatus,
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// Public Service Functions (Used by Components)
// ============================================================================

/**
 * Get all properties (with optional filtering)
 */
export async function getProperties(params?: PropertyListParams): Promise<Property[]> {
  if (USE_MOCK_DATA) {
    let properties = [...mockProperties];

    // Apply filters
    if (params?.workspaceType) {
      properties = filterByWorkspaceType(properties, params.workspaceType);
    }
    if (params?.propertyStatus) {
      properties = filterByStatus(properties, params.propertyStatus);
    }
    if (params?.verificationStatus) {
      properties = filterByVerificationStatus(properties, params.verificationStatus);
    }
    if (params?.search) {
      properties = filterMockProperties(properties, params.search);
    }

    return properties;
  }

  return await fetchPropertiesFromAPI(params);
}

/**
 * Get single property by ID
 */
export async function getPropertyById(id: number): Promise<Property | null> {
  if (USE_MOCK_DATA) {
    return getMockPropertyById(id) || null;
  }

  return await fetchPropertyByIdFromAPI(id);
}

/**
 * Create new property
 */
export async function createProperty(formData: PropertyFormData): Promise<Property> {
  if (USE_MOCK_DATA) {
    return createPropertyMock(formData);
  }

  return await createPropertyViaAPI(formData);
}

/**
 * Update existing property
 */
export async function updateProperty(
  id: number,
  formData: PropertyFormData
): Promise<Property> {
  if (USE_MOCK_DATA) {
    return updatePropertyMock(id, formData);
  }

  return await updatePropertyViaAPI(id, formData);
}

/**
 * Delete property
 */
export async function deleteProperty(id: number): Promise<void> {
  if (USE_MOCK_DATA) {
    deletePropertyMock(id);
    return;
  }

  return await deletePropertyViaAPI(id);
}

/**
 * Update property status (active/inactive)
 */
export async function updatePropertyStatus(
  id: number,
  status: Property["propertyStatus"]
): Promise<Property> {
  if (USE_MOCK_DATA) {
    return updatePropertyStatusMock(id, status);
  }

  return await updatePropertyStatusViaAPI(id, status);
}

/**
 * Update verification status (approved/pending)
 */
export async function updateVerificationStatus(
  id: number,
  verificationStatus: Property["verificationStatus"]
): Promise<Property> {
  if (USE_MOCK_DATA) {
    return updateVerificationStatusMock(id, verificationStatus);
  }

  return await updateVerificationStatusViaAPI(id, verificationStatus);
}

