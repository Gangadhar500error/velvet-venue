"use client";

import { Star } from "lucide-react";
import { PageHeader } from "../_components/ui/PageHeader";

export default function ReviewsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Reviews"
        subtitle="Your venue reviews and ratings."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Reviews" }]}
      />
      <div className="rounded-[14px] border border-[#E8EAF0] bg-white p-12 text-center shadow-sm">
        <Star className="w-10 h-10 text-[#C89B3C] mx-auto mb-3" />
        <p className="text-sm font-semibold text-[#111827]">No reviews yet</p>
        <p className="text-[12px] text-[#6B7280] mt-1">
          Reviews you write after events will appear here.
        </p>
      </div>
    </div>
  );
}
