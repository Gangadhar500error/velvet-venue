"use client";

import Link from "next/link";
import { ShieldX } from "lucide-react";

export function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center mb-4">
        <ShieldX className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-[#111827]">403 — Access Denied</h1>
      <p className="text-[#6B7280] mt-2 max-w-md">
        You do not have permission to view this page. Contact your administrator if you
        believe this is an error.
      </p>
      <Link
        href="/admin"
        className="mt-6 inline-flex h-10 items-center px-5 rounded-xl bg-[#C89B3C] text-white text-sm font-medium hover:bg-[#B8862B] transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
