import Image from "next/image";
import { venueImages } from "@/data/venueImages";

interface FeatureCard {
  id: number;
  heading: string;
  paragraph: string;
  image: string;
}

const featureCards: FeatureCard[] = [
  {
    id: 1,
    heading: "Wedding Venues",
    paragraph: "Stunning wedding venues for couples and families seeking a memorable celebration.",
    image: venueImages.wedding,
  },
  {
    id: 2,
    heading: "Banquet Halls",
    paragraph: "Spacious banquet halls with elegant décor and all amenities included.",
    image: venueImages.banquet,
  },
  {
    id: 3,
    heading: "Resorts & Hotels",
    paragraph: "Enjoy comfort, luxury, and scenic surroundings at premium resorts and hotels.",
    image: venueImages.resort,
  },
  {
    id: 4,
    heading: "Farm Houses",
    paragraph: "Get a private, lush green farm house setting for your next celebration.",
    image: venueImages.farmHouse,
  },
  {
    id: 5,
    heading: "Party Halls",
    paragraph: "Book professional party halls equipped with everything you need for a successful event.",
    image: venueImages.party,
  },
  {
    id: 6,
    heading: "Event/Conference Venues",
    paragraph: "Host conferences, corporate events, and networking gatherings in our versatile venues.",
    image: venueImages.convention,
  },
];

export default function FeatureCards() {
  return (
    <section className=" w-full bg-white py-6 md:py-10">
      <div className="container-custom px-4 md:px-6 lg:px-8">
        <div className="mb-6 md:mb-8 lg:mb-10">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight font-display">
            Explore Our Venue Categories
          </h2>
          <p className="mt-2 text-sm md:text-base text-gray-700 leading-relaxed max-w-3xl">
            From grand weddings to intimate gatherings, discover the perfect space for every celebration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {featureCards.map((card) => (
            <div
              key={card.id}
              className="flex flex-row gap-3 md:gap-4 items-start"
            >
              <div className="relative w-24 h-24 md:w-2/5 md:h-28 shrink-0 rounded-xl overflow-hidden">
                <Image
                  src={card.image}
                  alt={card.heading}
                  fill
                  className="object-cover rounded-xl"
                  sizes="(max-width: 768px) 96px, 40vw"
                />
              </div>

              <div className="flex-1 p-0 flex flex-col justify-start min-w-0">
                <h3 className="text-lg md:text-xl font-bold text-black mb-1.5 md:mb-2 font-display">
                  {card.heading}
                </h3>
                <p className="text-gray-700 mb-0 text-sm md:text-[15px] leading-relaxed font-body">
                  {card.paragraph}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
