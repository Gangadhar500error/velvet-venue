"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, Trash2, X, XCircle } from "lucide-react";
import { useTheme } from "../ThemeProvider";

export type ToastTone = "success" | "error" | "warning" | "info";

interface ToastDetail {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
}

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
  duration: number;
  exiting?: boolean;
}

const EVENT = "vv-toast";
const DURATION_MS = 5000;

export function toast(message: string, tone: ToastTone = "success", description?: string) {
  showToast({ title: message, tone, description });
}

export function showToast(detail: ToastDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(EVENT, {
      detail: {
        title: detail.title,
        description: detail.description,
        tone: detail.tone || "success",
        duration: detail.duration ?? DURATION_MS,
      },
    })
  );
}

export const notify = {
  created: (entity: string) => toast(`${entity} created successfully.`, "success"),
  updated: (entity: string) => toast(`${entity} updated successfully.`, "success"),
  deleted: (entity = "Record") => toast(`${entity} deleted successfully.`, "success"),
  saved: () => toast("Saved successfully.", "success"),
  uploaded: (label = "File") => toast(`${label} uploaded successfully.`, "success"),
  exported: () => toast("Export completed successfully.", "success"),
  imported: () => toast("Data imported successfully.", "success"),
  downloaded: () => toast("Download started successfully.", "success"),
  filtersApplied: () => toast("Filters applied successfully.", "success"),
  filtersReset: () => toast("Filters reset successfully.", "success"),
  viewSaved: () => toast("View saved successfully.", "success"),
  statusUpdated: (message = "Status updated successfully.") => toast(message, "success"),
  relatedUpdated: () => toast("All related records updated successfully.", "success"),
  validation: (message: string) => toast(message, "warning"),
  error: (message = "Something went wrong.") => toast(message, "error"),
};

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 280);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ToastDetail>).detail;
      if (!detail?.title) return;
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setItems((prev) => [
        ...prev,
        {
          id,
          title: detail.title,
          description: detail.description,
          tone: detail.tone || "success",
          duration: detail.duration ?? DURATION_MS,
        },
      ]);
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2.5 max-w-[380px] w-[calc(100%-2rem)] pointer-events-none">
      <style>{`@keyframes vvToastIn{from{opacity:0;transform:translateX(16px) translateY(-6px)}to{opacity:1;transform:translateX(0) translateY(0)}}`}</style>
      {items.map((t) => (
        <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const { isDarkMode } = useTheme();
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const remainingRef = useRef(item.duration);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (item.exiting) return;
    if (paused) return;
    startRef.current = Date.now();
    const timer = window.setInterval(() => {
      const left = Math.max(0, remainingRef.current - (Date.now() - startRef.current));
      setProgress((left / item.duration) * 100);
      if (left <= 0) {
        window.clearInterval(timer);
        onDismiss();
      }
    }, 40);
    return () => window.clearInterval(timer);
  }, [paused, item.duration, item.exiting, onDismiss]);

  const accent =
    item.tone === "success"
      ? "border-l-[#16A34A]"
      : item.tone === "error"
        ? "border-l-[#DC2626]"
        : item.tone === "warning"
          ? "border-l-[#D97706]"
          : "border-l-[#C89B3C]";
  const Icon =
    item.tone === "success"
      ? CheckCircle2
      : item.tone === "error"
        ? XCircle
        : item.tone === "warning"
          ? AlertTriangle
          : Info;
  const iconCls =
    item.tone === "success"
      ? "text-[#16A34A]"
      : item.tone === "error"
        ? "text-[#DC2626]"
        : item.tone === "warning"
          ? "text-[#D97706]"
          : "text-[#C89B3C]";
  const barCls =
    item.tone === "success"
      ? "bg-[#16A34A]"
      : item.tone === "error"
        ? "bg-[#DC2626]"
        : item.tone === "warning"
          ? "bg-[#D97706]"
          : "bg-[#C89B3C]";

  return (
    <div
      role="status"
      onMouseEnter={() => {
        remainingRef.current = (progress / 100) * item.duration;
        setPaused(true);
      }}
      onMouseLeave={() => {
        startRef.current = Date.now();
        setPaused(false);
      }}
      onClick={onDismiss}
      className={`pointer-events-auto relative overflow-hidden rounded-[12px] border border-l-4 ${accent} backdrop-blur-md px-3.5 py-3 cursor-pointer transition-all duration-150 ${
        isDarkMode
          ? "border-[#334155] bg-[#1E293B]/95 shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
          : "border-[#E8EAF0] bg-white/90 shadow-[0_10px_30px_rgba(16,24,40,0.12)]"
      } ${item.exiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"}`}
      style={item.exiting ? undefined : { animation: "vvToastIn 0.35s ease-out" }}
    >
      <div className="flex items-start gap-2.5">
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconCls}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold leading-snug ${isDarkMode ? "text-[#F8FAFC]" : "text-[#111827]"}`}>
            {item.title}
          </p>
          {item.description ? (
            <p className={`text-[12px] mt-0.5 leading-snug ${isDarkMode ? "text-[#94A3B8]" : "text-[#6B7280]"}`}>
              {item.description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className={`p-1 rounded-md ${
            isDarkMode
              ? "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#243244]"
              : "text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6]"
          }`}
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className={`absolute left-0 right-0 bottom-0 h-[3px] ${isDarkMode ? "bg-[#334155]" : "bg-[#F3F4F6]"}`}>
        <div className={`h-full ${barCls}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

const CONFIRM_EVENT = "vv-confirm";
const CONFIRM_RESULT = "vv-confirm-result";

export function confirmAction(options?: {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  const id = Date.now() + Math.random();
  return new Promise((resolve) => {
    const onResult = (e: Event) => {
      const detail = (e as CustomEvent<{ id: number; ok: boolean }>).detail;
      if (detail?.id !== id) return;
      window.removeEventListener(CONFIRM_RESULT, onResult);
      resolve(Boolean(detail.ok));
    };
    window.addEventListener(CONFIRM_RESULT, onResult);
    window.dispatchEvent(
      new CustomEvent(CONFIRM_EVENT, {
        detail: {
          id,
          title: options?.title || "Delete Record?",
          message:
            options?.message ||
            "Are you sure you want to delete this record?\n\nThis action cannot be undone.",
          confirmLabel: options?.confirmLabel || "Delete",
          cancelLabel: options?.cancelLabel || "Cancel",
          danger: options?.danger !== false,
        },
      })
    );
  });
}

export function ConfirmHost() {
  const { isDarkMode } = useTheme();
  const [open, setOpen] = useState<{
    id: number;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    danger: boolean;
  } | null>(null);

  useEffect(() => {
    const handler = (e: Event) => setOpen((e as CustomEvent).detail);
    window.addEventListener(CONFIRM_EVENT, handler);
    return () => window.removeEventListener(CONFIRM_EVENT, handler);
  }, []);

  const close = (ok: boolean) => {
    if (!open) return;
    window.dispatchEvent(new CustomEvent(CONFIRM_RESULT, { detail: { id: open.id, ok } }));
    setOpen(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" aria-label="Close" onClick={() => close(false)} />
      <div
        className={`relative w-full max-w-md rounded-[14px] border shadow-xl overflow-hidden animate-fadeIn ${
          isDarkMode ? "border-[#334155] bg-[#1E293B]" : "border-[#E8EAF0] bg-white"
        }`}
      >
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                open.danger
                  ? isDarkMode
                    ? "bg-[rgba(239,68,68,0.15)] text-[#F87171]"
                    : "bg-[#FEF2F2] text-[#DC2626]"
                  : isDarkMode
                    ? "bg-[rgba(200, 155, 60,0.15)] text-[#FB923C]"
                    : "bg-[#FFF3EB] text-[#C89B3C]"
              }`}
            >
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-semibold ${isDarkMode ? "text-[#F8FAFC]" : "text-[#111827]"}`}>
                {open.title}
              </h3>
              <p className={`text-sm mt-1.5 leading-relaxed whitespace-pre-line ${isDarkMode ? "text-[#94A3B8]" : "text-[#6B7280]"}`}>
                {open.message}
              </p>
            </div>
          </div>
        </div>
        <div
          className={`flex items-center justify-end gap-2 px-5 py-3.5 border-t ${
            isDarkMode ? "bg-[#111827] border-[#334155]" : "bg-[#FCFCFD] border-[#E8EAF0]"
          }`}
        >
          <button
            type="button"
            onClick={() => close(false)}
            className={`h-9 px-3.5 rounded-lg border text-sm font-medium ${
              isDarkMode
                ? "border-[#334155] bg-[#243244] text-[#CBD5E1] hover:bg-[#334155]"
                : "border-[#E8EAF0] bg-white text-[#374151] hover:bg-[#F8F9FB]"
            }`}
          >
            {open.cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => close(true)}
            className={`h-9 px-3.5 rounded-lg text-sm font-semibold text-white ${open.danger ? "bg-[#DC2626] hover:bg-[#B91C1C]" : "bg-[#C89B3C] hover:bg-[#B8862B]"}`}
          >
            {open.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
