"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Filter, RotateCcw, Save, X } from "lucide-react";
import { Button } from "../../_components/ui/Button";
import { BookingFilters } from "../types";

interface FilterPanelProps {
  open: boolean;
  filters: BookingFilters;
  onChange: (key: keyof BookingFilters, value: string) => void;
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
                  <p className="text-sm font-semibold text-[#111827]">Booking Filters</p>
                  <p className="text-xs text-[#9CA3AF]">
                    {activeCount > 0 ? `${activeCount} active filter(s)` : "Narrow reservations by ops fields"}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#F8F9FB] text-[#6B7280]" aria-label="Close filters">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Field label="Booking ID">
                <input className={inputClass} value={filters.bookingId} onChange={(e) => onChange("bookingId", e.target.value)} placeholder="BK-…" />
              </Field>
              <Field label="Customer">
                <input className={inputClass} value={filters.customer} onChange={(e) => onChange("customer", e.target.value)} placeholder="Name" />
              </Field>
              <Field label="Phone">
                <input className={inputClass} value={filters.phone} onChange={(e) => onChange("phone", e.target.value)} placeholder="+91…" />
              </Field>
              <Field label="Venue">
                <input className={inputClass} value={filters.venue} onChange={(e) => onChange("venue", e.target.value)} placeholder="Venue name" />
              </Field>
              <Field label="Business Profile">
                <input className={inputClass} value={filters.businessId} onChange={(e) => onChange("businessId", e.target.value)} placeholder="Business name" />
              </Field>
              <Field label="Event Date">
                <input type="date" className={inputClass} value={filters.eventDate} onChange={(e) => onChange("eventDate", e.target.value)} />
              </Field>
              <SelectField
                label="Booking Status"
                value={filters.bookingStatus}
                onChange={(v) => onChange("bookingStatus", v)}
                options={[
                  { value: "", label: "All Status" },
                  { value: "draft", label: "Draft" },
                  { value: "pending", label: "Pending" },
                  { value: "confirmed", label: "Confirmed" },
                  { value: "checked_in", label: "Checked In" },
                  { value: "completed", label: "Completed" },
                  { value: "cancelled", label: "Cancelled" },
                  { value: "refunded", label: "Refunded" },
                ]}
              />
              <SelectField
                label="Payment Status"
                value={filters.paymentStatus}
                onChange={(v) => onChange("paymentStatus", v)}
                options={[
                  { value: "", label: "All Payments" },
                  { value: "unpaid", label: "Unpaid" },
                  { value: "partial", label: "Partial" },
                  { value: "paid", label: "Paid" },
                  { value: "refunded", label: "Refunded" },
                  { value: "failed", label: "Failed" },
                ]}
              />
              <Field label="Date From">
                <input type="date" className={inputClass} value={filters.dateFrom} onChange={(e) => onChange("dateFrom", e.target.value)} />
              </Field>
              <Field label="Date To">
                <input type="date" className={inputClass} value={filters.dateTo} onChange={(e) => onChange("dateTo", e.target.value)} />
              </Field>
              <Field label="Assigned Executive">
                <input className={inputClass} value={filters.assignedExecutive} onChange={(e) => onChange("assignedExecutive", e.target.value)} placeholder="Executive name" />
              </Field>
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
