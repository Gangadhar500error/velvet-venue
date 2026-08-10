"use client";

import { CustomerStatus, VerificationStatus } from "../../customers/types";

const statusStyles: Record<CustomerStatus, string> = {
  active: "bg-[#ECFDF3] text-[#16A34A] border-[#ECFDF3]",
  pending: "bg-[#FCFAF8] text-[#F59E0B] border-[#FCFAF8]",
  blocked: "bg-[#FEF2F2] text-[#DC2626] border-[#FEF2F2]",
  inactive: "bg-[#F3F4F6] text-[#4B5563] border-[#E8EAF0]",
};

const verificationStyles: Record<VerificationStatus, string> = {
  verified: "bg-[#ECFDF3] text-[#16A34A] border-[#ECFDF3]",
  pending: "bg-[#FCFAF8] text-[#F59E0B] border-[#FCFAF8]",
  rejected: "bg-[#FEF2F2] text-[#DC2626] border-[#FEF2F2]",
};

export function StatusBadge({ status }: { status: CustomerStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${verificationStyles[status]}`}
    >
      {status}
    </span>
  );
}
