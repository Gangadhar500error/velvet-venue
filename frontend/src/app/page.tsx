import HeroSection from "@/components/landing-page/HeroSection";
import ImageScroller from "@/components/landing-page/ImageScroller";
import Coworkspace from "@/components/landing-page/Coworkspace";
import Pricing from "@/components/landing-page/Pricing";
import SpacesSection from "@/components/landing-page/SpacesSection";
import Services from "@/components/landing-page/Services";
import CTASection from "@/components/landing-page/CTASection";
import AboutUs from "@/components/landing-page/AboutUs";
import TopCategoriesCarousel from "@/components/landing-page/TopCategoriesCarousel";
import TestimonialsCarousel from "@/components/landing-page/TestimonialsCarousel";
import { generateSEOMetadata, generateHomeStructuredData } from "@/lib/seo";
import SEOContent from "@/components/VenueLanding/SEOContent";
import FeatureCards from "@/components/landing-page/FeatureCards";

export const metadata = generateSEOMetadata({
  title: "Velvet Venues - Wedding Venues & Banquet Halls | Book Venues Across India",
  description:
    "Discover premium wedding venues, banquet halls, resorts, hotels, farm houses, and party halls. Velvet Venues offers stunning venue solutions for weddings and celebrations across India.",
  keywords: [
    "wedding venues",
    "banquet halls",
    "resorts",
    "hotels",
    "farm houses",
    "party halls",
    "event venues",
    "wedding planning",
    "venue booking",
    "venues in India",
  ],
  canonical: "/",
  ogImage: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=630&fit=crop",
});

export default function Home() {
  const structuredData = generateHomeStructuredData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main>
        <HeroSection />
        <FeatureCards />
        <Coworkspace />
        <AboutUs />
        <TopCategoriesCarousel />
        <SpacesSection />
        <CTASection />
        <Services />
        <TestimonialsCarousel />
        {/* <Pricing /> */}
        {/* <ImageScroller /> */}
        <SEOContent />
      </main>
    </>
  );
}
