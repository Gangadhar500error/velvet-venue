/** Approximate city centers for map pins (India) */
export const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  hyderabad: { lat: 17.385, lng: 78.4867 },
  secunderabad: { lat: 17.4399, lng: 78.4983 },
  warangal: { lat: 17.9689, lng: 79.5941 },
  karimnagar: { lat: 18.4386, lng: 79.1288 },
  khammam: { lat: 17.2473, lng: 80.1514 },
  nizamabad: { lat: 18.6725, lng: 78.0941 },
  visakhapatnam: { lat: 17.6868, lng: 83.2185 },
  vijayawada: { lat: 16.5062, lng: 80.648 },
  tirupati: { lat: 13.6288, lng: 79.4192 },
  guntur: { lat: 16.3067, lng: 80.4365 },
  rajahmundry: { lat: 17.0005, lng: 81.804 },
  kakinada: { lat: 16.9891, lng: 82.2475 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  mysuru: { lat: 12.2958, lng: 76.6394 },
  mangaluru: { lat: 12.9141, lng: 74.856 },
  hubballi: { lat: 15.3647, lng: 75.124 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  madurai: { lat: 9.9252, lng: 78.1198 },
  tiruchirappalli: { lat: 10.7905, lng: 78.7047 },
};

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function getVenueCoords(
  citySlug: string,
  venueId: string,
  area: string
): { lat: number; lng: number } {
  const center = CITY_CENTERS[citySlug] || CITY_CENTERS.hyderabad;
  const h = hashString(`${venueId}-${area}`);
  const lat = center.lat + ((h % 100) - 50) * 0.0018;
  const lng = center.lng + ((Math.floor(h / 100) % 100) - 50) * 0.0018;
  return { lat, lng };
}
