"use client";

import {
  Receipt,
  FileCheck,
  Cog,
  MapPin,
  Tags,
  TrendingUp,
} from "lucide-react";
const features = [
  {
    icon: Receipt,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-50",
    title: "Billing",
    description:
      "Streamlined billing system with automated invoicing and multiple payment options for hassle-free transactions.",
  },
  {
    icon: FileCheck,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-50",
    title: "Documentation",
    description:
      "Complete documentation support for all your business needs including contracts, agreements, and legal paperwork.",
  },
  {
    icon: Cog,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-50",
    title: "Event Management",
    description:
      "Dedicated event management ensuring smooth day-to-day coordination of your venue and celebrations.",
  },
  {
    icon: MapPin,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-50",
    title: "Venues",
    description:
      "Premium venues in prime locations across India with elegant infrastructure and professional amenities.",
  },
  {
    icon: Tags,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-50",
    title: "Uniform Pricing",
    description:
      "Transparent and consistent pricing across all locations. No hidden fees, single invoice for all services.",
  },
  {
    icon: TrendingUp,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-50",
    title: "New Locations",
    description:
      "Rapidly growing network of venues, adding new cities and celebration spaces across India every month.",
  },
];

export default function AboutUs() {
  return (
    <section className="w-full bg-white py-10 lg:py-12">
      <div className="container-custom px-4 md:px-6 lg:px-8">
        {/* Single Row - 6 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="bg-white border border-[#ECE7E1] rounded-lg p-5 md:p-6 hover:border-[#C89B3C] hover:shadow-md transition-all duration-300"
              >
                {/* Mobile Layout - Icon and Heading Side by Side */}
                <div className="flex md:flex-col items-start md:items-start gap-3 md:gap-0 mb-3 md:mb-4">
                  <div className={`w-10 h-10 md:w-12 md:h-12 ${feature.iconBg} rounded-lg flex items-center justify-center shrink-0`}>
                    <IconComponent className={`h-5 w-5 md:h-6 md:w-6 ${feature.iconColor}`} strokeWidth={2} />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-gray-800 md:mb-2 md:inline-block border-b-2 border-gray-500 pb-1">
                    {feature.title}
                  </h3>
                </div>
                
                {/* Description - Below on both mobile and desktop */}
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
