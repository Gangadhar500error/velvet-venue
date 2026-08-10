/**
 * Remap city names in mock/data files to the 10 Phase-1 cities.
 */
const fs = require("fs");
const path = require("path");

const ALLOWED = [
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
];

const MAP = {
  Mumbai: "Hyderabad",
  Delhi: "Hyderabad",
  Pune: "Bengaluru",
  Kolkata: "Chennai",
  Jaipur: "Warangal",
  Ahmedabad: "Karimnagar",
  Surat: "Vijayawada",
  Lucknow: "Tirupati",
  Noida: "Mysuru",
  Gurugram: "Coimbatore",
  Goa: "Visakhapatnam",
  Kochi: "Chennai",
  Thrissur: "Coimbatore",
  Nagpur: "Warangal",
  Indore: "Mysuru",
  Bhopal: "Karimnagar",
  Patna: "Tirupati",
  Bhubaneswar: "Visakhapatnam",
  Amritsar: "Warangal",
  Chandigarh: "Mysuru",
  Madurai: "Coimbatore",
  "New York": "Hyderabad",
  "Los Angeles": "Bengaluru",
  Chicago: "Chennai",
  Miami: "Visakhapatnam",
  Tampa: "Hyderabad",
  Orlando: "Bengaluru",
};

const STATE_MAP = {
  Maharashtra: "Telangana",
  Delhi: "Telangana",
  "West Bengal": "Tamil Nadu",
  Rajasthan: "Telangana",
  Gujarat: "Telangana",
  "Uttar Pradesh": "Andhra Pradesh",
  Haryana: "Tamil Nadu",
  Goa: "Andhra Pradesh",
  Kerala: "Tamil Nadu",
  "Madhya Pradesh": "Karnataka",
  Bihar: "Andhra Pradesh",
  Odisha: "Andhra Pradesh",
  Punjab: "Telangana",
  Florida: "Telangana",
  NY: "Telangana",
  MH: "Telangana",
  DL: "Telangana",
  KA: "Karnataka",
  TN: "Tamil Nadu",
  AP: "Andhra Pradesh",
  TS: "Telangana",
};

const files = [
  "src/data/customers.ts",
  "src/data/customer-bookings.ts",
  "src/data/customer-properties.ts",
  "src/data/bookings.ts",
  "src/data/property-managers.json",
  "src/data/property-managers.ts",
  "src/data/payments.ts",
  "src/data/invoices.ts",
  "src/data/transactions.ts",
  "src/app/admin/venues/data.ts",
  "src/app/admin/bookings/data.ts",
  "src/app/customer/settings/page.tsx",
  "src/components/landing-page/Pricing.tsx",
];

const root = path.join(__dirname, "..");

function replaceAll(content) {
  let out = content;
  // Longer / specific place names first for location strings
  const placePairs = [
    ["Bandra, Mumbai", "Banjara Hills, Hyderabad"],
    ["Cyber City, Gurugram", "Gachibowli, Hyderabad"],
    ["Calangute, Goa", "Beach Road, Visakhapatnam"],
    ["Candolim, Goa", "Rushikonda, Visakhapatnam"],
    ["Connaught Place, Delhi", "Jubilee Hills, Hyderabad"],
    ["Salt Lake, Kolkata", "T Nagar, Chennai"],
    ["Koregaon Park, Pune", "Indiranagar, Bengaluru"],
    ["South Delhi", "Jubilee Hills"],
    ["Fort Kochi", "Anna Nagar"],
  ];
  for (const [from, to] of placePairs) {
    out = out.split(from).join(to);
  }
  for (const [from, to] of Object.entries(MAP)) {
    // city: "X" patterns and plain occurrences in quotes
    const reCity = new RegExp(`(city:\\s*")${from}(")`, "g");
    out = out.replace(reCity, `$1${to}$2`);
    const reCompany = new RegExp(`(company:\\s*")${from}(")`, "g");
    out = out.replace(reCompany, `$1${to}$2`);
    const reQuoted = new RegExp(`"${from}"`, "g");
    // Only replace if not already an allowed city slug context - careful with partial
    if (!ALLOWED.includes(from)) {
      out = out.replace(reQuoted, `"${to}"`);
    }
  }
  for (const [from, to] of Object.entries(STATE_MAP)) {
    const reState = new RegExp(`(state:\\s*")${from}(")`, "g");
    out = out.replace(reState, `$1${to}$2`);
  }
  // Pricing leftover
  out = out.replace("Jaipur", "Hyderabad");
  return out;
}

for (const rel of files) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    console.log("skip missing", rel);
    continue;
  }
  const before = fs.readFileSync(full, "utf8");
  const after = replaceAll(before);
  if (after !== before) {
    fs.writeFileSync(full, after);
    console.log("updated", rel);
  } else {
    console.log("unchanged", rel);
  }
}

console.log("done");
