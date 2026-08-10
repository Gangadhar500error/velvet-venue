"use client";

const pricingPlans = [
  {
    id: 1,
    title: "Party Hall",
    description: "No advance booking fee required.",
    features: [
      { text: "Half Day Slot", price: "Starts from ₹15,000", type: "diamond" },
      { text: "Full Day Slot", price: "Starts from ₹25,000", type: "diamond" },
      { text: "Decoration Package", price: "Starts from ₹8,000", type: "diamond" },
      { text: "Catering (per plate)", price: "Starts from ₹450", type: "diamond" },
    ],
    buttonText: "Book On Demand →",
    buttonStyle: "solid",
    borderStyle: "teal",
  },
  {
    id: 2,
    title: "Banquet Hall",
    price: "Starts from ₹45,000",
    features: [
      { text: "Full day venue access", type: "checkmark" },
      { text: "Seating for up to 300 guests", type: "checkmark" },
      { text: "₹5,000 décor credits included", type: "diamond" },
      { text: "Extended hours available + ₹5,000", type: "diamond" },
    ],
    buttonText: "Book Now →",
    buttonStyle: "outline",
  },
  {
    id: 3,
    title: "Farm House",
    price: "Starts from ₹75,000",
    features: [
      { text: "Private lawn & poolside access", type: "checkmark" },
      { text: "Your own dedicated venue", type: "checkmark" },
      { text: "₹10,000 catering credits", type: "checkmark" },
      { text: "Overnight stay upgrade + ₹15,000", type: "diamond" },
    ],
    buttonText: "Book Now →",
    buttonStyle: "outline",
  },
  {
    id: 4,
    title: "Resort & Hotel",
    price: "Starts from ₹1,25,000",
    features: [
      { text: "Multi-day venue access", type: "checkmark" },
      { text: "Your own private banquet & rooms", type: "checkmark" },
      { text: "₹20,000 hospitality credits", type: "checkmark" },
      { text: "Various packages for 100-1000 guests", type: "diamond" },
    ],
    additionalInfo: "♦ Limited dates remaining in Hyderabad",
    buttonText: "Book Now →",
    buttonStyle: "outline",
  },
];

export default function Pricing() {
  return (
    <section className="relative w-full bg-white lg:pb-14 pb-5 overflow-hidden">
      {/* Dotted Grid Background Pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, #d1d5db 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="container-custom relative z-10 px-4 md:px-6 lg:px-8">
        {/* Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-12 lg:mb-16">
          {/* Left Text Block */}
          <div className="flex items-center">
            <p className="text-lg md:text-xl text-gray-900 leading-relaxed font-body max-w-lg">
              Velvet Venues offers stunning venue solutions designed for modern celebrations. Our{" "}
              <span className="underline decoration-[#008385] decoration-2 underline-offset-3">
                transparent
              </span>{" "}
              pricing is simple and straightforward, perfect for every occasion.
            </p>
          </div>

          {/* Right Text Block */}
          <div className="flex items-center lg:justify-end">
            <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-[1.1] font-display">
              No hidden charges ever.
            </h2>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg p-6 md:p-7 transition-all hover:shadow-md flex flex-col ${
                plan.borderStyle === "teal"
                  ? "border-2 border-[#008385]"
                  : "border border-gray-200"
              }`}
            >
              {/* Card Title */}
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 font-display">
                {plan.title}
              </h3>

              {/* Description or Price */}
              {plan.description ? (
                <p className="text-sm text-gray-600 mb-5 font-body">{plan.description}</p>
              ) : plan.price ? (
                <p className="text-xl md:text-2xl font-bold text-[#008385] mb-5 font-body">
                  {plan.price}
                </p>
              ) : null}

              {/* Features List */}
              <ul className="flex-1 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 mb-2 last:mb-0">
                    {feature.type === "checkmark" ? (
                      <span className="text-[#008385] text-base font-bold mt-0.5 flex-shrink-0">✓</span>
                    ) : (
                      <span className="text-gray-900 text-base font-bold mt-0.5 flex-shrink-0">♦</span>
                    )}
                    <span className="text-gray-900 text-sm leading-normal font-body flex-1">
                      {feature.text}
                      {"price" in feature && feature.price && (
                        <span className="text-[#008385] font-bold ml-1">
                          {" "}{feature.price}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Additional Info */}
              {plan.additionalInfo && (
                <p className="text-sm text-[#008385] mb-6 font-body">
                  <span className="text-gray-900 font-bold">♦</span> {plan.additionalInfo}
                </p>
              )}

              {/* Button */}
              <button
                className={`w-full py-2.5 px-4 rounded-md font-semibold text-sm transition-colors duration-200 font-body mt-auto ${
                  plan.buttonStyle === "solid"
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "bg-white text-gray-900 border border-gray-900 hover:bg-gray-50"
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
