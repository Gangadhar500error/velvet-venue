/**
 * Properties Data
 * 
 * CENTRALIZED PROPERTY DATA - Used by dashboard and listing pages
 * 
 * BACKEND INTEGRATION NOTES:
 * - Replace propertiesData import with API call to fetch properties
 * - This is the SINGLE SOURCE OF TRUTH for property data
 * - Multiple pages use the same mockProperties array
 * 
 * API ENDPOINTS EXPECTED:
 * - GET /api/properties - Fetch all properties
 * - GET /api/properties/{id} - Fetch single property details
 * - POST /api/properties - Create new property
 * - PUT /api/properties/{id} - Update property
 * - DELETE /api/properties/{id} - Delete property
 * 
 * DATA STRUCTURE:
 * - Properties loaded from properties.json (will be replaced with API)
 * - Property interface defined in types/property.ts
 * - Customer counts calculated dynamically from bookings (see bookings.ts)
 * 
 * USAGE:
 * - Admin: src/app/admin/property-listings/page.tsx
 * - Both import: import { mockProperties } from "@/data/properties"
 */

import propertiesData from "./properties.json";
import { Property, generatePropertySlug, getStartingPrice } from "../types/property";

// Add slug to each property if not present
export const mockProperties: Property[] = propertiesData.properties.map((property) => ({
  ...property,
  slug: property.slug || generatePropertySlug(property.propertyName),
  workspaceType: property.workspaceType as Property["workspaceType"],
  propertyStatus: property.propertyStatus as Property["propertyStatus"],
  verificationStatus: property.verificationStatus as Property["verificationStatus"],
  featuredProperty: property.featuredProperty as Property["featuredProperty"],
  available24x7: property.available24x7 as Property["available24x7"],
  gstRegistered: property.gstRegistered as Property["gstRegistered"],
  floorPlan: property.floorPlan || undefined, // Convert null to undefined
  amenities: {
    wifi: property.amenities.wifi as Property["amenities"]["wifi"],
    acNonAc: property.amenities.acNonAc as Property["amenities"]["acNonAc"],
    powerBackup: property.amenities.powerBackup as Property["amenities"]["powerBackup"],
    lift: property.amenities.lift as Property["amenities"]["lift"],
    parking: property.amenities.parking as Property["amenities"]["parking"],
    securityCctv: property.amenities.securityCctv as Property["amenities"]["securityCctv"],
    pantryCafeteria: property.amenities.pantryCafeteria as Property["amenities"]["pantryCafeteria"],
  },
})) as unknown as Property[]; // Type assertion: JSON data structure matches Property interface

// Helper function to get property by ID
export const getPropertyById = (id: number): Property | undefined => {
  return mockProperties.find((property) => property.id === id);
};

// Helper function to get property by slug
export const getPropertyBySlug = (slug: string): Property | undefined => {
  return mockProperties.find((property) => property.slug === slug);
};

// Helper function to filter properties
export const filterProperties = (
  properties: Property[],
  searchTerm: string
): Property[] => {
  if (!searchTerm) return properties;
  
  const term = searchTerm.toLowerCase();
  return properties.filter(
    (property) =>
      property.propertyName.toLowerCase().includes(term) ||
      property.shortDescription.toLowerCase().includes(term) ||
      property.detailedDescription.toLowerCase().includes(term) ||
      property.fullAddress.toLowerCase().includes(term) ||
      property.city.toLowerCase().includes(term) ||
      property.areaLocality.toLowerCase().includes(term) ||
      property.brandOperatorName.toLowerCase().includes(term) ||
      property.contactPersonName.toLowerCase().includes(term)
  );
};

// Helper function to filter by workspace type
export const filterByWorkspaceType = (
  properties: Property[],
  workspaceType: Property["workspaceType"]
): Property[] => {
  if (!workspaceType) return properties;
  return properties.filter((property) => property.workspaceType === workspaceType);
};

// Helper function to filter by status
export const filterByStatus = (
  properties: Property[],
  status: Property["propertyStatus"]
): Property[] => {
  if (!status) return properties;
  return properties.filter((property) => property.propertyStatus === status);
};

// Helper function to filter by verification status
export const filterByVerificationStatus = (
  properties: Property[],
  verificationStatus: Property["verificationStatus"]
): Property[] => {
  if (!verificationStatus) return properties;
  return properties.filter((property) => property.verificationStatus === verificationStatus);
};

// Helper function to get all unique cities
export const getAllCities = (): string[] => {
  const cities = mockProperties.map((property) => property.city);
  return Array.from(new Set(cities)).sort();
};

// Helper function to get properties by city
export const getPropertiesByCity = (city: string): Property[] => {
  return mockProperties.filter((property) => property.city === city);
};
