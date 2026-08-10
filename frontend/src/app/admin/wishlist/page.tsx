"use client";

import { Heart } from "lucide-react";
import { PageHeader } from "../_components/ui/PageHeader";

export default function WishlistPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Wishlist"
        subtitle="Venues you have saved for later."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Wishlist" }]}
      />
      <div className="rounded-[14px] border border-[#E8EAF0] bg-white p-12 text-center shadow-sm">
        <Heart className="w-10 h-10 text-[#C89B3C] mx-auto mb-3" />
        <p className="text-sm font-semibold text-[#111827]">Your wishlist is empty</p>
        <p className="text-[12px] text-[#6B7280] mt-1">
          Browse venues and save your favorites here.
        </p>
      </div>
    </div>
  );
}
