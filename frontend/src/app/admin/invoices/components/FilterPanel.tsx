"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Filter, RotateCcw, Save, X } from "lucide-react";
import { Button } from "../../_components/ui/Button";
import { useDemoStore } from "../../store/demoStore";
import type { InvoiceFilters } from "../types";

interface FilterPanelProps {
  open: boolean;
  filters: InvoiceFilters;
  onChange: (key: keyof InvoiceFilters, value: string) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
  onSave?: () => void;
  activeCount?: number;
}

const inputClass =
  "w-full h-10 px-3 rounded-[10px] border border-[#E8EAF0] bg-[#FCFCFD] text-sm text-[#111827] outline-none focus:bg-white focus:ring-2 focus:ring-[#C89B3C]/20 focus:border-[#C89B3C]";

export function FilterPanel({
  open,
  filters,
  onChange,
  onApply,
  onReset,
  onClose,
  onSave,
  activeCount = 0,
}: FilterPanelProps) {
  const businesses = useDemoStore((s) => s.businesses);
  const venues = useDemoStore((s) => s.venues);
  const vendors = useDemoStore((s) => s.vendors);
  const customers = useDemoStore((s) => s.customers);

  const businessOptions = useMemo(
    () =>
      businesses
        .filter((b) => String(b.status || "").toLowerCase() !== "inactive")
        .map((b) => ({ id: b.businessId, name: b.businessName })),
    [businesses]
  );
  const venueOptions = useMemo(
    () => venues.map((v) => ({ id: v.venueId, name: v.name })),
    [venues]
  );
  const ownerOptions = useMemo(
    () =>
      vendors.map((o) => ({
        id: o.id || o.ownerId,
        name: o.name || "Owner",
      })),
    [vendors]
  );
  const customerOptions = useMemo(
    () => customers.map((c) => ({ id: c.id || c.customerId, name: c.name })),
    [customers]
  );

  const showCustomDates = filters.datePreset === "custom" || !filters.datePreset;

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="overflow-hidden"
        >
          <div className="bg-white border border-[#E8EAF0] rounded-[14px] shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#FFF3EB] text-[#C89B3C] flex items-center justify-center">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#111827]">Invoice Filters</p>
                  <p className="text-xs text-[#9CA3AF]">
                    {activeCount > 0
                      ? `${activeCount} active filter(s)`
                      : "Narrow invoices by finance fields"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[#F8F9FB] text-[#6B7280]"
                aria-label="Close filters"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <SelectField
                label="Invoice Status"
                value={filters.invoiceStatus}
                onChange={(v) => onChange("invoiceStatus", v)}
                options={[
                  { value: "", label: "All Status" },
                  { value: "paid", label: "Paid" },
                  { value: "partial", label: "Partial" },
                  { value: "pending", label: "Pending" },
                  { value: "cancelled", label: "Cancelled" },
                  { value: "refunded", label: "Refunded" },
                ]}
              />
              <SelectField
                label="Date Range"
                value={filters.datePreset}
                onChange={(v) => onChange("datePreset", v)}
                options={[
                  { value: "", label: "All Dates" },
                  { value: "today", label: "Today" },
                  { value: "this_week", label: "This Week" },
                  { value: "this_month", label: "This Month" },
                  { value: "custom", label: "Custom" },
                ]}
              />
              {showCustomDates && (
                <>
                  <Field label="Date From">
                    <input
                      type="date"
                      className={inputClass}
                      value={filters.dateFrom}
                      onChange={(e) => onChange("dateFrom", e.target.value)}
                    />
                  </Field>
                  <Field label="Date To">
                    <input
                      type="date"
                      className={inputClass}
                      value={filters.dateTo}
                      onChange={(e) => onChange("dateTo", e.target.value)}
                    />
                  </Field>
                </>
              )}
              <SelectField
                label="Payment Method"
                value={filters.paymentMethod}
                onChange={(v) => onChange("paymentMethod", v)}
                options={[
                  { value: "", label: "All Methods" },
                  { value: "upi", label: "UPI" },
                  { value: "card", label: "Card" },
                  { value: "cash", label: "Cash" },
                  { value: "bank_transfer", label: "Bank Transfer" },
                  { value: "online_gateway", label: "Online Gateway" },
                ]}
              />
              <SelectField
                label="Business Profile"
                value={filters.businessId}
                onChange={(v) => onChange("businessId", v)}
                options={[
                  { value: "", label: "All Businesses" },
                  ...businessOptions.map((b) => ({ value: b.id, label: b.name })),
                ]}
              />
              <SelectField
                label="Venue"
                value={filters.venueId}
                onChange={(v) => onChange("venueId", v)}
                options={[
                  { value: "", label: "All Venues" },
                  ...venueOptions.map((v) => ({ value: v.id, label: v.name })),
                ]}
              />
              <SelectField
                label="Venue Owner"
                value={filters.vendorId}
                onChange={(v) => onChange("vendorId", v)}
                options={[
                  { value: "", label: "All Owners" },
                  ...ownerOptions.map((o) => ({ value: o.id, label: o.name })),
                ]}
              />
              <SelectField
                label="Customer"
                value={filters.customerId}
                onChange={(v) => onChange("customerId", v)}
                options={[
                  { value: "", label: "All Customers" },
                  ...customerOptions.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 mt-4 pt-4 border-t border-[#F3F4F6]">
              <Button variant="ghost" size="sm" icon={RotateCcw} onClick={onReset}>
                Reset
              </Button>
              {onSave && (
                <Button variant="secondary" size="sm" icon={Save} onClick={onSave}>
                  Save View
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={onApply}>
                Apply Filters
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-[#6B7280]">{label}</span>
      {children}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Field label={label}>
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value || "all"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
