"use client";

export default function ImageScroller() {
  const bgImage = "/assets/valvetbg.png";
  const overlay = "rgba(21,22,28,0.15)";

  return (
    <div className="relative isolate mb-10 h-[50vh] overflow-x-hidden bg-white text-white lg:h-[80vh]">
      {/* BACKGROUND IMAGE CONTAINER (WITH SPACING) */}
      <div className="absolute left-6 right-6 top-0 z-0 h-full md:left-10 md:right-10">
        <div className="absolute inset-0 overflow-hidden rounded-[12px]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: overlay }}
          />
        </div>
      </div>
    </div>
  );
}
