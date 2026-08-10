/**
 * Amenity Type Definition
 */

export interface Amenity {
  id: number;
  name: string;
  icon?: string; // Icon name or URL
  category: "basic" | "premium" | "tech" | "wellness" | "food" | "security" | "other";
  description?: string;
  isActive: boolean; // Is this amenity active?
  createdAt: string;
  updatedAt: string;
}

