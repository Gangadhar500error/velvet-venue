"use client";

import { Suspense } from "react";
import { BookingCalendarWorkspace } from "./components/BookingCalendarWorkspace";

function CalendarFallback() {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="h-16 rounded-[14px] bg-[#F3F4F6] animate-pulse" />
      <div className="h-24 rounded-[14px] bg-[#F3F4F6] animate-pulse" />
      <div className="h-96 rounded-[14px] bg-[#F3F4F6] animate-pulse" />
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarFallback />}>
      <BookingCalendarWorkspace />
    </Suspense>
  );
}
