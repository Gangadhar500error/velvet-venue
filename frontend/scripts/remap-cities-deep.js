const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const CITY_OPTIONS = `export const cityOptions = [
  "Hyderabad",
  "Warangal",
  "Karimnagar",
  "Visakhapatnam",
  "Vijayawada",
  "Tirupati",
  "Bengaluru",
  "Mysuru",
  "Chennai",
  "Coimbatore",
];`;

const replacements = [
  ["Mumbai, Maharashtra", "Hyderabad, Telangana"],
  ["Mumbai, MH", "Hyderabad, TS"],
  ["Delhi, DL", "Hyderabad, TS"],
  ["Pune, MH", "Bengaluru, KA"],
  ["Kolkata, WB", "Chennai, TN"],
  ["Indore, MP", "Mysuru, KA"],
  ["Chandigarh, CH", "Mysuru, KA"],
  ["Ahmedabad, GJ", "Karimnagar, TS"],
  ["Lucknow, UP", "Tirupati, AP"],
  ["Surat, GJ", "Vijayawada, AP"],
  ["Kochi, KL", "Chennai, TN"],
  ["Nagpur, MH", "Warangal, TS"],
  ["Bhopal, MP", "Karimnagar, TS"],
  ["Goa, GA", "Visakhapatnam, AP"],
  ["Bandra West, Mumbai", "Banjara Hills, Hyderabad"],
  ["heart of Mumbai", "heart of Hyderabad"],
  ["central Delhi", "central Hyderabad"],
  ["Central Delhi", "Central Hyderabad"],
  ["Mumbai's", "Hyderabad's"],
  ["Mumbai skyline", "Hyderabad skyline"],
  ["views of Mumbai", "views of Hyderabad"],
  [" in Pune", " in Bengaluru"],
  ["Baner+Pashan+Link+Road+Pune", "Indiranagar+Bengaluru"],
  ["Baner+Road+Pune", "Koramangala+Bengaluru"],
  ["Linking+Road+Bandra+West+Mumbai", "Banjara+Hills+Hyderabad"],
  ["CG+Road+Navrangpura+Ahmedabad", "Mukarampura+Karimnagar"],
  ["Connaught+Place+Delhi", "Jubilee+Hills+Hyderabad"],
  ["Marine+Drive+Kochi", "Anna+Nagar+Chennai"],
  ["C-Scheme+Jaipur", "Hanamkonda+Warangal"],
  ["Park+Street+Kolkata", "T+Nagar+Chennai"],
  ["across Ahmedabad", "across Karimnagar"],
  ["Gujarati wedding", "Telangana wedding"],
  [" in Kochi", " in Chennai"],
  ["backwater resort in Kochi", "resort in Chennai"],
  [" in Jaipur", " in Warangal"],
  [" in Kolkata", " in Chennai"],
  ["Mumbai and Pune", "Hyderabad and Bengaluru"],
  ["Mumbai, India", "Hyderabad, India"],
  ["The Grand Orchid, Mumbai", "The Grand Orchid, Hyderabad"],
  ["Nagpur Wedding Venue", "Warangal Wedding Venue"],
  ["Bhopal Wedding Venue", "Karimnagar Wedding Venue"],
  ["Lucknow Conference Hall", "Tirupati Conference Hall"],
  ["Mumbai Party Lawn", "Hyderabad Party Lawn"],
  ['"Mumbai"', '"Hyderabad"'],
  ['"Delhi"', '"Hyderabad"'],
  ['"Pune"', '"Bengaluru"'],
  ['"Kolkata"', '"Chennai"'],
  ['"Ahmedabad"', '"Karimnagar"'],
  ['"Jaipur"', '"Warangal"'],
  ['"Kochi"', '"Chennai"'],
  ['"Goa"', '"Visakhapatnam"'],
  ['"Nagpur"', '"Warangal"'],
  ['"Bhopal"', '"Karimnagar"'],
  ['"Lucknow"', '"Tirupati"'],
  ['"Surat"', '"Vijayawada"'],
  ['"Indore"', '"Mysuru"'],
  ['"Chandigarh"', '"Mysuru"'],
  ['"Gurugram"', '"Coimbatore"'],
  ['"Noida"', '"Mysuru"'],
  ['state: "Delhi"', 'state: "Telangana"'],
  ['state: "Goa"', 'state: "Andhra Pradesh"'],
  ['location: "Mumbai, Maharashtra"', 'location: "Hyderabad, Telangana"'],
];

const files = [
  "src/data/bookings.ts",
  "src/data/customer-properties.ts",
  "src/data/customers.ts",
  "src/app/admin/venues/data.ts",
  "src/app/admin/bookings/data.ts",
  "src/app/admin/customers/data.ts",
  "src/app/admin/venue-owners/data.ts",
  "src/app/admin/business-profile/data.ts",
  "src/app/admin/settings/profile/page.tsx",
];

for (const rel of files) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    console.log("missing", rel);
    continue;
  }
  let c = fs.readFileSync(full, "utf8");
  const before = c;
  for (const [a, b] of replacements) {
    c = c.split(a).join(b);
  }
  if (
    rel.includes("customers/data") ||
    rel.includes("venue-owners/data") ||
    rel.includes("business-profile/data")
  ) {
    c = c.replace(/export const cityOptions = \[[\s\S]*?\];/, CITY_OPTIONS);
  }
  if (c !== before) {
    fs.writeFileSync(full, c);
    console.log("updated", rel);
  } else {
    console.log("unchanged", rel);
  }
}

console.log("done");
