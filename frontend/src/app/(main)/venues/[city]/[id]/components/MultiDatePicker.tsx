"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { formatDisplayDate } from "./bookingDraft";

interface MultiDatePickerProps {
  selectedDates: string[];
  onChange: (dates: string[]) => void;
  minDate?: string;
  error?: string;
}

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function MultiDatePicker({
  selectedDates,
  onChange,
  minDate,
  error,
}: MultiDatePickerProps) {
  const today = minDate || new Date().toISOString().slice(0, 10);
  const [view, setView] = useState(() => {
    const base = selectedDates[0] || today;
    const d = new Date(`${base}T12:00:00`);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const selected = useMemo(() => new Set(selectedDates), [selectedDates]);
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const startWeekday = new Date(view.getFullYear(), view.getMonth(), 1).getDay();

  const toggle = (iso: string) => {
    if (iso < today) return;
    const next = selected.has(iso)
      ? selectedDates.filter((d) => d !== iso)
      : [...selectedDates, iso].sort();
    onChange(next);
  };

  const remove = (iso: string) => onChange(selectedDates.filter((d) => d !== iso));

  return (
    <div>
      <div
        className={`rounded-[14px] border bg-white p-3 ${
          error ? "border-[#EF4444]" : "border-[#ECECEC]"
        }`}
      >
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() =>
              setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))
            }
            className="rounded-lg p-1.5 text-[#6B7280] hover:bg-[#FBF6EA] hover:text-[#C89B3C]"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-[13px] font-semibold text-[#1F2937]">
            {view.toLocaleString("en-IN", { month: "long", year: "numeric" })}
          </p>
          <button
            type="button"
            onClick={() =>
              setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))
            }
            className="rounded-lg p-1.5 text-[#6B7280] hover:bg-[#FBF6EA] hover:text-[#C89B3C]"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[#6B7280]">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startWeekday }).map((_, i) => (
            <span key={`e-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const iso = toISO(view.getFullYear(), view.getMonth(), day);
            const disabled = iso < today;
            const on = selected.has(iso);
            return (
              <button
                key={iso}
                type="button"
                disabled={disabled}
                onClick={() => toggle(iso)}
                className={`aspect-square rounded-lg text-[12px] font-semibold transition-all duration-200 ${
                  disabled
                    ? "cursor-not-allowed text-[#D1D5DB]"
                    : on
                      ? "bg-[#C89B3C] text-white shadow-sm scale-[1.02]"
                      : "text-[#1F2937] hover:bg-[#FBF6EA] hover:text-[#C89B3C]"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="mt-1.5 text-[11px] font-medium text-[#EF4444]">{error}</p>}

      {selectedDates.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-[12px] font-semibold text-[#1F2937]">
            Selected Dates
          </p>
          <ul className="space-y-1">
            {selectedDates.map((iso) => (
              <li
                key={iso}
                className="flex items-center justify-between rounded-lg border border-[#E9D39B] bg-[#FBF6EA] px-2.5 py-1.5 text-[12px] font-medium text-[#1F2937]"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[#C89B3C]" />
                  {formatDisplayDate(iso)}
                </span>
                <button
                  type="button"
                  onClick={() => remove(iso)}
                  className="rounded-full p-0.5 text-[#6B7280] hover:bg-white hover:text-[#EF4444]"
                  aria-label={`Remove ${formatDisplayDate(iso)}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
