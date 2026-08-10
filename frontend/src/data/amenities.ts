/**
 * Amenities Data
 */

import { Amenity } from "../types/amenity";

export const mockAmenities: Amenity[] = [
  {
    id: 1,
    name: "Parking",
    icon: "car",
    category: "basic",
    description: "Secure on-site parking for guests and vehicles",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "AC",
    icon: "wind",
    category: "basic",
    description: "Fully air-conditioned halls and banquet areas",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 3,
    name: "Stage",
    icon: "mic",
    category: "premium",
    description: "Dedicated stage setup for performances and ceremonies",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 4,
    name: "Rooms",
    icon: "bed",
    category: "premium",
    description: "Guest rooms available for overnight stay",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 5,
    name: "Swimming Pool",
    icon: "waves",
    category: "wellness",
    description: "On-site swimming pool for guests and events",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 6,
    name: "Lawn",
    icon: "trees",
    category: "premium",
    description: "Spacious open-air lawn for outdoor celebrations",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 7,
    name: "DJ",
    icon: "music",
    category: "premium",
    description: "Professional DJ and sound system for events",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 8,
    name: "Decoration",
    icon: "sparkles",
    category: "premium",
    description: "In-house decoration and theme setup services",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 9,
    name: "Generator",
    icon: "zap",
    category: "basic",
    description: "Backup power generator for uninterrupted events",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 10,
    name: "Catering",
    icon: "utensils",
    category: "food",
    description: "In-house catering with customizable menus",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 11,
    name: "Photography",
    icon: "camera",
    category: "premium",
    description: "Professional photography and videography services",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 12,
    name: "Valet Parking",
    icon: "car",
    category: "premium",
    description: "Valet parking assistance for guests",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 13,
    name: "Pet Friendly",
    icon: "paw-print",
    category: "other",
    description: "Venue welcomes pets for events and celebrations",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 14,
    name: "High-Speed WiFi",
    icon: "wifi",
    category: "tech",
    description: "Ultra-fast internet connection throughout the venue",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: 15,
    name: "24/7 Access",
    icon: "clock",
    category: "premium",
    description: "Round-the-clock access for setup and events",
    isActive: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z",
  },
];

export const filterAmenities = (
  amenities: Amenity[],
  searchTerm: string,
  filters?: {
    category?: string;
    isActive?: string;
  }
): Amenity[] => {
  let filtered = amenities;
  
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (amenity) =>
        amenity.name.toLowerCase().includes(term) ||
        amenity.description?.toLowerCase().includes(term) ||
        amenity.category.toLowerCase().includes(term)
    );
  }
  
  if (filters) {
    if (filters.category) {
      filtered = filtered.filter((amenity) => amenity.category === filters.category);
    }
    
    if (filters.isActive === "active") {
      filtered = filtered.filter((amenity) => amenity.isActive === true);
    } else if (filters.isActive === "inactive") {
      filtered = filtered.filter((amenity) => amenity.isActive === false);
    }
  }
  
  return filtered;
};
