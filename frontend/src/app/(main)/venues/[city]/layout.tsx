import { Metadata } from "next";
import { generateSEOMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ city: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: cityParam } = await params;
  const citySlug = cityParam || "hyderabad";
  const city = citySlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return generateSEOMetadata({
    title: `Wedding & Event Venues in ${city} | Book Premium Venues`,
    description: `Find the best wedding venues, banquet halls, and event spaces in ${city}. Browse premium venues with modern amenities, flexible booking, and prime locations.`,
    keywords: [
      `wedding venues ${city.toLowerCase()}`,
      `event venues ${city.toLowerCase()}`,
      `banquet halls ${city.toLowerCase()}`,
      `party venues ${city.toLowerCase()}`,
      "wedding hall",
      "outdoor venue",
      "luxury venue",
    ],
    canonical: `/venues/${citySlug}`,
    city,
    workspaceType: "Wedding & Event Venues",
  });
}

export default function VenuesCityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
