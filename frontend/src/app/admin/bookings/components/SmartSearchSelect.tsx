"use client";

/**
 * Quick-create modal helpers for booking flows.
 * For searchable dropdowns, use the global `SearchableSelect` from
 * `src/app/admin/_components/ui/SearchableSelect.tsx`.
 */

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";

interface QuickCreateModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  saving?: boolean;
  onClose: () => void;
  onSave: () => void;
  children: ReactNode;
  saveLabel?: string;
}

export function QuickCreateModal({
  open,
  title,
  subtitle,
  saving,
  onClose,
  onSave,
  children,
  saveLabel = "Save & Continue",
}: QuickCreateModalProps) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, saving, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-create-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={() => {
          if (!saving) onClose();
        }}
      />
      <div
        className="relative z-10 flex w-full max-w-lg max-h-[min(90vh,640px)] flex-col rounded-[14px] border border-[#E8EAF0] bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-[#F3F4F6] shrink-0">
          <div className="min-w-0">
            <h3
              id="quick-create-title"
              className="text-base font-semibold text-[#111827]"
            >
              {title}
            </h3>
            {subtitle ? (
              <p className="text-sm text-[#6B7280] mt-1">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="p-2 -mr-1 rounded-lg text-[#6B7280] hover:bg-[#F8F9FB] hover:text-[#111827] disabled:opacity-60 shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 sm:px-5 py-4 space-y-3 overflow-y-auto flex-1 min-h-0">
          {children}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 sm:px-5 py-3.5 bg-[#FCFCFD] border-t border-[#E8EAF0] shrink-0">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="h-9 px-3.5 rounded-lg border border-[#E8EAF0] bg-white text-sm font-medium text-[#374151] hover:bg-[#F8F9FB] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="h-9 px-3.5 rounded-lg bg-[#C89B3C] hover:bg-[#B8862B] text-sm font-semibold text-white disabled:opacity-60 inline-flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {saving ? "Saving…" : saveLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function QuickField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium text-[#6B7280]">
        {label}
        {required ? <span className="text-red-500 ml-0.5">*</span> : null}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export const quickInputCls =
  "w-full h-10 px-3 rounded-[10px] border border-[#E8EAF0] bg-[#FCFCFD] text-sm text-[#111827] outline-none focus:bg-white focus:ring-2 focus:ring-[#C89B3C]/20 focus:border-[#C89B3C]";

/** @deprecated Use SearchableSelect from admin/_components/ui */
export { SearchableSelect as SmartSearchSelect } from "../../_components/ui/SearchableSelect";
