"use client";

import { useEffect, useRef, useState } from "react";
import {
  Ban,
  Briefcase,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserCheck,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { BusinessProfile, BusinessColumnKey, TableDensity } from "../types";
import { formatDate } from "../data";
import { StatusBadge, VerificationBadge } from "../../_components/ui/StatusBadge";
import { Button } from "../../_components/ui/Button";

interface BusinessProfileTableProps {
  businesses: BusinessProfile[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  density: TableDensity;
  visibleColumns: Record<BusinessColumnKey, boolean>;
  sortKey: string;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  onEdit: (business: BusinessProfile) => void;
  onDelete: (business: BusinessProfile) => void;
  onToggleStatus?: (business: BusinessProfile) => void;
  onApprove?: (business: BusinessProfile) => void;
  onReject?: (business: BusinessProfile) => void;
  emptyAction?: () => void;
}

const columnLabels: Record<BusinessColumnKey, string> = {
  profile: "Business Name",
  businessId: "Business ID",
  owner: "Venue Owner",
  businessType: "Business Type",
  city: "City",
  venues: "Total Venues",
  verification: "Verification",
  status: "Status",
  createdAt: "Created Date",
  actions: "Actions",
};

export function BusinessProfileTable({
  businesses,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  density,
  visibleColumns,
  sortKey,
  sortDir,
  onSort,
  onEdit,
  onDelete,
  onToggleStatus,
  onApprove,
  onReject,
  emptyAction,
}: BusinessProfileTableProps) {
  const router = useRouter();
  const allSelected = businesses.length > 0 && selectedIds.length === businesses.length;
  const rowPad = density === "compact" ? "py-2.5" : "py-4";

  if (businesses.length === 0) {
    return (
      <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-6 py-16 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-[#C89B3C]/10 text-[#C89B3C] flex items-center justify-center mb-4">
          <Briefcase className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-semibold text-[#111827]">No Business Profiles Found</h3>
        <p className="text-sm text-[#6B7280] mt-1.5 max-w-md mx-auto">
          Business profiles will appear here once created. Adjust filters or create a new business profile.
        </p>
        {emptyAction && (
          <div className="mt-5">
            <Button variant="primary" onClick={emptyAction}>
              Create Business Profile
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E8EAF0] rounded-[14px] shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1240px]">
          <thead className="sticky top-0 z-10 bg-[#FCFCFD] border-b border-[#E8EAF0]">
            <tr>
              <th className="px-4 py-3.5 w-12 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-[#D1D5DB] text-[#C89B3C] focus:ring-[#C89B3C]"
                  aria-label="Select all business profiles"
                />
              </th>
              {visibleColumns.profile && (
                <SortableTh
                  label="Business Name"
                  active={sortKey === "businessName"}
                  dir={sortDir}
                  onClick={() => onSort("businessName")}
                />
              )}
              {visibleColumns.businessId && (
                <SortableTh
                  label="Business ID"
                  active={sortKey === "businessId"}
                  dir={sortDir}
                  onClick={() => onSort("businessId")}
                />
              )}
              {visibleColumns.owner && <Th>Venue Owner</Th>}
              {visibleColumns.businessType && <Th>Business Type</Th>}
              {visibleColumns.city && (
                <SortableTh
                  label="City"
                  active={sortKey === "city"}
                  dir={sortDir}
                  onClick={() => onSort("city")}
                />
              )}
              {visibleColumns.venues && (
                <SortableTh
                  label="Total Venues"
                  active={sortKey === "totalVenues"}
                  dir={sortDir}
                  onClick={() => onSort("totalVenues")}
                />
              )}
              {visibleColumns.verification && <Th>Verification</Th>}
              {visibleColumns.status && <Th>Status</Th>}
              {visibleColumns.createdAt && (
                <SortableTh
                  label="Created Date"
                  active={sortKey === "createdAt"}
                  dir={sortDir}
                  onClick={() => onSort("createdAt")}
                />
              )}
              {visibleColumns.actions && <Th className="text-center">Actions</Th>}
            </tr>
          </thead>
          <tbody>
            {businesses.map((business, idx) => {
              const selected = selectedIds.includes(business.id);
              return (
                <tr
                  key={business.id}
                  className={`
                    border-b border-[#F3F4F6] transition-colors
                    hover:bg-[#FFF3EB]
                    ${selected ? "bg-[#FFF3EB]" : idx % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white"}
                  `}
                >
                  <td className={`px-4 ${rowPad}`}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleSelect(business.id)}
                      className="rounded border-[#D1D5DB] text-[#C89B3C] focus:ring-[#C89B3C]"
                      aria-label={`Select ${business.businessName}`}
                    />
                  </td>
                  {visibleColumns.profile && (
                    <td className={`px-4 ${rowPad}`}>
                      <button
                        onClick={() => router.push(`/admin/business-profile/${business.id}`)}
                        className="flex items-center gap-3 text-left group"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C89B3C] to-[#B8862B] text-white text-sm font-semibold flex items-center justify-center shrink-0 shadow-sm">
                          {business.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#111827] group-hover:text-[#C89B3C] transition-colors truncate">
                            {business.businessName}
                          </p>
                          <p className="text-xs text-[#9CA3AF] truncate">{business.businessId}</p>
                        </div>
                      </button>
                    </td>
                  )}
                  {visibleColumns.businessId && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm font-medium text-[#4B5563]">{business.businessId}</span>
                    </td>
                  )}
                  {visibleColumns.owner && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm text-[#4B5563] truncate max-w-[180px] block">
                        {business.ownerName}
                      </span>
                    </td>
                  )}
                  {visibleColumns.businessType && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm text-[#4B5563]">{business.businessType || "—"}</span>
                    </td>
                  )}
                  {visibleColumns.city && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm text-[#4B5563]">{business.city}</span>
                    </td>
                  )}
                  {visibleColumns.venues && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm font-semibold text-[#111827]">{business.totalVenues}</span>
                    </td>
                  )}
                  {visibleColumns.verification && (
                    <td className={`px-4 ${rowPad}`}>
                      <VerificationBadge status={business.verification} />
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td className={`px-4 ${rowPad}`}>
                      <StatusBadge status={business.status} />
                    </td>
                  )}
                  {visibleColumns.createdAt && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm text-[#4B5563]">{formatDate(business.createdAt)}</span>
                    </td>
                  )}
                  {visibleColumns.actions && (
                    <td className={`px-4 ${rowPad} text-center`}>
                      <RowActions
                        business={business}
                        onView={() => router.push(`/admin/business-profile/${business.id}`)}
                        onEdit={() => onEdit(business)}
                        onDelete={() => onDelete(business)}
                        onToggleStatus={() => onToggleStatus?.(business)}
                        onApprove={() => onApprove?.(business)}
                        onReject={() => onReject?.(business)}
                      />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] ${className}`}
    >
      {children}
    </th>
  );
}

function SortableTh({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th className="px-4 py-3.5 text-left">
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] hover:text-[#C89B3C] transition-colors"
      >
        {label}
        <span className={`text-[10px] ${active ? "text-[#C89B3C]" : "text-[#D1D5DB]"}`}>
          {active ? (dir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );
}

function RowActions({
  business,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onApprove,
  onReject,
}: {
  business: BusinessProfile;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = business.status === "active";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const items = [
    { label: "View", icon: Eye, onClick: onView },
    { label: "Edit", icon: Pencil, onClick: onEdit },
    { label: "Approve", icon: CheckCircle2, onClick: onApprove },
    { label: "Reject", icon: XCircle, onClick: onReject },
    {
      label: isActive ? "Deactivate" : "Activate",
      icon: isActive ? Ban : UserCheck,
      onClick: onToggleStatus,
    },
    { label: "Delete", icon: Trash2, onClick: onDelete, danger: true },
  ];

  return (
    <div className="relative inline-flex justify-center" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] transition-colors"
        aria-label={`Actions for ${business.businessName}`}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-[#E8EAF0] rounded-xl shadow-xl z-20 py-1.5 overflow-hidden">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${
                  item.danger
                    ? "text-red-600 hover:bg-red-50"
                    : "text-[#374151] hover:bg-[#F8F9FB]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { columnLabels };
