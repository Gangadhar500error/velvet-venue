/**
 * Testimonial Type Definition
 */

export interface Testimonial {
  id: number;
  name: string;
  designation?: string; // Job title or role
  company?: string;
  image?: string;
  rating: number; // 1-5 stars
  content: string; // Testimonial text
  propertyId?: number; // Related property if any
  propertyName?: string;
  isFeatured: boolean; // Featured on homepage?
  isActive: boolean; // Is this testimonial active?
  createdAt: string;
  updatedAt: string;
}

