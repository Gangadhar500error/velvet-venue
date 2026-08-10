const fs = require("fs");
const path = require("path");

const outPath = path.join(
  __dirname,
  "../src/app/(main)/venues/[city]/data/workspaces.ts"
);

const images = {
  wedding:
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop",
  banquet:
    "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=600&fit=crop",
  resort:
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop",
  hotel:
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop",
  beach:
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
  farmHouse:
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
  convention:
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop",
  birthday:
    "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=600&fit=crop",
  luxury:
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=600&fit=crop",
  outdoor:
    "https://images.unsplash.com/photo-1478146896981-b80fe47f2358?w=800&h=600&fit=crop",
  dining:
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop",
  decoration:
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop",
  lawn:
    "https://images.unsplash.com/photo-1478146896981-b80fe47f2358?w=800&h=600&fit=crop",
};

const cities = {
  // Telangana
  Hyderabad: ["Banjara Hills", "Gachibowli", "Jubilee Hills", "Hitech City", "Madhapur"],
  Secunderabad: ["RP Road", "Trimulgherry", "Sainikpuri", "Malkajgiri", "Paradise"],
  Warangal: ["Hanamkonda", "Kazipet", "Warangal City", "Hunter Road", "Subedari"],
  Karimnagar: ["Mukarampura", "Choppadandi Road", "Kaman", "Jagtial Road", "Collectorate"],
  Khammam: ["Wyra Road", "Gandhi Chowk", "Ballepalli", "NSP Colony", "D.No Road"],
  Nizamabad: ["Armoor Road", "Hyderabad Road", "Vinayak Nagar", "Dichpally", "Subhash Nagar"],
  // Andhra Pradesh
  Visakhapatnam: ["Beach Road", "MVP Colony", "Gajuwaka", "Madhurawada", "Rushikonda"],
  Vijayawada: ["Benz Circle", "Labbipet", "Governorpet", "Auto Nagar", "Gannavaram"],
  Tirupati: ["Alipiri", "Renigunta", "Tiruchanur", "Chandragiri", "Kapilatheertham"],
  Guntur: ["Brodipet", "Lakshmipuram", "Arundelpet", "Amaravathi Road", "Nagarampalem"],
  Rajahmundry: ["Danavaipeta", "Innispeta", "Morampudi", "Diwancheruvu", "Kotipalli"],
  Kakinada: ["Suryaraopeta", "Bhanugudi", "Ramanayyapeta", "Jagannaickpur", "Cinema Road"],
  // Karnataka
  Bengaluru: ["Indiranagar", "Whitefield", "Koramangala", "Jayanagar", "Electronic City"],
  Mysuru: ["Lakshmipuram", "Vijayanagar", "Gokulam", "Kuvempunagar", "Nazarbad"],
  Mangaluru: ["Kadri", "Bejai", "Pandeshwar", "Surathkal", "Hampankatta"],
  Hubballi: ["Vidyanagar", "Deshpande Nagar", "Gokul Road", "Unkal", "Old Hubli"],
  // Tamil Nadu
  Chennai: ["T Nagar", "Anna Nagar", "OMR", "ECR", "Adyar"],
  Coimbatore: ["RS Puram", "Saibaba Colony", "Peelamedu", "Race Course", "Singanallur"],
  Madurai: ["Anna Nagar", "KK Nagar", "Tallakulam", "Goripalayam", "Alagar Kovil"],
  Tiruchirappalli: ["Cantonment", "Thillai Nagar", "Srirangam", "Woraiyur", "KK Nagar"],
};

const venueTemplates = [
  {
    name: "Velvet Grand Wedding Palace",
    type: "Wedding Venue",
    img: "wedding",
    amenities: ["Parking", "AC", "Stage", "Decoration", "Catering", "DJ"],
    capacity: 800,
    eventTypes: ["Wedding", "Reception", "Engagement"],
    price: 250000,
    badge: "Featured",
  },
  {
    name: "Royal Banquet Hall",
    type: "Banquet Hall",
    img: "banquet",
    amenities: ["Parking", "AC", "Stage", "Rooms", "Generator", "Catering"],
    capacity: 500,
    eventTypes: ["Wedding", "Reception", "Birthday", "Corporate"],
    price: 150000,
    badge: "Popular",
  },
  {
    name: "Emerald Luxury Resort",
    type: "Resort",
    img: "resort",
    amenities: ["Swimming Pool", "Parking", "Lawn", "Rooms", "AC", "Catering"],
    capacity: 600,
    eventTypes: ["Wedding", "Anniversary", "Corporate"],
    price: 350000,
    badge: "Featured",
  },
  {
    name: "Heritage Hotel & Convention",
    type: "Hotel",
    img: "hotel",
    amenities: ["Parking", "AC", "Rooms", "Valet Parking", "Catering", "Photography"],
    capacity: 400,
    eventTypes: ["Corporate", "Conference", "Wedding"],
    price: 200000,
    badge: "Verified",
  },
  {
    name: "Sunrise Farm House",
    type: "Farm House",
    img: "farmHouse",
    amenities: ["Lawn", "Parking", "DJ", "Decoration", "Generator", "Pet Friendly"],
    capacity: 300,
    eventTypes: ["Birthday", "Wedding", "Baby Shower"],
    price: 80000,
    badge: "Special Offer",
  },
  {
    name: "Ocean View Beach Venue",
    type: "Beach Venue",
    img: "beach",
    amenities: ["Parking", "Decoration", "DJ", "Catering", "Photography"],
    capacity: 350,
    eventTypes: ["Wedding", "Engagement", "Anniversary"],
    price: 280000,
  },
  {
    name: "City Convention Centre",
    type: "Convention Center",
    img: "convention",
    amenities: ["Parking", "AC", "Stage", "Generator", "Catering"],
    capacity: 1000,
    eventTypes: ["Conference", "Corporate", "Wedding"],
    price: 400000,
    badge: "Popular",
  },
  {
    name: "Celebration Party Hall",
    type: "Party Hall",
    img: "birthday",
    amenities: ["AC", "Parking", "DJ", "Decoration", "Stage"],
    capacity: 200,
    eventTypes: ["Birthday", "Baby Shower", "Anniversary"],
    price: 45000,
    badge: "Special Offer",
  },
  {
    name: "Lotus Garden Outdoor Venue",
    type: "Outdoor Venue",
    img: "outdoor",
    amenities: ["Lawn", "Parking", "Decoration", "DJ", "Generator"],
    capacity: 700,
    eventTypes: ["Wedding", "Reception", "Engagement"],
    price: 180000,
  },
  {
    name: "Maharaja Luxury Banquet",
    type: "Luxury Venue",
    img: "luxury",
    amenities: ["Parking", "AC", "Stage", "Rooms", "Valet Parking", "Catering", "Photography"],
    capacity: 900,
    eventTypes: ["Wedding", "Reception", "Corporate"],
    price: 500000,
    badge: "Featured",
  },
];

function esc(str) {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

let out = `export interface Workspace {
  id: string;
  name: string;
  city: string;
  area: string;
  rating: number;
  reviewCount: number;
  badge?: "Popular" | "Special Offer" | "Featured" | "Verified";
  price: number;
  image: string;
  images?: string[];
  amenities: string[];
  type:
    | "Wedding Venue"
    | "Banquet Hall"
    | "Resort"
    | "Hotel"
    | "Farm House"
    | "Beach Venue"
    | "Convention Center"
    | "Party Hall"
    | "Outdoor Venue"
    | "Luxury Venue"
    | "Function Hall"
    | "Conference Venue";
  description?: string;
  capacity?: number;
  eventTypes?: string[];
  verified?: boolean;
}

export const workspaces: Workspace[] = [
`;

let id = 1;
for (const [city, areas] of Object.entries(cities)) {
  for (let i = 0; i < venueTemplates.length; i++) {
    const t = venueTemplates[i];
    const area = areas[i % areas.length];
    const slug = city.toLowerCase().replace(/\s+/g, "-");
    const venueId = `vv-${slug}-${id}`;
    const rating = +(4.2 + ((id * 7) % 70) / 100).toFixed(1);
    const reviews = 80 + ((id * 13) % 400);
    const img = images[t.img];
    const gallery = [img, images.decoration, images.dining, images.lawn];
    const priceVar = t.price + (((id * 3) % 5) - 2) * 10000;
    const badge = t.badge;
    const name = `${t.name} - ${area}`;
    const desc = `Premium ${t.type.toLowerCase()} in ${area}, ${city}. Ideal for ${t.eventTypes
      .join(", ")
      .toLowerCase()} with capacity up to ${t.capacity} guests.`;

    out += `  {
    id: "${venueId}",
    name: "${esc(name)}",
    city: "${esc(city)}",
    area: "${esc(area)}",
    rating: ${rating},
    reviewCount: ${reviews},${badge ? `\n    badge: "${badge}",` : ""}
    price: ${priceVar},
    image: "${img}",
    images: ${JSON.stringify(gallery)},
    amenities: ${JSON.stringify(t.amenities)},
    type: "${t.type}",
    description: "${esc(desc)}",
    capacity: ${t.capacity},
    eventTypes: ${JSON.stringify(t.eventTypes)},
    verified: true
  },
`;
    id++;
  }
}

out += `];
`;

// Keep helper exports if pages depend on them — check and append common helpers
out += `
export const getAreasByCity = (city: string): string[] => {
  const areas = workspaces
    .filter((ws) => ws.city.toLowerCase() === city.toLowerCase())
    .map((ws) => ws.area);
  return Array.from(new Set(areas));
};

export const getWorkspacesByCity = (city: string): Workspace[] => {
  return workspaces.filter((ws) => ws.city.toLowerCase() === city.toLowerCase());
};

export const getWorkspaceById = (id: string): Workspace | undefined => {
  return workspaces.find((ws) => ws.id === id);
};
`;

fs.writeFileSync(outPath, out);
console.log("Wrote", id - 1, "venues to", outPath);
