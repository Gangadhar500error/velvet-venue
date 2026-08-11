"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Plus, Search, X } from "lucide-react";

export interface SearchableOption {
  value: string;
  label: string;
  description?: string | string[];
  meta?: string;
  keywords?: string;
  icon?: ComponentType<{ className?: string }>;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string, option?: SearchableOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  loading?: boolean;
  emptyLabel?: string;
  createLabel?: string;
  onCreate?: () => void;
  variant?: "underline" | "boxed";
  label?: string;
  required?: boolean;
  wide?: boolean;
  debounceMs?: number;
  className?: string;
  maxMenuHeight?: number;
  /** When set, typing calls this with the debounced query instead of filtering locally. */
  onQueryChange?: (query: string) => void;
  selectedOption?: SearchableOption | null;
}

const Z_DROPDOWN = 9999;
const GAP = 10;
const LABEL_CLS =
  "shrink-0 w-[128px] sm:w-[142px] text-sm text-[#6B7280] leading-6 after:content-[':'] after:ml-0.5";

function asLines(description?: string | string[]) {
  if (!description) return [];
  return Array.isArray(description) ? description.filter(Boolean) : [description];
}

function highlight(text: string, query: string): ReactNode {
  if (!query.trim()) return text;
  const q = query.trim();
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[#FFF4ED] text-[#9A3412] rounded px-0.5 not-italic font-semibold">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

type MenuPlacement = "bottom" | "top";

/**
 * Global enterprise searchable dropdown for the entire admin app.
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  disabled,
  clearable = true,
  loading,
  emptyLabel = "No results found",
  createLabel,
  onCreate,
  variant = "boxed",
  label,
  required,
  wide,
  debounceMs = 140,
  className = "",
  maxMenuHeight = 320,
  onQueryChange,
  selectedOption,
}: SearchableSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [placement, setPlacement] = useState<MenuPlacement>("bottom");
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(
    null
  );

  const selected = useMemo(
    () => options.find((o) => o.value === value) || (selectedOption?.value === value ? selectedOption : null),
    [options, value, selectedOption]
  );

  useEffect(() => setMounted(true), []);

  const updateMenuPos = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.max(rect.width, 180);
    let left = rect.left;
    if (left + width > vw - 8) left = Math.max(8, vw - width - 8);
    if (left < 8) left = 8;

    const spaceBelow = vh - rect.bottom - 16;
    const spaceAbove = rect.top - 16;
    const preferBottom = spaceBelow >= 180 || spaceBelow >= spaceAbove;
    const nextPlacement: MenuPlacement = preferBottom ? "bottom" : "top";
    const available = preferBottom ? spaceBelow : spaceAbove;
    const panelMax = Math.min(maxMenuHeight, Math.max(160, available - GAP));

    const top = preferBottom
      ? rect.bottom + GAP
      : Math.max(8, rect.top - GAP - panelMax);

    setPlacement(nextPlacement);
    setMenuPos({ top, left, width, maxHeight: panelMax });
  }, [maxMenuHeight]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setDebounced("");
    setActiveIndex(0);
  }, []);

  useEffect(() => {
    if (!open) return;
    updateMenuPos();
    const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 10);
    const onReposition = () => updateMenuPos();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, updateMenuPos]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => setDebounced(query), debounceMs);
    return () => window.clearTimeout(timer);
  }, [query, debounceMs, open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      close();
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open || !onQueryChange) return;
    onQueryChange(debounced);
  }, [open, debounced, onQueryChange]);

  const filtered = useMemo(() => {
    if (onQueryChange) return options;
    const q = debounced.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const hay = `${o.label} ${asLines(o.description).join(" ")} ${o.meta || ""} ${o.keywords || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [options, debounced, onQueryChange]);

  useEffect(() => {
    setActiveIndex(0);
  }, [debounced, open]);

  const pick = (option: SearchableOption) => {
    if (option.disabled) return;
    onChange(option.value, option);
    close();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) pick(filtered[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      close();
    }
  };

  const triggerBoxed =
    "w-full h-10 px-3 rounded-[10px] border bg-[#FCFCFD] text-sm text-left flex items-center gap-2 transition-colors outline-none focus:outline-none " +
    (open
      ? "border-[#C89B3C] bg-white"
      : "border-[#E8EAF0] hover:border-[#D1D5DB]") +
    (disabled ? " opacity-60 pointer-events-none" : "");

  const triggerUnderline =
    "w-full min-w-0 h-9 flex items-center gap-1.5 border-b bg-transparent transition-colors outline-none focus:outline-none " +
    (open ? "border-[#C89B3C]" : "border-[#E5E7EB] hover:border-[#D1D5DB]") +
    (disabled ? " opacity-60 pointer-events-none" : "");

  const searchHeaderHeight = 52;
  const listMaxHeight = Math.max(96, (menuPos?.maxHeight || maxMenuHeight) - searchHeaderHeight);

  const menu =
    mounted && open && menuPos
      ? createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            style={{
              position: "fixed",
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
              maxHeight: menuPos.maxHeight,
              zIndex: Z_DROPDOWN,
            }}
            className={`flex flex-col overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.14)] ${
              placement === "bottom" ? "vv-dd-in-down" : "vv-dd-in-up"
            }`}
          >
            <style>{`
              @keyframes vvDdInDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
              @keyframes vvDdInUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
              .vv-dd-in-down{animation:vvDdInDown .18s ease-out both}
              .vv-dd-in-up{animation:vvDdInUp .18s ease-out both}
              .vv-dd-scroll{scrollbar-width:thin;scrollbar-color:#D1D5DB transparent}
              .vv-dd-scroll::-webkit-scrollbar{width:6px}
              .vv-dd-scroll::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:999px}
              .vv-dd-scroll::-webkit-scrollbar-track{background:transparent}
            `}</style>

            {/* Sticky search */}
            <div className="shrink-0 border-b border-[#F3F4F6] bg-white px-2.5 py-2">
              <div className="flex items-center gap-2 h-9 px-2.5 rounded-[8px] border border-[#E8EAF0] bg-[#FCFCFD] focus-within:border-[#C89B3C]">
                <Search className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-sm text-[#111827] placeholder:text-[#9CA3AF]"
                />
                {query ? (
                  <button
                    type="button"
                    className="p-0.5 text-[#9CA3AF] hover:text-[#111827]"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>
            </div>

            {/* Options */}
            <div className="vv-dd-scroll overflow-y-auto overscroll-contain" style={{ maxHeight: listMaxHeight }}>
              {loading ? (
                <div className="p-3 space-y-2">
                  <p className="text-xs font-medium text-[#9CA3AF] px-1">Loading…</p>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-11 rounded-lg bg-[#F3F4F6] animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-4 py-7 text-center space-y-2.5">
                  <p className="text-sm text-[#6B7280]">{emptyLabel}</p>
                  {onCreate && createLabel ? (
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        onCreate();
                      }}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#C89B3C] hover:underline"
                    >
                      <Plus className="w-4 h-4" />
                      {createLabel.startsWith("+") ? createLabel : `+ ${createLabel}`}
                    </button>
                  ) : null}
                </div>
              ) : (
                filtered.map((opt, idx) => {
                  const active = idx === activeIndex;
                  const isSelected = opt.value === value;
                  const Icon = opt.icon;
                  const lines = asLines(opt.description);
                  const compact = lines.length === 0 && !opt.meta;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      disabled={opt.disabled}
                      aria-selected={isSelected}
                      className={`w-full text-left px-3 flex items-center gap-2.5 transition-colors duration-150 border-l-[3px] ${
                        compact ? "min-h-[44px] py-2" : "min-h-[48px] py-2.5"
                      } ${
                        isSelected
                          ? "bg-[#FCFAF8] border-l-[#C89B3C]"
                          : active
                            ? "bg-[#FFFBF7] border-l-[#FFB27A]"
                            : "bg-white border-l-transparent hover:bg-[#F9FAFB]"
                      } ${opt.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => pick(opt)}
                    >
                      {Icon ? (
                        <span className="w-8 h-8 rounded-full bg-[#FFF4ED] text-[#C89B3C] flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </span>
                      ) : null}
                      <span className="min-w-0 flex-1">
                        <span className="text-sm font-semibold text-[#111827] block truncate">
                          {highlight(opt.label, debounced)}
                        </span>
                        {lines.map((line) => (
                          <span key={line} className="block text-[12px] text-[#6B7280] truncate mt-0.5">
                            {highlight(line, debounced)}
                          </span>
                        ))}
                        {opt.meta ? (
                          <span className="block text-[11px] text-[#9CA3AF] mt-0.5 truncate">{opt.meta}</span>
                        ) : null}
                      </span>
                      {isSelected ? <Check className="w-4 h-4 text-[#C89B3C] shrink-0" /> : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  const control = (
    <div className={`min-w-0 ${label ? "flex-1" : "w-full"} ${className}`} ref={rootRef}>
      <div className="flex items-center gap-2">
        <div
          ref={triggerRef}
          role="combobox"
          tabIndex={disabled ? -1 : 0}
          aria-expanded={open}
          aria-controls={listId}
          aria-haspopup="listbox"
          aria-required={required}
          className={variant === "boxed" ? triggerBoxed : triggerUnderline}
          onClick={() => {
            if (disabled) return;
            if (open) close();
            else setOpen(true);
          }}
          onKeyDown={onKeyDown}
        >
          {variant === "boxed" ? (
            <Search className="w-4 h-4 text-[#9CA3AF] shrink-0" />
          ) : (
            <Search className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
          )}
          <span
            className={`flex-1 min-w-0 truncate ${
              selected ? "font-semibold text-[#111827]" : "font-normal text-[#9CA3AF]"
            }`}
          >
            {selected?.label || placeholder}
          </span>
          {clearable && value && !disabled ? (
            <button
              type="button"
              aria-label="Clear"
              className="p-0.5 rounded text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6]"
              onClick={(e) => {
                e.stopPropagation();
                onChange("", undefined);
              }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#9CA3AF] shrink-0 transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
            />
          )}
        </div>

        {onCreate && createLabel ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onCreate()}
            className="shrink-0 inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-[#FFD4B0] bg-[#FFF8F3] text-[#C89B3C] text-[12px] font-semibold hover:bg-[#FFF1E6] hover:border-[#FFB27A] transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            {createLabel}
          </button>
        ) : null}
      </div>
      {menu}
    </div>
  );

  if (!label) return control;

  return (
    <div className={`flex items-start gap-2 ${wide ? "sm:col-span-2" : ""}`}>
      <p className={LABEL_CLS}>
        {label}
        {required ? <span className="text-red-500 ml-0.5">*</span> : null}
      </p>
      {control}
    </div>
  );
}

export function toSearchableOptions(
  items: Array<string | { value: string; label: string; description?: string }>
): SearchableOption[] {
  return items.map((item) =>
    typeof item === "string"
      ? { value: item, label: item }
      : { value: item.value, label: item.label, description: item.description }
  );
}
