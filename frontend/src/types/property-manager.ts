/**
 * Property Manager Type Definitions
 * This file contains TypeScript interfaces for Property Manager data structure
 * Used across the application for type safety
 */

export interface PropertyManager {
  id: number;
  name: string;
  slug?: string;
  mobile: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  joinDate?: string;
  status?: "active" | "inactive" | "pending";
  totalProperties?: number;
  totalEarnings?: number;
  role?: string;
  company?: string;
  mobileVerification?: "verified" | "unverified" | "pending";
  currency?: string;
  description?: string;
  image?: string;
}

// Helper function to generate slug from name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

export interface PropertyManagersData {
  propertyManagers: PropertyManager[];
}

