"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "../../_components/ui/Button";
import { confirmAction } from "../../_components/ui/Toast";
import type { VenueAddon } from "../types";

const inputCls =
  "w-full h-9 px-3 rounded-[10px] border border-[#E8EAF0] bg-[#FCFCFD] text-sm font-semibold text-[#111827] placeholder:text-[#9CA3AF] placeholder:font-normal outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-[#C89B3C]/20 focus:border-[#C89B3C]";

interface AdditionalServicesCatalogProps {
  services: VenueAddon[];
  editable?: boolean;
  onChange?: (services: VenueAddon[]) => void;
  adding?: boolean;
  onAddingChange?: (adding: boolean) => void;
}

export function AdditionalServicesCatalog({
  services,
  editable = false,
  onChange,
  adding = false,
  onAddingChange,
}: AdditionalServicesCatalogProps) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const update = (next: VenueAddon[]) => onChange?.(next);

  const closeAdd = () => {
    setNewName("");
    onAddingChange?.(false);
  };

  const saveNew = () => {
    const name = newName.trim();
    if (!name) return;
    update([
      ...services,
      { id: `addon-${Date.now()}`, name, price: 0, mandatory: false, active: true },
    ]);
    closeAdd();
  };

  const remove = async (id: string) => {
    const ok = await confirmAction({
      title: "Remove this service?",
      message: "This service will be removed from the venue catalog.",
      confirmLabel: "Remove",
      cancelLabel: "Cancel",
      danger: true,
    });
    if (!ok) return;
    update(services.filter((s) => s.id !== id));
  };

  const commitRename = (id: string) => {
    const name = editingName.trim();
    if (name) {
      update(services.map((s) => (s.id === id ? { ...s, name } : s)));
    }
    setEditingId(null);
    setEditingName("");
  };

  return (
    <div className="space-y-2">
      {editable && adding && (
        <div className="rounded-[10px] border border-[#E8EAF0] bg-[#FCFCFD] p-3 animate-fadeIn">
          <label className="block">
            <span className="block text-[12px] font-medium text-[#6B7280] mb-1">Service Name</span>
            <input
              autoFocus
              className={inputCls}
              value={newName}
              placeholder="e.g. LED Wall"
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveNew();
                }
                if (e.key === "Escape") closeAdd();
              }}
            />
          </label>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" size="sm" onClick={closeAdd}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={saveNew} disabled={!newName.trim()}>
              Save Service
            </Button>
          </div>
        </div>
      )}

      {services.length === 0 ? (
        <p className="text-sm text-[#9CA3AF]">No services added yet.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {services.map((service) => {
            const isEditing = editingId === service.id;
            return (
              <div
                key={service.id}
                className="group inline-flex items-center gap-1 max-w-full rounded-full border border-[#E8EAF0] bg-[#F3F4F6] pl-2.5 pr-1 py-1 text-[13px] text-[#374151] hover:border-[#C89B3C]/40 hover:bg-[#FFF8F3] transition-colors"
              >
                {isEditing && editable ? (
                  <input
                    autoFocus
                    className="min-w-[80px] max-w-[160px] bg-transparent outline-none text-[13px] font-medium text-[#111827]"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => commitRename(service.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitRename(service.id);
                      }
                      if (e.key === "Escape") {
                        setEditingId(null);
                        setEditingName("");
                      }
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    className="font-medium truncate text-left"
                    onClick={() => {
                      if (!editable) return;
                      setEditingId(service.id);
                      setEditingName(service.name);
                    }}
                    title={editable ? "Click to rename" : undefined}
                  >
                    {service.name || "Untitled"}
                  </button>
                )}
                {editable && (
                  <button
                    type="button"
                    onClick={() => remove(service.id)}
                    className="w-5 h-5 rounded-full inline-flex items-center justify-center text-[#9CA3AF] hover:text-[#DC2626] hover:bg-white/80 transition-colors"
                    aria-label={`Remove ${service.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
