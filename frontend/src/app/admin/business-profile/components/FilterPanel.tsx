"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Filter, RotateCcw, Save, X } from "lucide-react";
import { Button } from "../../_components/ui/Button";
import { BusinessProfileFilters } from "../types";
import { cityOptions } from "../data";
import type { OwnerSelectOption } from "./BusinessProfileWorkspace";

interface FilterPanelProps {
  open: boolean;
  filters: BusinessProfileFilters;
  onChange: (key: keyof BusinessProfileFilters, value: string) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
  onSave?: () => void;
  activeCount?: number;
  ownerOptions?: OwnerSelectOption[];
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
  ownerOptions = [],
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
                    {activeCount > 0 ? `${activeCount} active filter(s)` : "Refine the business profile list"}
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
                label="Status"
                value={filters.status}
                onChange={(v) => onChange("status", v)}
                options={[
                  { value: "", label: "All Status" },
                  { value: "active", label: "Active" },
                  { value: "pending", label: "Pending" },
                  { value: "inactive", label: "Inactive" },
                ]}
              />
              <SelectField
                label="Verification"
                value={filters.verification}
                onChange={(v) => onChange("verification", v)}
                options={[
                  { value: "", label: "All Verification" },
                  { value: "verified", label: "Verified" },
                  { value: "pending", label: "Pending" },
                  { value: "rejected", label: "Rejected" },
                ]}
              />
              <SelectField
                label="Business Type"
                value={filters.businessType}
                onChange={(v) => onChange("businessType", v)}
                options={[
                  { value: "", label: "All Business Types" },
                  { value: "Private Limited", label: "Private Limited" },
                  { value: "Proprietorship", label: "Proprietorship" },
                  { value: "Partnership", label: "Partnership" },
                  { value: "LLP", label: "LLP" },
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
                label="Venue Owner"
                value={filters.owner}
                onChange={(v) => onChange("owner", v)}
                options={[
                  { value: "", label: "All Owners" },
                  ...ownerOptions.map((o) => ({ value: o.id, label: o.name })),
                ]}
              />
              <Field label="Date From">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => onChange("dateFrom", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Date To">
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => onChange("dateTo", e.target.value)}
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
