/**
 * Testimonials Data
 */

import { Testimonial } from "../types/testimonial";

export const mockTestimonials: Testimonial[] = [
  {
    id: 1,
    name: "Rohan Mehta",
    designation: "Groom",
    company: "Hyderabad",
    rating: 5,
    content: "Booked our wedding at Velvet Grand Wedding Palace through Velvet Venues and it was flawless. The decoration, catering, and staff support made our big day truly memorable. Highly recommended!",
    propertyId: 301,
    propertyName: "Velvet Grand Wedding Palace",
    isFeatured: true,
    isActive: true,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: 2,
    name: "Ananya Sharma",
    designation: "Event Planner",
    company: "Sharma Events",
    rating: 5,
    content: "The best venue booking platform I've used. Royal Banquet Hall had everything we needed for a 500-guest reception - spacious stage, great catering, and ample parking. Perfect for large celebrations!",
    propertyId: 302,
    propertyName: "Royal Banquet Hall",
    isFeatured: true,
    isActive: true,
    createdAt: "2024-01-20T11:00:00Z",
    updatedAt: "2024-01-20T11:00:00Z",
  },
  {
    id: 3,
    name: "Vikram Nair",
    designation: "Corporate Manager",
    company: "TechCorp India",
    rating: 4,
    content: "Great value for money. We hosted our annual conference at a Velvet Venues convention center and the AV setup, seating, and catering were all top-notch.",
    propertyId: 305,
    propertyName: "City Convention Centre",
    isFeatured: false,
    isActive: true,
    createdAt: "2024-02-10T09:00:00Z",
    updatedAt: "2024-02-10T09:00:00Z",
  },
  {
    id: 4,
    name: "Priya Patel",
    designation: "Bride",
    company: "Bengaluru",
    rating: 5,
    content: "Emerald Luxury Resort was the perfect destination wedding venue. The swimming pool, lawn, and rooms for our guests made the whole weekend feel like a getaway. Love the whole experience!",
    propertyId: 307,
    propertyName: "Emerald Luxury Resort",
    isFeatured: true,
    isActive: true,
    createdAt: "2024-02-15T14:00:00Z",
    updatedAt: "2024-02-15T14:00:00Z",
  },
  {
    id: 5,
    name: "Arjun Reddy",
    designation: "Birthday Host",
    company: "Hyderabad",
    rating: 4,
    content: "Booked Celebration Party Hall for my daughter's birthday. The DJ, decoration, and staff were excellent. Great venue for smaller, intimate celebrations. Highly satisfied!",
    propertyId: 304,
    propertyName: "Celebration Party Hall",
    isFeatured: false,
    isActive: true,
    createdAt: "2024-02-20T10:00:00Z",
    updatedAt: "2024-02-20T10:00:00Z",
  },
  {
    id: 6,
    name: "Kavya Iyer",
    designation: "Wedding Coordinator",
    company: "Chennai",
    rating: 5,
    content: "Outstanding facilities at Sunrise Farm House. The open lawn, generator backup, and pet-friendly policy were perfect for our client's outdoor wedding. Guests were thoroughly impressed!",
    propertyId: 303,
    propertyName: "Sunrise Farm House",
    isFeatured: true,
    isActive: true,
    createdAt: "2024-03-01T12:00:00Z",
    updatedAt: "2024-03-01T12:00:00Z",
  },
  {
    id: 7,
    name: "Karan Malhotra",
    designation: "Entrepreneur",
    company: "Warangal",
    rating: 4,
    content: "Great banquet hall with a vibrant atmosphere for our engagement ceremony. The amenities were excellent and the location was central and easy for guests to reach. Would definitely book again!",
    propertyId: 306,
    propertyName: "Heritage Hotel & Convention",
    isFeatured: false,
    isActive: true,
    createdAt: "2024-03-05T15:00:00Z",
    updatedAt: "2024-03-05T15:00:00Z",
  },
  {
    id: 8,
    name: "Sneha Joshi",
    designation: "Bride",
    company: "Visakhapatnam",
    rating: 5,
    content: "Ocean View Beach Venue gave us the beach wedding of our dreams. The decoration and photography team arranged through Velvet Venues captured every moment beautifully. Loved the sunset ceremony!",
    propertyId: 310,
    propertyName: "Ocean View Beach Venue",
    isFeatured: false,
    isActive: true,
    createdAt: "2024-03-10T11:00:00Z",
    updatedAt: "2024-03-10T11:00:00Z",
  },
];

export const filterTestimonials = (
  testimonials: Testimonial[],
  searchTerm: string,
  filters?: {
    isFeatured?: string;
    isActive?: string;
    rating?: string;
  }
): Testimonial[] => {
  let filtered = testimonials;
  
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (testimonial) =>
        testimonial.name.toLowerCase().includes(term) ||
        testimonial.company?.toLowerCase().includes(term) ||
        testimonial.propertyName?.toLowerCase().includes(term) ||
        testimonial.content.toLowerCase().includes(term)
    );
  }
  
  if (filters) {
    if (filters.isFeatured === "featured") {
      filtered = filtered.filter((testimonial) => testimonial.isFeatured === true);
    } else if (filters.isFeatured === "not-featured") {
      filtered = filtered.filter((testimonial) => testimonial.isFeatured === false);
    }
    
    if (filters.isActive === "active") {
      filtered = filtered.filter((testimonial) => testimonial.isActive === true);
    } else if (filters.isActive === "inactive") {
      filtered = filtered.filter((testimonial) => testimonial.isActive === false);
    }
    
    if (filters.rating) {
      const ratingNum = parseInt(filters.rating);
      filtered = filtered.filter((testimonial) => testimonial.rating === ratingNum);
    }
  }
  
  return filtered;
};
