export type HomeTestimonial = {
  id: number;
  review: string;
  name: string;
  city: string;
  venueType: string;
  initials: string;
};

export const homeTestimonials: HomeTestimonial[] = [
  {
    id: 1,
    review:
      "Booking through Velvet Venues made our wedding planning effortless. Everything was smooth and the venue exceeded our expectations.",
    name: "Priya Sharma",
    city: "Hyderabad",
    venueType: "Wedding Venue",
    initials: "PS",
  },
  {
    id: 2,
    review:
      "We found the perfect banquet hall for our reception within days. Transparent pricing and excellent support throughout.",
    name: "Rahul Mehta",
    city: "Bengaluru",
    venueType: "Banquet Hall",
    initials: "RM",
  },
  {
    id: 3,
    review:
      "Our corporate event at a resort venue was flawless. The team helped us compare options and finalize quickly.",
    name: "Ananya Reddy",
    city: "Visakhapatnam",
    venueType: "Resort",
    initials: "AR",
  },
  {
    id: 4,
    review:
      "The farm house venue was stunning for our anniversary party. Velvet Venues made the entire process stress-free.",
    name: "Karthik Nair",
    city: "Chennai",
    venueType: "Farm House",
    initials: "KN",
  },
  {
    id: 5,
    review:
      "From shortlisting to booking, everything felt premium and professional. Highly recommend for destination weddings.",
    name: "Sneha Patel",
    city: "Mumbai",
    venueType: "Villa",
    initials: "SP",
  },
  {
    id: 6,
    review:
      "We booked a party hall for our daughter's birthday and loved the experience. Great venues and friendly service.",
    name: "Mohammed Ali",
    city: "Warangal",
    venueType: "Party Hall",
    initials: "MA",
  },
];
