"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Filter, RotateCcw, Save, X } from "lucide-react";
import { Button } from "../../_components/ui/Button";
import { VenueFilters } from "../types";
import { categoryOptions, cityOptions } from "../data";

interface FilterPanelProps {
  open: boolean;
  filters: VenueFilters;
  onChange: (key: keyof VenueFilters, value: string) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
  onSave?: () => void;
  activeCount?: number;
  businessOptions?: { id: string; name: string }[];
}

export function FilterPanel({
  open,
  filters,
  onChange,
  onApply,
  onReset,
  onClose,
  onSave,
  activeCount = 0,
  businessOptions = [],
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
                  <p className="text-sm font-semibold text-[#111827]">Advanced Filters</p>
                  <p className="text-xs text-[#9CA3AF]">
                    {activeCount > 0 ? `${activeCount} active filter(s)` : "Refine the venue list"}
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
                label="Business Profile"
                value={filters.businessId}
                onChange={(v) => onChange("businessId", v)}
                options={[
                  { value: "", label: "All Business Profiles" },
                  ...businessOptions.map((b) => ({ value: b.id, label: b.name })),
                ]}
              />
              <SelectField
                label="Venue Category"
                value={filters.category}
                onChange={(v) => onChange("category", v)}
                options={[
                  { value: "", label: "All Categories" },
                  ...categoryOptions.map((c) => ({ value: c, label: c })),
                ]}
              />
              <SelectField
                label="City"
                value={filters.city}
                onChange={(v) => onChange("city", v)}
                options={[
                  { value: "", label: "All Cities" },
                  ...cityOptions.map((c) => ({ value: c, label: c })),
                ]}
              />
              <SelectField
                label="Approval Status"
                value={filters.approval}
                onChange={(v) => onChange("approval", v)}
                options={[
                  { value: "", label: "All Approval Status" },
                  { value: "approved", label: "Approved" },
                  { value: "pending", label: "Pending" },
                  { value: "rejected", label: "Rejected" },
                ]}
              />
              <SelectField
                label="Availability"
                value={filters.availability}
                onChange={(v) => onChange("availability", v)}
                options={[
                  { value: "", label: "All Availability" },
                  { value: "available", label: "Available" },
                  { value: "busy", label: "Busy" },
                  { value: "blocked", label: "Blocked" },
                ]}
              />
              <SelectField
                label="Status"
                value={filters.status}
                onChange={(v) => onChange("status", v)}
                options={[
                  { value: "", label: "All Status" },
                  { value: "published", label: "Published" },
                  { value: "draft", label: "Draft" },
                  { value: "pending", label: "Pending" },
                  { value: "inactive", label: "Inactive" },
                  { value: "archived", label: "Archived" },
                ]}
              />
              <SelectField
                label="Featured"
                value={filters.featured}
                onChange={(v) => onChange("featured", v)}
                options={[
                  { value: "", label: "All Venues" },
                  { value: "yes", label: "Featured Only" },
                  { value: "no", label: "Not Featured" },
                ]}
              />
              <Field label="Min Capacity">
                <input
                  type="number"
                  min={0}
                  value={filters.capacityMin}
                  onChange={(e) => onChange("capacityMin", e.target.value)}
                  placeholder="e.g. 200"
                  className={inputClass}
                />
              </Field>
              <Field label="Min Price (₹)">
                <input
                  type="number"
                  min={0}
                  value={filters.priceMin}
                  onChange={(e) => onChange("priceMin", e.target.value)}
                  placeholder="e.g. 50000"
                  className={inputClass}
                />
              </Field>
              <Field label="Max Price (₹)">
                <input
                  type="number"
                  min={0}
                  value={filters.priceMax}
                  onChange={(e) => onChange("priceMax", e.target.value)}
                  placeholder="e.g. 300000"
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 mt-4 pt-3 border-t border-[#E8EAF0]">
              <Button variant="ghost" icon={RotateCcw} onClick={onReset}>
                Reset
              </Button>
              {onSave && (
                <Button variant="secondary" icon={Save} onClick={onSave}>
                  Save Filter
                </Button>
              )}
              <Button variant="primary" onClick={onApply}>
                Apply Filters
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const inputClass =
  "w-full h-10 px-3 rounded-[10px] border border-[#E8EAF0] bg-white text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/25 focus:border-[#C89B3C]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {options.map((opt) => (
          <option key={opt.value || "all"} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
