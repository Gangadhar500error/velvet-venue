/**
 * Property Managers Data
 * Centralized data file for property managers
 * Can be easily replaced with API calls later
 */

import propertyManagersData from "./property-managers.json";
import { PropertyManager, generateSlug } from "../types/property-manager";
import { mockProperties } from "./properties";

// Helper function to get properties for a manager
export const getPropertiesForManager = (managerName: string, companyName?: string) => {
  return mockProperties.filter((property) => {
    // Match by contact person name (exact or contains)
    const contactName = property.contactPersonName?.toLowerCase().trim() || "";
    const managerNameLower = managerName.toLowerCase().trim();
    const nameMatch = contactName === managerNameLower || 
                      contactName.includes(managerNameLower) ||
                      managerNameLower.includes(contactName);
    
    // Match by company/brand name (exact or contains)
    const brandName = property.brandOperatorName?.toLowerCase().trim() || "";
    const companyNameLower = companyName?.toLowerCase().trim() || "";
    const companyMatch = companyNameLower && (
      brandName === companyNameLower ||
      brandName.includes(companyNameLower) ||
      companyNameLower.includes(brandName)
    );
    
    return nameMatch || companyMatch;
  });
};

// Helper function to count properties for a manager
export const getPropertyCountForManager = (managerName: string, companyName?: string): number => {
  return getPropertiesForManager(managerName, companyName).length;
};

// Helper function to calculate total earnings for a manager
export const getTotalEarningsForManager = (managerName: string, companyName?: string, currency: string = "USD"): number => {
  const properties = getPropertiesForManager(managerName, companyName);
  
  return properties.reduce((total, property) => {
    let propertyEarnings = 0;
    
    // Calculate based on workspace type
    if (property.workspaceType === "Coworking" && property.coworkingFields) {
      // Use monthly price as base earnings indicator
      propertyEarnings = property.coworkingFields.monthlyPrice || 0;
    } else if (property.workspaceType === "Private Office" && property.privateOfficeFields) {
      propertyEarnings = property.privateOfficeFields.monthlyRent || 0;
    } else if (property.workspaceType === "Meeting Room" && property.meetingRoomFields) {
      // Use full day price * 20 (assuming 20 bookings per month)
      propertyEarnings = (property.meetingRoomFields.fullDayPrice || 0) * 20;
    } else if (property.workspaceType === "Virtual Office" && property.virtualOfficeFields) {
      propertyEarnings = property.virtualOfficeFields.monthlyPrice || 0;
    }
    
    return total + propertyEarnings;
  }, 0);
};

// Add slug and calculate actual property count and earnings for each property manager
export const mockPropertyManagers: PropertyManager[] = propertyManagersData.propertyManagers.map((manager) => {
  const actualCount = getPropertyCountForManager(manager.name, manager.company);
  const totalEarnings = getTotalEarningsForManager(manager.name, manager.company, manager.currency || "USD");
  return {
    ...manager,
    slug: generateSlug(manager.name),
    totalProperties: actualCount,
    totalEarnings: totalEarnings,
    status: manager.status as PropertyManager["status"],
    mobileVerification: manager.mobileVerification as PropertyManager["mobileVerification"],
  };
});

// Helper function to get property manager by ID
export const getPropertyManagerById = (id: number): PropertyManager | undefined => {
  return mockPropertyManagers.find((manager) => manager.id === id);
};

// Helper function to get property manager by slug
export const getPropertyManagerBySlug = (slug: string): PropertyManager | undefined => {
  return mockPropertyManagers.find((manager) => manager.slug === slug);
};

// Helper function to filter property managers
export const filterPropertyManagers = (
  managers: PropertyManager[],
  searchTerm: string
): PropertyManager[] => {
  if (!searchTerm) return managers;
  
  const term = searchTerm.toLowerCase();
  return managers.filter(
    (manager) =>
      manager.name.toLowerCase().includes(term) ||
      manager.email.toLowerCase().includes(term) ||
      manager.mobile.includes(term) ||
      manager.company?.toLowerCase().includes(term) ||
      manager.role?.toLowerCase().includes(term)
  );
};

