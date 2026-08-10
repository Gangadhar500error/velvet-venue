"use client";

import { Check, Circle } from "lucide-react";

export interface PublishCheckItem {
  key: string;
  label: string;
  done: boolean;
}

export function PublishChecklist({
  items,
  canPublish,
}: {
  items: PublishCheckItem[];
  canPublish: boolean;
}) {
  const doneCount = items.filter((i) => i.done).length;
  return (
    <div className="rounded-[14px] border border-[#E8EAF0] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-[#111827]">
            Publish Checklist
          </p>
          <p className="text-[12px] text-[#9CA3AF] mt-0.5">
            {doneCount}/{items.length} complete
            {canPublish ? " · Ready to publish" : " · Complete all items to publish"}
          </p>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            canPublish
              ? "bg-[#ECFDF3] text-[#16A34A] border-[#D3F8E1]"
              : "bg-[#FCFAF8] text-[#D97706] border-[#FDE9CB]"
          }`}
        >
          {canPublish ? "Ready" : "Incomplete"}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {items.map((item) => (
          <div
            key={item.key}
            className={`flex items-center gap-2 rounded-[10px] border px-2.5 py-2 text-[12px] font-medium ${
              item.done
                ? "border-[#D3F8E1] bg-[#F0FDF4] text-[#16A34A]"
                : "border-[#E8EAF0] bg-[#FCFCFD] text-[#6B7280]"
            }`}
          >
            {item.done ? (
              <Check className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 shrink-0" />
            )}
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
