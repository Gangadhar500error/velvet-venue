import { venueImages } from "@/data/venueImages";

export type HomeCategory = {
  id: number;
  name: string;
  description: string;
  image: string;
  href: string;
};

export const homeCategories: HomeCategory[] = [
  {
    id: 1,
    name: "Farm Houses",
    description:
      "Outdoor events, rustic weddings, family getaways, friends retreat, nature shoots",
    image: venueImages.farmHouse,
    href: "/venues/hyderabad",
  },
  {
    id: 2,
    name: "Resorts",
    description:
      "All-in-one experience for corporate offsites, destination stays, and event shoots",
    image: venueImages.resort,
    href: "/venues/hyderabad",
  },
  {
    id: 3,
    name: "Banquet Halls",
    description:
      "Weddings, birthdays, receptions, pre-wedding shoots",
    image: venueImages.banquet,
    href: "/venues/hyderabad",
  },
  {
    id: 4,
    name: "Conference Halls",
    description:
      "Ideal for corporate events, seminars, workshops, large weddings & receptions",
    image: venueImages.convention,
    href: "/venues/hyderabad",
  },
  {
    id: 5,
    name: "Wedding Venues",
    description:
      "Perfect for weddings, receptions, engagement celebrations and grand events",
    image: venueImages.wedding,
    href: "/venues/hyderabad",
  },
  {
    id: 6,
    name: "Party Halls",
    description:
      "Birthdays, baby showers, family gatherings and intimate celebrations",
    image: venueImages.party,
    href: "/venues/hyderabad",
  },
];
