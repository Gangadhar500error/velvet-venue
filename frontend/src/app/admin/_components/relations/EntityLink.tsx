"use client";

import Link from "next/link";
import type { ReactNode } from "react";

const linkCls = "text-[#C89B3C] hover:underline font-medium";
const mutedCls = "text-[#4B5563]";

export function EntityLink({
  href,
  children,
  className,
}: {
  href?: string | null;
  children: ReactNode;
  className?: string;
}) {
  if (!href) {
    return <span className={className || mutedCls}>{children || "—"}</span>;
  }
  return (
    <Link href={href} className={className || linkCls}>
      {children}
    </Link>
  );
}

export const entityHref = {
  booking: (id: string) => `/admin/bookings/${id}`,
  customer: (id: string) => `/admin/customers/${id}`,
  venue: (id: string) => `/admin/venues/${id}`,
  business: (id: string) => `/admin/business-profile/${id}`,
  owner: (id: string) => `/admin/venue-owners/${id}`,
  invoice: (invoiceNo: string) =>
    `/admin/invoices/${encodeURIComponent(invoiceNo)}`,
  transaction: (txnId: string) =>
    `/admin/transactions/${encodeURIComponent(txnId)}`,
};
