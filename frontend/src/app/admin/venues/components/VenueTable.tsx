"use client";

import { useEffect, useRef, useState } from "react";
import {
  Archive,
  Ban,
  CheckCircle2,
  Copy,
  Eye,
  MapPin,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Venue, VenueColumnKey, TableDensity } from "../types";
import { formatCurrency } from "../data";
import { StatusBadge } from "../../_components/ui/StatusBadge";
import { Button } from "../../_components/ui/Button";

interface VenueTableProps {
  venues: Venue[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  density: TableDensity;
  visibleColumns: Record<VenueColumnKey, boolean>;
  sortKey: string;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  onEdit: (venue: Venue) => void;
  onDelete: (venue: Venue) => void;
  onClone: (venue: Venue) => void;
  onApprove?: (venue: Venue) => void;
  onReject?: (venue: Venue) => void;
  onPublish?: (venue: Venue) => void;
  onUnpublish?: (venue: Venue) => void;
  onArchive?: (venue: Venue) => void;
  emptyAction?: () => void;
}

const columnLabels: Record<VenueColumnKey, string> = {
  profile: "Venue Name",
  venueId: "Venue ID",
  business: "Business Profile",
  category: "Category",
  city: "City",
  capacity: "Capacity",
  startingPrice: "Starting Price",
  bookings: "Bookings",
  rating: "Rating",
  approval: "Approval",
  status: "Status",
  actions: "Actions",
};

const approvalStyles: Record<string, string> = {
  approved: "bg-[#ECFDF3] text-[#16A34A] border-[#D3F8E1]",
  pending: "bg-[#FCFAF8] text-[#D97706] border-[#FDE9CB]",
  rejected: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
};

function ApprovalBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${approvalStyles[status] || ""}`}
    >
      {status}
    </span>
  );
}

export function VenueTable({
  venues,
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
  onClone,
  onApprove,
  onReject,
  onPublish,
  onUnpublish,
  onArchive,
  emptyAction,
}: VenueTableProps) {
  const router = useRouter();
  const allSelected = venues.length > 0 && selectedIds.length === venues.length;
  const rowPad = density === "compact" ? "py-2.5" : "py-4";

  if (venues.length === 0) {
    return (
      <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-6 py-16 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-[#C89B3C]/10 text-[#C89B3C] flex items-center justify-center mb-4">
          <MapPin className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-semibold text-[#111827]">No Venues Found</h3>
        <p className="text-sm text-[#6B7280] mt-1.5 max-w-md mx-auto">
          Venues will appear here once created. Adjust filters or create a new venue.
        </p>
        {emptyAction && (
          <div className="mt-5">
            <Button variant="primary" onClick={emptyAction}>
              Create Venue
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E8EAF0] rounded-[14px] shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1320px]">
          <thead className="sticky top-0 z-10 bg-[#FCFCFD] border-b border-[#E8EAF0]">
            <tr>
              <th className="px-4 py-3.5 w-12 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-[#D1D5DB] text-[#C89B3C] focus:ring-[#C89B3C]"
                  aria-label="Select all venues"
                />
              </th>
              {visibleColumns.profile && (
                <SortableTh label="Venue Name" active={sortKey === "name"} dir={sortDir} onClick={() => onSort("name")} />
              )}
              {visibleColumns.venueId && (
                <SortableTh label="Venue ID" active={sortKey === "venueId"} dir={sortDir} onClick={() => onSort("venueId")} />
              )}
              {visibleColumns.business && <Th>Business Profile</Th>}
              {visibleColumns.category && <Th>Category</Th>}
              {visibleColumns.city && (
                <SortableTh label="City" active={sortKey === "city"} dir={sortDir} onClick={() => onSort("city")} />
              )}
              {visibleColumns.capacity && (
                <SortableTh
                  label="Capacity"
                  active={sortKey === "maxGuests"}
                  dir={sortDir}
                  onClick={() => onSort("maxGuests")}
                />
              )}
              {visibleColumns.startingPrice && (
                <SortableTh
                  label="Starting Price"
                  active={sortKey === "startingPrice"}
                  dir={sortDir}
                  onClick={() => onSort("startingPrice")}
                />
              )}
              {visibleColumns.bookings && (
                <SortableTh
                  label="Bookings"
                  active={sortKey === "totalBookings"}
                  dir={sortDir}
                  onClick={() => onSort("totalBookings")}
                />
              )}
              {visibleColumns.rating && (
                <SortableTh label="Rating" active={sortKey === "rating"} dir={sortDir} onClick={() => onSort("rating")} />
              )}
              {visibleColumns.approval && <Th>Approval</Th>}
              {visibleColumns.status && <Th>Status</Th>}
              {visibleColumns.actions && <Th className="text-center">Actions</Th>}
            </tr>
          </thead>
          <tbody>
            {venues.map((venue, idx) => {
              const selected = selectedIds.includes(venue.id);
              return (
                <tr
                  key={venue.id}
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
                      onChange={() => onToggleSelect(venue.id)}
                      className="rounded border-[#D1D5DB] text-[#C89B3C] focus:ring-[#C89B3C]"
                      aria-label={`Select ${venue.name}`}
                    />
                  </td>
                  {visibleColumns.profile && (
                    <td className={`px-4 ${rowPad}`}>
                      <button
                        onClick={() => router.push(`/admin/venues/${venue.id}`)}
                        className="flex items-center gap-3 text-left group"
                      >
                        {venue.coverImage ? (
                          <img
                            src={venue.coverImage}
                            alt={venue.name}
                            className="w-10 h-10 rounded-[10px] object-cover shrink-0 border border-[#E8EAF0]"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C89B3C] to-[#B8862B] text-white text-sm font-semibold flex items-center justify-center shrink-0 shadow-sm">
                            {venue.initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#111827] group-hover:text-[#C89B3C] transition-colors truncate flex items-center gap-1.5">
                            {venue.name}
                            {venue.featured && <Star className="w-3.5 h-3.5 text-[#C89B3C] fill-current shrink-0" />}
                          </p>
                          <p className="text-xs text-[#9CA3AF] truncate">{venue.venueId}</p>
                        </div>
                      </button>
                    </td>
                  )}
                  {visibleColumns.venueId && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm font-medium text-[#4B5563]">{venue.venueId}</span>
                    </td>
                  )}
                  {visibleColumns.business && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm text-[#4B5563] truncate max-w-[180px] block">{venue.businessName}</span>
                    </td>
                  )}
                  {visibleColumns.category && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm text-[#4B5563]">{venue.category || "—"}</span>
                    </td>
                  )}
                  {visibleColumns.city && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm text-[#4B5563]">{venue.city}</span>
                    </td>
                  )}
                  {visibleColumns.capacity && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm text-[#4B5563]">{venue.maxGuests || "—"}</span>
                    </td>
                  )}
                  {visibleColumns.startingPrice && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm font-semibold text-[#111827]">
                        {formatCurrency(venue.startingPrice)}
                      </span>
                    </td>
                  )}
                  {visibleColumns.bookings && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm font-semibold text-[#111827]">{venue.totalBookings}</span>
                    </td>
                  )}
                  {visibleColumns.rating && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="inline-flex items-center gap-1 text-sm text-[#4B5563]">
                        {venue.rating > 0 ? (
                          <>
                            <Star className="w-3.5 h-3.5 text-[#C89B3C] fill-current" />
                            {venue.rating.toFixed(1)}
                          </>
                        ) : (
                          "—"
                        )}
                      </span>
                    </td>
                  )}
                  {visibleColumns.approval && (
                    <td className={`px-4 ${rowPad}`}>
                      <ApprovalBadge status={venue.approval} />
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td className={`px-4 ${rowPad}`}>
                      <StatusBadge
                        status={
                          (venue.status === "published"
                            ? "active"
                            : venue.status === "inactive" || venue.status === "archived"
                            ? "inactive"
                            : "pending") as "active" | "pending" | "inactive"
                        }
                      />
                    </td>
                  )}
                  {visibleColumns.actions && (
                    <td className={`px-4 ${rowPad} text-center`}>
                      <RowActions
                        venue={venue}
                        onView={() => router.push(`/admin/venues/${venue.id}`)}
                        onEdit={() => onEdit(venue)}
                        onDelete={() => onDelete(venue)}
                        onClone={() => onClone(venue)}
                        onApprove={() => onApprove?.(venue)}
                        onReject={() => onReject?.(venue)}
                        onPublish={() => onPublish?.(venue)}
                        onUnpublish={() => onUnpublish?.(venue)}
                        onArchive={() => onArchive?.(venue)}
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

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] ${className}`}>
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
  venue,
  onView,
  onEdit,
  onDelete,
  onClone,
  onApprove,
  onReject,
  onPublish,
  onUnpublish,
  onArchive,
}: {
  venue: Venue;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClone: () => void;
  onApprove: () => void;
  onReject: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onArchive: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
    { label: "Clone", icon: Copy, onClick: onClone },
    { label: "Approve", icon: CheckCircle2, onClick: onApprove, hidden: venue.approval === "approved" },
    { label: "Reject", icon: XCircle, onClick: onReject, hidden: venue.approval === "rejected" },
    { label: "Publish", icon: Upload, onClick: onPublish, hidden: venue.status === "published" },
    { label: "Unpublish", icon: Ban, onClick: onUnpublish, hidden: venue.status !== "published" },
    { label: "Archive", icon: Archive, onClick: onArchive, hidden: venue.status === "archived" },
    { label: "Delete", icon: Trash2, onClick: onDelete, danger: true },
  ].filter((item) => !item.hidden);

  return (
    <div className="relative inline-flex justify-center" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] transition-colors"
        aria-label={`Actions for ${venue.name}`}
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
                  item.danger ? "text-red-600 hover:bg-red-50" : "text-[#374151] hover:bg-[#F8F9FB]"
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
