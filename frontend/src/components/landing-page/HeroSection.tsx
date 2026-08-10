"use client";

import Image from "next/image";
import HeroBookingSearch from "../HeroBookingSearch";

const HERO_BG = "/assets/valvetbg.png";

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[400px] md:min-h-[540px] lg:min-h-[600px] overflow-hidden">
      <Image
        src={HERO_BG}
        alt=""
        fill
        priority
        className="object-cover object-center z-0"
        sizes="100vw"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] min-h-[400px] md:min-h-[540px] lg:min-h-[600px] items-end md:items-center justify-center md:justify-end px-4 pb-2 pt-8 md:px-6 md:py-10 lg:px-8">
        <HeroBookingSearch />
      </div>
    </section>
  );
}
