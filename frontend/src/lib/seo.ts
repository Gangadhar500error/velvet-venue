import { Metadata } from "next";

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  noindex?: boolean;
  nofollow?: boolean;
  city?: string;
  workspaceType?: string;
}

/**
 * Generate comprehensive SEO metadata for pages
 */
export function generateSEOMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    canonical,
    ogImage = "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=630&fit=crop",
    ogType = "website",
    noindex = false,
    nofollow = false,
    city,
    workspaceType,
  } = config;

  const metadataBase = new URL("https://www.velvetvenues.com");
  const fullTitle = title.includes("Velvet Venues") || title.includes("VelvetVenues")
    ? title
    : `${title} | Velvet Venues`;
  const canonicalUrl = canonical
    ? new URL(canonical, metadataBase).toString()
    : metadataBase.toString();

  const defaultKeywords = [
    "wedding venues",
    "banquet halls",
    "event venues",
    "resort venues",
    "luxury venues India",
  ];

  if (city) {
    defaultKeywords.push(`wedding venues ${city.toLowerCase()}`);
    defaultKeywords.push(`banquet halls ${city.toLowerCase()}`);
  }

  if (workspaceType) {
    defaultKeywords.push(workspaceType.toLowerCase());
  }

  const allKeywords = [...defaultKeywords, ...keywords].join(", ");

  return {
    title: fullTitle,
    description,
    keywords: allKeywords,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: ogType,
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: "Velvet Venues",
      images: [
        {
          url: new URL(ogImage, metadataBase).toString(),
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [new URL(ogImage, metadataBase).toString()],
      creator: "@velvetvenues",
      site: "@velvetvenues",
    },
    verification: {},
  };
}

/**
 * Generate JSON-LD structured data for venue listings
 */
export function generateWorkspaceStructuredData(
  city: string,
  workspaceType: string,
  count: number = 0
) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `Velvet Venues - ${workspaceType} in ${city}`,
    description: `Find the best ${workspaceType.toLowerCase()} options in ${city}. Premium wedding venues, banquet halls, and event spaces across India.`,
    address: {
      "@type": "PostalAddress",
      addressLocality: city,
      addressCountry: "IN",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      reviewCount: count > 0 ? count.toString() : "50",
    },
    offers: {
      "@type": "AggregateOffer",
      offerCount: count.toString(),
      priceCurrency: "INR",
      priceRange: "₹₹₹",
    },
  };
}

/**
 * Generate JSON-LD structured data for the home page
 */
export function generateHomeStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Velvet Venues",
    description: "India's premier venue booking platform for weddings, banquets, and events",
    url: "https://www.velvetvenues.com",
    logo: "https://www.velvetvenues.com/assets/valvetvenue.png",
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      availableLanguage: ["English", "Hindi"],
    },
    areaServed: {
      "@type": "Country",
      name: "India",
    },
  };
}

/**
 * Generate BreadcrumbList structured data
 */
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
