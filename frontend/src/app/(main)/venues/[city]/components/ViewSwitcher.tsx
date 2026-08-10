"use client";

import { LayoutList, Columns2, Map } from "lucide-react";
import type { ViewMode } from "./filterTypes";

interface ViewSwitcherProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const options: { id: ViewMode; label: string; icon: typeof LayoutList }[] = [
  { id: "list", label: "List", icon: LayoutList },
  { id: "split", label: "Split Map", icon: Columns2 },
  { id: "map", label: "Full Map", icon: Map },
];

export default function ViewSwitcher({ viewMode, onChange }: ViewSwitcherProps) {
  return (
    <div
      className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm"
      role="group"
      aria-label="View mode"
    >
      {options.map(({ id, label, icon: Icon }) => {
        const active = viewMode === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs sm:text-sm font-medium transition-all duration-250 ${
              active
                ? "bg-[#C89B3C] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
            aria-pressed={active}
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
