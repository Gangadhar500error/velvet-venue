"use client";

import { useEffect, useRef, useState } from "react";
import {
  Ban,
  Copy,
  Eye,
  KeyRound,
  Mail,
  MoreHorizontal,
  Pencil,
  Receipt,
  CalendarDays,
  Trash2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Customer, CustomerColumnKey, TableDensity } from "../types";
import { formatCurrency, formatDate, formatDateTime } from "../data";
import { StatusBadge, VerificationBadge } from "../../_components/ui/StatusBadge";
import { Button } from "../../_components/ui/Button";

interface CustomerTableProps {
  customers: Customer[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  density: TableDensity;
  visibleColumns: Record<CustomerColumnKey, boolean>;
  sortKey: string;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onBlock: (customer: Customer) => void;
  emptyAction?: () => void;
}

const columnLabels: Partial<Record<CustomerColumnKey | string, string>> = {
  profile: "Customer",
  customerId: "Customer ID",
  mobile: "Mobile",
  email: "Email",
  city: "City",
  bookings: "Bookings",
  totalSpend: "Total Spend",
  registrationDate: "Registration Date",
  verification: "Verification",
  status: "Status",
  // lastLogin: "Last Login",
  actions: "Actions",
};

export function CustomerTable({
  customers,
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
  onBlock,
  emptyAction,
}: CustomerTableProps) {
  const router = useRouter();
  const allSelected = customers.length > 0 && selectedIds.length === customers.length;
  const rowPad = density === "compact" ? "py-2.5" : "py-4";

  if (customers.length === 0) {
    return (
      <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-6 py-16 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-[#C89B3C]/10 text-[#C89B3C] flex items-center justify-center mb-4">
          <Users className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-semibold text-[#111827]">No Customers Found</h3>
        <p className="text-sm text-[#6B7280] mt-1.5 max-w-md mx-auto">
          Customers will appear here after registration. Adjust filters or create a new customer.
        </p>
        {emptyAction && (
          <div className="mt-5">
            <Button variant="primary" onClick={emptyAction}>
              Create Customer
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
                  aria-label="Select all customers"
                />
              </th>
              {visibleColumns.profile && (
                <SortableTh
                  label="Customer"
                  active={sortKey === "name"}
                  dir={sortDir}
                  onClick={() => onSort("name")}
                />
              )}
              {visibleColumns.customerId && (
                <SortableTh
                  label="Customer ID"
                  active={sortKey === "customerId"}
                  dir={sortDir}
                  onClick={() => onSort("customerId")}
                />
              )}
              {visibleColumns.mobile && <Th>Mobile</Th>}
              {visibleColumns.email && <Th>Email</Th>}
              {visibleColumns.city && (
                <SortableTh
                  label="City"
                  active={sortKey === "city"}
                  dir={sortDir}
                  onClick={() => onSort("city")}
                />
              )}
              {visibleColumns.bookings && (
                <SortableTh
                  label="Bookings"
                  active={sortKey === "bookings"}
                  dir={sortDir}
                  onClick={() => onSort("bookings")}
                />
              )}
              {visibleColumns.totalSpend && (
                <SortableTh
                  label="Total Spend"
                  active={sortKey === "totalSpend"}
                  dir={sortDir}
                  onClick={() => onSort("totalSpend")}
                />
              )}
              {visibleColumns.registrationDate && (
                <SortableTh
                  label="Registration Date"
                  active={sortKey === "registrationDate"}
                  dir={sortDir}
                  onClick={() => onSort("registrationDate")}
                />
              )}
              {visibleColumns.verification && <Th>Verification</Th>}
              {visibleColumns.status && <Th>Status</Th>}
              {/* {visibleColumns.lastLogin && <Th>Last Login</Th>} */}
              {visibleColumns.actions && <Th className="text-center">Actions</Th>}
            </tr>
          </thead>
          <tbody>
            {customers.map((customer, idx) => {
              const selected = selectedIds.includes(customer.id);
              return (
                <tr
                  key={customer.id}
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
                      onChange={() => onToggleSelect(customer.id)}
                      className="rounded border-[#D1D5DB] text-[#C89B3C] focus:ring-[#C89B3C]"
                      aria-label={`Select ${customer.name}`}
                    />
                  </td>
                  {visibleColumns.profile && (
                    <td className={`px-4 ${rowPad}`}>
                      <button
                        onClick={() => router.push(`/admin/customers/${customer.id}`)}
                        className="flex items-center gap-3 text-left group"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C89B3C] to-[#B8862B] text-white text-sm font-semibold flex items-center justify-center shrink-0 shadow-sm">
                          {customer.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#111827] group-hover:text-[#C89B3C] transition-colors truncate">
                            {customer.name}
                          </p>
                          <p className="text-xs text-[#9CA3AF] truncate">{customer.customerId}</p>
                        </div>
                      </button>
                    </td>
                  )}
                  {visibleColumns.customerId && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm font-medium text-[#4B5563]">{customer.customerId}</span>
                    </td>
                  )}
                  {visibleColumns.mobile && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm text-[#4B5563] whitespace-nowrap">{customer.phone}</span>
                    </td>
                  )}
                  {visibleColumns.email && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm text-[#4B5563] truncate max-w-[200px] block">
                        {customer.email}
                      </span>
                    </td>
                  )}
                  {visibleColumns.city && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm text-[#4B5563]">{customer.city}</span>
                    </td>
                  )}
                  {visibleColumns.bookings && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm font-semibold text-[#111827]">{customer.bookings}</span>
                    </td>
                  )}
                  {visibleColumns.totalSpend && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm font-semibold text-[#111827]">
                        {formatCurrency(customer.totalSpend)}
                      </span>
                    </td>
                  )}
                  {visibleColumns.registrationDate && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm text-[#4B5563]">
                        {formatDate(customer.registrationDate)}
                      </span>
                    </td>
                  )}
                  {visibleColumns.verification && (
                    <td className={`px-4 ${rowPad}`}>
                      <VerificationBadge status={customer.verification} />
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td className={`px-4 ${rowPad}`}>
                      <StatusBadge status={customer.status} />
                    </td>
                  )}
                  {/* {visibleColumns.lastLogin && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm text-[#6B7280] whitespace-nowrap">
                        {formatDateTime(customer.lastLogin)}
                      </span>
                    </td>
                  )} */}
                  {visibleColumns.actions && (
                    <td className={`px-4 ${rowPad} text-center`}>
                      <RowActions
                        customer={customer}
                        onView={() => router.push(`/admin/customers/${customer.id}`)}
                        onEdit={() => onEdit(customer)}
                        onDelete={() => onDelete(customer)}
                        onBlock={() => onBlock(customer)}
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
  customer,
  onView,
  onEdit,
  onDelete,
  onBlock,
}: {
  customer: Customer;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onBlock: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isBlocked = customer.status === "blocked";

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
      label: "Clone Customer",
      icon: Copy,
      onClick: () => router.push(`/admin/customers/create?clone=${customer.id}`),
    },
    {
      label: "View Bookings",
      icon: CalendarDays,
      onClick: () => router.push(`/admin/customers/${customer.id}#customer-bookings`),
    },
    {
      label: "View Transactions",
      icon: Receipt,
      onClick: () => router.push(`/admin/customers/${customer.id}#customer-invoices`),
    },
    // { label: "Send Email", icon: Mail, onClick: () => {} },
    // { label: "Reset Password", icon: KeyRound, onClick: () => {} },
    {
      label: isBlocked ? "Unblock" : "Block",
      icon: Ban,
      onClick: onBlock,
      danger: !isBlocked,
    },
    { label: "Delete", icon: Trash2, onClick: onDelete, danger: true },
  ];

  return (
    <div className="relative inline-flex justify-center" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-lg hover:bg-[#F3F4F6] text-[#6B7280] transition-colors"
        aria-label={`Actions for ${customer.name}`}
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
