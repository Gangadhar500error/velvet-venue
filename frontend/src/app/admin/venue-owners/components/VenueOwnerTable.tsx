"use client";

import { useEffect, useRef, useState } from "react";
import {
  Ban,
  Building2,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { VenueOwner, VenueOwnerColumnKey, TableDensity } from "../types";
import { formatDate } from "../data";
import { StatusBadge, VerificationBadge } from "../../_components/ui/StatusBadge";
import { Button } from "../../_components/ui/Button";

interface VenueOwnerTableProps {
  owners: VenueOwner[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  density: TableDensity;
  visibleColumns: Record<VenueOwnerColumnKey, boolean>;
  sortKey: string;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  onEdit: (owner: VenueOwner) => void;
  onDelete: (owner: VenueOwner) => void;
  onToggleStatus?: (owner: VenueOwner) => void;
  emptyAction?: () => void;
}

const columnLabels: Record<VenueOwnerColumnKey, string> = {
  profile: "Owner",
  ownerId: "Owner ID",
  email: "Email",
  mobile: "Phone",
  city: "City",
  businesses: "Assigned Businesses",
  verification: "Verification",
  status: "Status",
  registrationDate: "Registered Date",
  actions: "Actions",
};

export function VenueOwnerTable({
  owners,
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
  emptyAction,
}: VenueOwnerTableProps) {
  const router = useRouter();
  const allSelected = owners.length > 0 && selectedIds.length === owners.length;
  const rowPad = density === "compact" ? "py-2.5" : "py-4";

  if (owners.length === 0) {
    return (
      <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-6 py-16 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-[#C89B3C]/10 text-[#C89B3C] flex items-center justify-center mb-4">
          <Building2 className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-semibold text-[#111827]">No Venue Owners Found</h3>
        <p className="text-sm text-[#6B7280] mt-1.5 max-w-md mx-auto">
          Venue owners will appear here after registration. Adjust filters or create a new venue owner.
        </p>
        {emptyAction && (
          <div className="mt-5">
            <Button variant="primary" onClick={emptyAction}>
              Create Venue Owner
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E8EAF0] rounded-[14px] shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <thead className="sticky top-0 z-10 bg-[#FCFCFD] border-b border-[#E8EAF0]">
            <tr>
              <th className="px-4 py-3.5 w-12 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-[#D1D5DB] text-[#C89B3C] focus:ring-[#C89B3C]"
                  aria-label="Select all venue owners"
                />
              </th>
              {visibleColumns.profile && (
                <SortableTh
                  label="Owner"
                  active={sortKey === "name"}
                  dir={sortDir}
                  onClick={() => onSort("name")}
                />
              )}
              {visibleColumns.ownerId && (
                <SortableTh
                  label="Owner ID"
                  active={sortKey === "ownerId"}
                  dir={sortDir}
                  onClick={() => onSort("ownerId")}
                />
              )}
              {visibleColumns.email && <Th>Email</Th>}
              {visibleColumns.mobile && <Th>Phone</Th>}
              {visibleColumns.city && (
                <SortableTh
                  label="City"
                  active={sortKey === "city"}
                  dir={sortDir}
                  onClick={() => onSort("city")}
                />
              )}
              {visibleColumns.businesses && (
                <SortableTh
                  label="Assigned Businesses"
                  active={sortKey === "assignedBusinesses"}
                  dir={sortDir}
                  onClick={() => onSort("assignedBusinesses")}
                />
              )}
              {visibleColumns.verification && <Th>Verification</Th>}
              {visibleColumns.status && <Th>Status</Th>}
              {visibleColumns.registrationDate && (
                <SortableTh
                  label="Registered Date"
                  active={sortKey === "registrationDate"}
                  dir={sortDir}
                  onClick={() => onSort("registrationDate")}
                />
              )}
              {visibleColumns.actions && <Th className="text-center">Actions</Th>}
            </tr>
          </thead>
          <tbody>
            {owners.map((owner, idx) => {
              const selected = selectedIds.includes(owner.id);
              return (
                <tr
                  key={owner.id}
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
                      onChange={() => onToggleSelect(owner.id)}
                      className="rounded border-[#D1D5DB] text-[#C89B3C] focus:ring-[#C89B3C]"
                      aria-label={`Select ${owner.name}`}
                    />
                  </td>
                  {visibleColumns.profile && (
                    <td className={`px-4 ${rowPad}`}>
                      <button
                        onClick={() => router.push(`/admin/venue-owners/${owner.id}`)}
                        className="flex items-center gap-3 text-left group"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C89B3C] to-[#B8862B] text-white text-sm font-semibold flex items-center justify-center shrink-0 shadow-sm">
                          {owner.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#111827] group-hover:text-[#C89B3C] transition-colors truncate">
                            {owner.name}
                          </p>
                          <p className="text-xs text-[#9CA3AF] truncate">{owner.ownerId}</p>
                        </div>
                      </button>
                    </td>
                  )}
                  {visibleColumns.ownerId && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm font-medium text-[#4B5563]">{owner.ownerId}</span>
                    </td>
                  )}
                  {visibleColumns.email && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm text-[#4B5563] truncate max-w-[200px] block">
                        {owner.email}
                      </span>
                    </td>
                  )}
                  {visibleColumns.mobile && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm text-[#4B5563] whitespace-nowrap">{owner.phone}</span>
                    </td>
                  )}
                  {visibleColumns.city && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm text-[#4B5563]">{owner.city}</span>
                    </td>
                  )}
                  {visibleColumns.businesses && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm font-semibold text-[#111827]">
                        {owner.assignedBusinesses}
                      </span>
                    </td>
                  )}
                  {visibleColumns.verification && (
                    <td className={`px-4 ${rowPad}`}>
                      <VerificationBadge status={owner.verification} />
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td className={`px-4 ${rowPad}`}>
                      <StatusBadge status={owner.status} />
                    </td>
                  )}
                  {visibleColumns.registrationDate && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm text-[#4B5563]">
                        {formatDate(owner.registrationDate)}
                      </span>
                    </td>
                  )}
                  {visibleColumns.actions && (
                    <td className={`px-4 ${rowPad} text-center`}>
                      <RowActions
                        owner={owner}
                        onView={() => router.push(`/admin/venue-owners/${owner.id}`)}
                        onEdit={() => onEdit(owner)}
                        onDelete={() => onDelete(owner)}
                        onToggleStatus={() => onToggleStatus?.(owner)}
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
  owner,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  owner: VenueOwner;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = owner.status === "active";

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
        aria-label={`Actions for ${owner.name}`}
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
