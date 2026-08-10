import Link from "next/link";
import { allCities } from "@/data/cities";

const cityToSlug = (cityName: string): string => {
  return cityName.toLowerCase().replace(/\s+/g, "-").replace(/\./g, "").replace(/,/g, "");
};

const cities = allCities.map((c) => c.name);

export default function SEOContent() {
  return (
    <section className="bg-gray-50 py-10 lg:py-12">
      <div className="container-custom px-4 sm:px-6 lg:px-8">
        <div className=" prose prose-lg">
          <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-6 font-display">
            Wedding & Event Venues in South India - Premium Banquet Halls
          </h2>
          <p className="text-gray-700 mb-6 font-body leading-relaxed">
            Finding the perfect venue is the foundation of any memorable celebration across{" "}
            <span className="text-orange-600 font-semibold">Telangana, Andhra Pradesh, Karnataka, and Tamil Nadu</span>.
            From grand wedding palaces to intimate banquet halls, sprawling farm houses to elegant resorts, our curated
            collection of venues offers couples, families, and event planners access to premium spaces without the stress
            of endless searching. As a leading venue discovery platform, Velvet Venues connects you with beautifully
            appointed spaces designed to meet the diverse needs of every occasion.
          </p>

          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 font-display">
            Why Book Venues with Velvet Venues?
          </h3>
          <p className="text-gray-700 mb-6 font-body leading-relaxed">
            Our platform brings together verified wedding venues, banquet halls, resorts, hotels, and farm houses across
            South India. Compare amenities, capacity, pricing, and availability in one place — then book with confidence.
          </p>

          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 font-display">
            Popular Cities for Weddings & Events
          </h3>
          <p className="text-gray-700 mb-4 font-body leading-relaxed">
            Explore premium venues across twenty cities in four states. Each city offers a unique mix of wedding halls,
            banquet spaces, resorts, and outdoor venues suited for every celebration size.
          </p>
          <ul className="list-disc pl-6 mb-6 text-gray-700 font-body space-y-2">
            <li>
              <span className="text-orange-600 font-semibold">Telangana:</span> Hyderabad, Secunderabad, Warangal,
              Karimnagar, Khammam, Nizamabad
            </li>
            <li>
              <span className="text-orange-600 font-semibold">Andhra Pradesh:</span> Visakhapatnam, Vijayawada, Tirupati,
              Guntur, Rajahmundry, Kakinada
            </li>
            <li>
              <span className="text-orange-600 font-semibold">Karnataka:</span> Bengaluru, Mysuru, Mangaluru, Hubballi
            </li>
            <li>
              <span className="text-orange-600 font-semibold">Tamil Nadu:</span> Chennai, Coimbatore, Madurai,
              Tiruchirappalli
            </li>
          </ul>

          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 font-display">
            Browse Venues by City
          </h3>
          <div className="flex flex-wrap gap-2 mb-8">
            {cities.map((city) => {
              const slug = cityToSlug(city);
              return (
                <Link
                  key={city}
                  href={`/venues/${slug}`}
                  className="px-3 py-1.5 text-sm rounded-full border border-gray-300 bg-white text-gray-700 hover:border-orange-500 hover:text-orange-600 transition-colors font-body"
                >
                  {city}
                </Link>
              );
            })}
          </div>

          <p className="text-gray-700 font-body leading-relaxed">
            Our curated venues across{" "}
            <span className="text-orange-600 font-semibold">South India</span> are strategically located in these twenty
            cities to serve every kind of celebration. From an intimate engagement in Mysuru to a grand wedding in
            Hyderabad, a beachside reception in Visakhapatnam, or a corporate gala in Bengaluru — every venue on our{" "}
            <span className="text-orange-600 font-semibold">platform</span> is verified for quality and hospitality
            standards.
          </p>
        </div>
      </div>
    </section>
  );
}
