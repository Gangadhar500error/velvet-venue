"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import {
  Building2,
  Calculator,
  ChevronDown,
  Plus,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import {
  BookingModel,
  FoodSlot,
  PricingMethod,
  PricingSlot,
  Venue,
  VenueFormValues,
} from "../types";
import { formatCurrency, PLATFORM_COMMISSION_PERCENT } from "../data";

const labelCls = "block text-[12px] font-medium text-[#6B7280] mb-1.5";
const inputCls =
  "w-full h-10 px-3 rounded-[10px] border border-[#E8EAF0] bg-[#FCFCFD] text-sm font-semibold text-[#111827] placeholder:text-[#9CA3AF] placeholder:font-normal outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-[#C89B3C]/20 focus:border-[#C89B3C]";
const timeCls =
  "w-full h-10 px-2.5 rounded-[10px] border border-[#E8EAF0] bg-[#FCFCFD] text-sm font-semibold text-[#111827] outline-none focus:bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20";

const VENUE_METHOD_OPTIONS: { value: PricingMethod; label: string }[] = [
  { value: "full_day", label: "Full Day" },
  { value: "slot_based", label: "Slot Based" },
];

function normalizeMethod(value: unknown): PricingMethod {
  if (value === "slot_based") return "slot_based";
  return "full_day";
}

interface PricingBookingRulesProps {
  form?: VenueFormValues;
  venue?: Venue;
  onChange?: <K extends keyof VenueFormValues>(key: K, value: VenueFormValues[K]) => void;
  editable: boolean;
}

export function PricingBookingRules({ form, venue, onChange, editable }: PricingBookingRulesProps) {
  const bookingModel = (form?.bookingModel ?? venue?.bookingModel ?? "venue_only") as BookingModel;
  const isVenueFood = bookingModel === "venue_food";

  const slots = (form?.pricingSlots ?? venue?.pricingSlots ?? []) as PricingSlot[];
  const foodSlots = (form?.foodSlots ?? venue?.foodSlots ?? []) as FoodSlot[];
  const food =
    form?.foodPricing ??
    venue?.foodPricing ?? {
      vegPlateCost: 0,
      nonVegPlateCost: 0,
      minPlates: 0,
      maxPlates: 0,
    };

  const gstPercent = form?.gstPercent ?? String(venue?.gstPercent ?? 18);
  const advancePercent = String(form?.advancePaymentPercent ?? venue?.advancePaymentPercent ?? "");

  const venueMethod = normalizeMethod(form?.pricingMethod ?? venue?.pricingMethod ?? "full_day");

  const [open, setOpen] = useState<Record<string, boolean>>({
    pricingModel: true,
    venuePricing: true,
    slotPricing: true,
    foodSlots: true,
    bookingRules: true,
    preview: true,
  });
  const [previewSlotId, setPreviewSlotId] = useState<string>("");
  const [previewFoodSlotId, setPreviewFoodSlotId] = useState<string>("");

  const toggle = (id: string) => setOpen((p) => ({ ...p, [id]: !p[id] }));

  if (!form && !venue) return null;

  const change = <K extends keyof VenueFormValues>(key: K, value: VenueFormValues[K]) => {
    if (editable && onChange) onChange(key, value);
  };

  const fullDaySlot = slots.find((s) => s.key === "full_day");
  const timedSlots = slots.filter((s) => s.key !== "full_day");

  const showFullDay = !isVenueFood && venueMethod === "full_day";
  const showSlots = !isVenueFood && venueMethod === "slot_based";
  const showFoodSlots = isVenueFood;

  const updateSlot = (id: string, patch: Partial<PricingSlot>) => {
    change(
      "pricingSlots",
      slots.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  };

  const updateFoodSlot = (id: string, patch: Partial<FoodSlot>) => {
    change(
      "foodSlots",
      foodSlots.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  };

  const ensureFullDaySlot = (): PricingSlot => {
    if (fullDaySlot) return fullDaySlot;
    const created: PricingSlot = {
      id: `slot-full-${Date.now()}`,
      key: "full_day",
      name: "Full Day",
      enabled: true,
      timeLabel: "9 AM – 11 PM",
      price: 0,
      minBookingAmount: 0,
      maxGuests: Number(form?.maxGuests ?? venue?.maxGuests ?? 400) || 400,
    };
    change("pricingSlots", [...slots, created]);
    return created;
  };

  const addTimedSlot = () => {
    const name = uniqueSlotName(
      timedSlots.map((s) => s.name),
      "Custom Slot"
    );
    const created: PricingSlot = {
      id: `slot-${Date.now()}`,
      key: slugifyKey(name),
      name,
      enabled: true,
      timeLabel: "9 AM – 1 PM",
      price: 0,
      minBookingAmount: 0,
      maxGuests: Number(form?.maxGuests ?? venue?.maxGuests ?? 400) || 400,
    };
    change("pricingSlots", [...slots, created]);
    setPreviewSlotId(created.id);
    setOpen((p) => ({ ...p, slotPricing: true }));
  };

  const removeTimedSlot = (id: string) => {
    change(
      "pricingSlots",
      slots.filter((s) => s.id !== id)
    );
    if (previewSlotId === id) setPreviewSlotId("");
  };

  const addFoodSlot = () => {
    const name = uniqueSlotName(
      foodSlots.map((s) => s.name),
      "Custom Meal"
    );
    const created: FoodSlot = {
      id: `food-${Date.now()}`,
      key: slugifyKey(name),
      name,
      enabled: true,
      timeLabel: "12 PM – 3 PM",
      vegPlateCost: 0,
      nonVegPlateCost: 0,
      minGuests: Number(food.minPlates) || 50,
      maxGuests: Number(food.maxPlates) || 500,
    };
    change("foodSlots", [...foodSlots, created]);
    setPreviewFoodSlotId(created.id);
    setOpen((p) => ({ ...p, foodSlots: true }));
  };

  const removeFoodSlot = (id: string) => {
    change(
      "foodSlots",
      foodSlots.filter((s) => s.id !== id)
    );
    if (previewFoodSlotId === id) setPreviewFoodSlotId("");
  };

  const setVenueMethod = (method: PricingMethod) => {
    change("pricingMethod", method);
    if (method === "full_day") ensureFullDaySlot();
  };

  // ---- Preview calculations ----
  const effectiveMode: "full_day" | "slot" = isVenueFood
    ? "slot"
    : venueMethod === "slot_based"
      ? "slot"
      : "full_day";

  const selectedTimedSlot =
    timedSlots.find((s) => s.id === previewSlotId) || timedSlots[0];
  const selectedFoodSlot =
    foodSlots.find((s) => s.id === previewFoodSlotId) || foodSlots[0];

  const venuePrice = !isVenueFood
    ? effectiveMode === "full_day"
      ? Number(fullDaySlot?.price || 0)
      : Number(selectedTimedSlot?.price || 0)
    : 0;

  const plateSource =
    isVenueFood && selectedFoodSlot
      ? {
          veg: selectedFoodSlot.vegPlateCost,
          nonVeg: selectedFoodSlot.nonVegPlateCost,
          min: selectedFoodSlot.minGuests,
          max: selectedFoodSlot.maxGuests,
        }
      : {
          veg: food.vegPlateCost,
          nonVeg: food.nonVegPlateCost,
          min: food.minPlates,
          max: food.maxPlates,
        };

  /** Fixed sample values for Venue + Food preview (controls removed for clarity) */
  const effectivePreviewGuests = 100;
  const platePrice = Number(plateSource.veg || 0);
  const foodTotal = isVenueFood ? platePrice * effectivePreviewGuests : 0;
  const subtotal = venuePrice + foodTotal;
  const gstPct = Number(gstPercent) || 0;
  const gstExtra =
    gstPct > 0 && subtotal > 0 ? Math.round((subtotal * gstPct) / 100) : 0;
  const bookingTotal = subtotal + gstExtra;
  const advancePercentNum = Number(advancePercent) || 0;
  const advancePayable = Math.min(
    Math.round((bookingTotal * advancePercentNum) / 100),
    bookingTotal
  );
  const platformCommission = Math.round(
    (advancePayable * PLATFORM_COMMISSION_PERCENT) / 100
  );
  const vendorReceivable = Math.max(advancePayable - platformCommission, 0);
  const remainingBalance = Math.max(bookingTotal - advancePayable, 0);

  const advancePercentError =
    advancePercent !== "" && (advancePercentNum < 1 || advancePercentNum > 100);

  const advanceGstFields = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
      <Field
        label="GST (%)"
        value={String(gstPercent)}
        editable={editable}
        numeric
        onChange={(v) => {
          change("gstMode", "excluded");
          change("gstPercent", v);
        }}
      />
      <div>
        <Field
          label="Minimum Booking Percentage (%)"
          value={advancePercent}
          editable={editable}
          numeric
          onChange={(v) => {
            change("onlineBookingAmountMode", "percent");
            change("advancePaymentPercent", v);
          }}
        />
        {advancePercentError && (
          <p className="mt-1 text-[11px] text-red-500">
            Minimum booking percentage must be between 1 and 100
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-2.5">
      {/* Booking Model tabs */}
      <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-2 pt-1">
        <div className="flex items-center gap-1">
          {(
            [
              { value: "venue_only" as BookingModel, label: "Venue Only" },
              { value: "venue_food" as BookingModel, label: "Venue + Food" },
            ] as const
          ).map((tab) => {
            const active = bookingModel === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                disabled={!editable && !active}
                onClick={() => {
                  if (!editable) return;
                  change("bookingModel", tab.value);
                  if (tab.value === "venue_food") {
                    change("foodPricingMethod", "slot_based");
                  }
                }}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  active
                    ? "border-[#C89B3C] text-[#C89B3C]"
                    : "border-transparent text-[#6B7280] hover:text-[#111827]"
                } ${!editable ? "cursor-default" : ""}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pricing Model — Venue Only only */}
      {!isVenueFood && (
        <PricingSection
          id="pricingModel"
          icon={Building2}
          title="Pricing Model"
          open={open.pricingModel}
          onToggle={toggle}
        >
          <p className={labelCls}>Pricing Model</p>
          <div className="flex flex-wrap gap-2">
            {VENUE_METHOD_OPTIONS.map((opt) => {
              const active = venueMethod === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={!editable}
                  onClick={() => setVenueMethod(opt.value)}
                  className={`h-9 px-3.5 rounded-lg border text-[13px] font-medium transition-colors ${
                    active
                      ? "border-[#C89B3C] bg-[#FFF8F3] text-[#C89B3C]"
                      : "border-[#E8EAF0] text-[#4B5563] hover:border-[#C89B3C]/50"
                  } ${!editable ? "cursor-default" : ""}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </PricingSection>
      )}

      {/* ========== VENUE ONLY ========== */}
      {showFullDay && (
        <PricingSection
          id="venuePricing"
          icon={Building2}
          title="Full Day Price"
          open={open.venuePricing}
          onToggle={toggle}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <Field
              label="Full Day Price *"
              value={String(fullDaySlot?.price || "")}
              editable={editable}
              numeric
              prefix="₹"
              onChange={(v) => {
                const slot = fullDaySlot || ensureFullDaySlot();
                updateSlot(slot.id, { price: Number(v) || 0, enabled: true });
              }}
            />
          </div>
          <div className="mt-3">{advanceGstFields}</div>
        </PricingSection>
      )}

      {showSlots && (
        <PricingSection
          id="slotPricing"
          icon={Building2}
          title="Slot Pricing"
          open={open.slotPricing}
          onToggle={toggle}
          actions={
            editable ? (
              <HeaderAction icon={Plus} label="Add Slot" onClick={addTimedSlot} />
            ) : undefined
          }
        >
          {timedSlots.length === 0 ? (
            <p className="text-sm text-[#6B7280]">
              No slots yet. Add Morning, Afternoon, Evening, or any custom slot.
            </p>
          ) : (
            <div className="space-y-2.5">
              {timedSlots.map((slot) => (
                <VenueSlotCard
                  key={slot.id}
                  slot={slot}
                  editable={editable}
                  allNames={timedSlots.map((s) => s.name)}
                  onChange={(patch) => updateSlot(slot.id, patch)}
                  onDelete={() => removeTimedSlot(slot.id)}
                />
              ))}
            </div>
          )}
          <div className="mt-3">{advanceGstFields}</div>
        </PricingSection>
      )}

      {/* ========== VENUE + FOOD — Food Slots only (no pricing model) ========== */}
      {showFoodSlots && (
        <PricingSection
          id="foodSlots"
          icon={UtensilsCrossed}
          title="Food Slots"
          open={open.foodSlots}
          onToggle={toggle}
          actions={
            editable ? (
              <HeaderAction icon={Plus} label="Add Food Slot" onClick={addFoodSlot} />
            ) : undefined
          }
        >
          {foodSlots.length === 0 ? (
            <p className="text-sm text-[#6B7280]">
              No meal slots yet. Add Breakfast, Lunch, Dinner, or any custom meal.
            </p>
          ) : (
            <div className="space-y-2.5">
              {foodSlots.map((slot) => (
                <FoodSlotCard
                  key={slot.id}
                  slot={slot}
                  editable={editable}
                  allNames={foodSlots.map((s) => s.name)}
                  onChange={(patch) => updateFoodSlot(slot.id, patch)}
                  onDelete={() => removeFoodSlot(slot.id)}
                />
              ))}
            </div>
          )}
          <div className="mt-3">{advanceGstFields}</div>
          <p className="mt-2.5 text-[12px] text-[#6B7280]">
            Per-plate price includes venue cost. Booking amount = plate price × guest count.
          </p>
        </PricingSection>
      )}

      {/* Booking Rules */}
      <PricingSection
        id="bookingRules"
        icon={Building2}
        title="Booking Rules & Hours"
        open={open.bookingRules}
        onToggle={toggle}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
          <OperatingHoursField
            label="Operating Hours"
            value={String(form?.operatingHours ?? venue?.operatingHours ?? "")}
            editable={editable}
            onChange={(v) => change("operatingHours", v)}
          />
          <SelectRuleStacked
            label="Booking Window"
            editable={editable}
            value={String(form?.maxAdvanceBookingDays ?? venue?.maxAdvanceBookingDays ?? "180")}
            options={[
              { value: "90", label: "Next 3 Months" },
              { value: "180", label: "Next 6 Months" },
              { value: "365", label: "Next 12 Months" },
              { value: "0", label: "Unlimited" },
            ]}
            onChange={(v) => change("maxAdvanceBookingDays", v)}
          />
          <SelectRuleStacked
            label="Minimum Booking Notice"
            editable={editable}
            value={String(form?.minNoticePeriodHours ?? venue?.minNoticePeriodHours ?? "48")}
            options={[
              { value: "0", label: "Same Day" },
              { value: "24", label: "24 Hours" },
              { value: "48", label: "48 Hours" },
              { value: "72", label: "72 Hours" },
            ]}
            onChange={(v) => change("minNoticePeriodHours", v)}
          />
        </div>
      </PricingSection>

      {/* Preview */}
      <PricingSection
        id="preview"
        icon={Calculator}
        title="Booking Calculation Preview"
        open={open.preview}
        onToggle={toggle}
      >
        <div className="space-y-3">
          {!isVenueFood && effectiveMode === "slot" && timedSlots.length > 0 && (
            <div>
              <p className={labelCls}>Selected Slot</p>
              <div className="flex flex-wrap gap-2">
                {timedSlots.map((s) => (
                  <Chip
                    key={s.id}
                    active={(selectedTimedSlot?.id || "") === s.id}
                    label={`${s.name} · ${formatCurrency(s.price)}`}
                    onClick={() => setPreviewSlotId(s.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {isVenueFood && foodSlots.length > 0 && (
            <div>
              <p className={labelCls}>Selected Meal</p>
              <div className="flex flex-wrap gap-2">
                {foodSlots.map((s) => (
                  <Chip
                    key={s.id}
                    active={(selectedFoodSlot?.id || "") === s.id}
                    label={s.name}
                    onClick={() => setPreviewFoodSlotId(s.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {isVenueFood ? (
            <>
              <div className="max-w-sm rounded-[12px] border border-[#E8EAF0] px-5 py-4">
                <p className="text-[13px] font-semibold text-[#111827] mb-3">
                  Booking Summary
                </p>
                <div className="border-t border-[#E5E7EB]" />

                <div className="py-3 space-y-2.5">
                  <PreviewRow
                    label="Selected Meal"
                    value={selectedFoodSlot?.name || "—"}
                  />
                  <PreviewRow
                    label="Plate Price (Veg)"
                    value={formatCurrency(platePrice)}
                  />
                  <PreviewRow
                    label="Guests"
                    value={String(effectivePreviewGuests)}
                  />
                </div>

                <div className="border-t border-[#E5E7EB]" />

                <div className="py-3 space-y-2.5">
                  <PreviewRow label="Food Amount" value={formatCurrency(foodTotal)} />
                  {gstPct > 0 && (
                    <PreviewRow
                      label={`GST (${gstPct}%)`}
                      value={formatCurrency(gstExtra)}
                    />
                  )}
                </div>

                <div className="border-t border-[#E5E7EB]" />

                <div className="py-3">
                  <PreviewRow
                    label="Total Booking Amount"
                    value={formatCurrency(bookingTotal)}
                    emphasize
                  />
                </div>

                <div className="border-t border-[#E5E7EB]" />

                <div className="py-3">
                  <PreviewRow
                    label={`Advance Booking (${advancePercentNum || 0}%)`}
                    value={formatCurrency(advancePayable)}
                    accent
                  />
                </div>

                <div className="border-t border-[#E5E7EB]" />

                <div className="pt-3">
                  <PreviewRow
                    label="Remaining Balance"
                    value={formatCurrency(remainingBalance)}
                    strong
                  />
                </div>
              </div>
              <p className="text-[11px] text-[#6B7280] max-w-sm leading-relaxed">
                Customer pays only the advance amount online. The remaining balance is
                collected directly by the venue during the event.
              </p>
            </>
          ) : (
            <>
              <div className="max-w-sm rounded-[12px] border border-[#E8EAF0] bg-[#FCFCFD] px-4 py-3 space-y-1">
                <PreviewRow
                  label={
                    effectiveMode === "slot" && selectedTimedSlot
                      ? `Slot Charges (${selectedTimedSlot.name})`
                      : "Full Day Price"
                  }
                  value={formatCurrency(venuePrice)}
                />
                {gstPct > 0 && (
                  <PreviewRow
                    label={`GST (${gstPct}%)`}
                    value={formatCurrency(gstExtra)}
                  />
                )}
                <div className="my-1.5 border-t border-dashed border-[#E5E7EB]" />
                <PreviewRow
                  label="Booking Total"
                  value={formatCurrency(bookingTotal)}
                  strong
                />
                <PreviewRow
                  label="Minimum Booking %"
                  value={`${advancePercentNum || 0}%`}
                />
                <PreviewRow
                  label="Advance Payable"
                  value={formatCurrency(advancePayable)}
                />
                <PreviewRow
                  label={`Platform Commission (${PLATFORM_COMMISSION_PERCENT}%)`}
                  value={formatCurrency(platformCommission)}
                />
                <PreviewRow
                  label="Vendor Receivable"
                  value={formatCurrency(vendorReceivable)}
                />
                <PreviewRow
                  label="Remaining Balance"
                  value={formatCurrency(remainingBalance)}
                />
              </div>
              <p className="text-[11px] text-[#6B7280]">
                Customer pays only the advance online. Commission is deducted from the
                advance.
              </p>
            </>
          )}
        </div>
      </PricingSection>
    </div>
  );
}

/* ---------- Slot cards ---------- */

function VenueSlotCard({
  slot,
  editable,
  allNames,
  onChange,
  onDelete,
}: {
  slot: PricingSlot;
  editable: boolean;
  allNames: string[];
  onChange: (patch: Partial<PricingSlot>) => void;
  onDelete: () => void;
}) {
  const { start, end } = parseTimeLabel(slot.timeLabel || "09:00 - 13:00");
  const duplicate = isDuplicateName(slot.name, allNames);
  const timeError = !isEndAfterStart(start, end);
  const priceError = editable && Number(slot.price) <= 0;

  const setTimes = (which: "start" | "end", next: string) => {
    const s = which === "start" ? next : start;
    const e = which === "end" ? next : end;
    onChange({ timeLabel: formatTimeLabel(s, e) });
  };

  return (
    <div className="rounded-[12px] border border-[#E8EAF0] bg-[#FCFCFD] p-3.5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <Field
              label="Slot Name"
              value={slot.name}
              editable={editable}
              onChange={(v) =>
                onChange({
                  name: v,
                  key: slugifyKey(v) || slot.key,
                })
              }
            />
            {duplicate && (
              <p className="mt-1 text-[11px] text-red-500">Duplicate slot name</p>
            )}
          </div>
          <Field
            label="Slot Price *"
            value={String(slot.price || "")}
            editable={editable}
            numeric
            prefix="₹"
            onChange={(v) => onChange({ price: Number(v) || 0 })}
          />
          {priceError && (
            <p className="sm:col-span-2 -mt-2 text-[11px] text-red-500">Price cannot be zero</p>
          )}
          <div>
            <p className={labelCls}>Start Time</p>
            {editable ? (
              <input
                type="time"
                className={timeCls}
                value={start}
                onChange={(e) => setTimes("start", e.target.value)}
              />
            ) : (
              <div className={`${inputCls} flex items-center bg-[#F8F9FB]`}>
                {formatDisplayTime(start)}
              </div>
            )}
          </div>
          <div>
            <p className={labelCls}>End Time</p>
            {editable ? (
              <input
                type="time"
                className={timeCls}
                value={end}
                onChange={(e) => setTimes("end", e.target.value)}
              />
            ) : (
              <div className={`${inputCls} flex items-center bg-[#F8F9FB]`}>
                {formatDisplayTime(end)}
              </div>
            )}
            {timeError && (
              <p className="mt-1 text-[11px] text-red-500">End time must be after start time</p>
            )}
          </div>
        </div>
        {editable && (
          <button
            type="button"
            onClick={onDelete}
            className="shrink-0 mt-6 p-2 rounded-lg text-[#9CA3AF] hover:text-red-500 hover:bg-red-50"
            aria-label="Delete slot"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function FoodSlotCard({
  slot,
  editable,
  allNames,
  onChange,
  onDelete,
}: {
  slot: FoodSlot;
  editable: boolean;
  allNames: string[];
  onChange: (patch: Partial<FoodSlot>) => void;
  onDelete: () => void;
}) {
  const { start, end } = parseTimeLabel(slot.timeLabel || "12:00 - 15:00");
  const duplicate = isDuplicateName(slot.name, allNames);
  const timeError = !isEndAfterStart(start, end);
  const guestError =
    Number(slot.minGuests) > 0 &&
    Number(slot.maxGuests) > 0 &&
    Number(slot.minGuests) > Number(slot.maxGuests);
  const priceError =
    editable &&
    (Number(slot.vegPlateCost) <= 0 || Number(slot.nonVegPlateCost) <= 0);

  const setTimes = (which: "start" | "end", next: string) => {
    const s = which === "start" ? next : start;
    const e = which === "end" ? next : end;
    onChange({ timeLabel: formatTimeLabel(s, e) });
  };

  return (
    <div className="rounded-[12px] border border-[#E8EAF0] bg-[#FCFCFD] p-3.5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <Field
              label="Meal Name"
              value={slot.name}
              editable={editable}
              onChange={(v) =>
                onChange({
                  name: v,
                  key: slugifyKey(v) || slot.key,
                })
              }
            />
            {duplicate && (
              <p className="mt-1 text-[11px] text-red-500">Duplicate slot name</p>
            )}
          </div>
          <div className="hidden sm:block" />
          <div>
            <p className={labelCls}>Start Time</p>
            {editable ? (
              <input
                type="time"
                className={timeCls}
                value={start}
                onChange={(e) => setTimes("start", e.target.value)}
              />
            ) : (
              <div className={`${inputCls} flex items-center bg-[#F8F9FB]`}>
                {formatDisplayTime(start)}
              </div>
            )}
          </div>
          <div>
            <p className={labelCls}>End Time</p>
            {editable ? (
              <input
                type="time"
                className={timeCls}
                value={end}
                onChange={(e) => setTimes("end", e.target.value)}
              />
            ) : (
              <div className={`${inputCls} flex items-center bg-[#F8F9FB]`}>
                {formatDisplayTime(end)}
              </div>
            )}
            {timeError && (
              <p className="mt-1 text-[11px] text-red-500">End time must be after start time</p>
            )}
          </div>
          <Field
            label="Veg Plate Price *"
            value={String(slot.vegPlateCost || "")}
            editable={editable}
            numeric
            prefix="₹"
            onChange={(v) => onChange({ vegPlateCost: Number(v) || 0 })}
          />
          <Field
            label="Non-Veg Plate Price *"
            value={String(slot.nonVegPlateCost || "")}
            editable={editable}
            numeric
            prefix="₹"
            onChange={(v) => onChange({ nonVegPlateCost: Number(v) || 0 })}
          />
          <Field
            label="Minimum Guests"
            value={String(slot.minGuests || "")}
            editable={editable}
            numeric
            onChange={(v) => onChange({ minGuests: Number(v) || 0 })}
          />
          <Field
            label="Maximum Guests"
            value={String(slot.maxGuests || "")}
            editable={editable}
            numeric
            onChange={(v) => onChange({ maxGuests: Number(v) || 0 })}
          />
          {priceError && (
            <p className="sm:col-span-2 text-[11px] text-red-500">Plate price cannot be zero</p>
          )}
          {guestError && (
            <p className="sm:col-span-2 text-[11px] text-red-500">
              Minimum guests cannot exceed maximum
            </p>
          )}
        </div>
        {editable && (
          <button
            type="button"
            onClick={onDelete}
            className="shrink-0 mt-6 p-2 rounded-lg text-[#9CA3AF] hover:text-red-500 hover:bg-red-50"
            aria-label="Delete food slot"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

function slugifyKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
}

function uniqueSlotName(existing: string[], base: string): string {
  const lower = existing.map((n) => n.toLowerCase());
  if (!lower.includes(base.toLowerCase())) return base;
  let i = 2;
  while (lower.includes(`${base} ${i}`.toLowerCase())) i += 1;
  return `${base} ${i}`;
}

function isDuplicateName(name: string, all: string[]): boolean {
  const n = name.trim().toLowerCase();
  if (!n) return false;
  return all.filter((x) => x.trim().toLowerCase() === n).length > 1;
}

function isEndAfterStart(start: string, end: string): boolean {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em > sh * 60 + sm;
}

function parseTimeLabel(label: string): { start: string; end: string } {
  const parts = label.split(/\s*[–—-]\s*/);
  return {
    start: toInputTime(parts[0]?.trim() || "09:00"),
    end: toInputTime(parts[1]?.trim() || "17:00"),
  };
}

function toInputTime(raw: string): string {
  if (/^\d{1,2}:\d{2}$/.test(raw)) {
    const [h, m] = raw.split(":").map(Number);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  const match = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return "09:00";
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = (match[3] || "").toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatTimeLabel(start: string, end: string): string {
  return `${formatDisplayTime(start)} – ${formatDisplayTime(end)}`;
}

function formatDisplayTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  let h = Number(hStr);
  const m = Number(mStr || 0);
  const meridiem = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return m === 0 ? `${h} ${meridiem}` : `${h}:${String(m).padStart(2, "0")} ${meridiem}`;
}

function PricingSection({
  id,
  icon: Icon,
  title,
  children,
  actions,
  open,
  onToggle,
}: {
  id: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  open: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <section className="bg-white border border-[#E8EAF0] rounded-[14px] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-[#FFF3EB]/60 border-b border-[#E8EAF0]">
        <button
          type="button"
          onClick={() => onToggle(id)}
          className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
        >
          <Icon className="w-4 h-4 text-[#C89B3C] shrink-0" />
          <p className="text-[13px] font-semibold uppercase tracking-wide text-[#111827]">
            {title}
          </p>
        </button>
        {actions && <div className="shrink-0">{actions}</div>}
        <button
          type="button"
          onClick={() => onToggle(id)}
          className="shrink-0 p-0.5 text-[#9CA3AF] hover:text-[#6B7280]"
          aria-label={open ? "Collapse" : "Expand"}
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && <div className="px-4 md:px-5 py-3">{children}</div>}
    </section>
  );
}

function HeaderAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="h-8 px-2.5 rounded-lg border border-[#E8EAF0] bg-white text-[12px] font-medium text-[#4B5563] hover:border-[#C89B3C] hover:text-[#C89B3C] inline-flex items-center gap-1.5"
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 px-3 rounded-lg border text-[13px] font-medium ${
        active
          ? "border-[#C89B3C] bg-[#FFF8F3] text-[#C89B3C]"
          : "border-[#E8EAF0] text-[#4B5563]"
      }`}
    >
      {label}
    </button>
  );
}

function PreviewRow({
  label,
  value,
  strong,
  emphasize,
  accent,
}: {
  label: string;
  value: string;
  strong?: boolean;
  /** Slightly larger + bold (Total Booking Amount) */
  emphasize?: boolean;
  /** Brand orange highlight (Advance Booking) */
  accent?: boolean;
}) {
  const labelClsRow = accent
    ? "text-sm font-semibold text-[#C89B3C]"
    : emphasize
      ? "text-[15px] font-bold text-[#111827]"
      : strong
        ? "text-sm font-semibold text-[#111827]"
        : "text-sm text-[#6B7280]";
  const valueCls = accent
    ? "text-sm shrink-0 font-semibold text-[#C89B3C]"
    : emphasize
      ? "text-[15px] shrink-0 font-bold text-[#111827]"
      : strong
        ? "text-sm shrink-0 font-semibold text-[#111827]"
        : "text-sm shrink-0 font-semibold text-[#111827]";

  return (
    <div className="flex items-center justify-between gap-4">
      <p className={labelClsRow}>{label}</p>
      <p className={valueCls}>{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  editable,
  numeric,
  prefix,
  placeholder,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  editable?: boolean;
  numeric?: boolean;
  prefix?: string;
  placeholder?: string;
}) {
  return (
    <div className="w-full min-w-0">
      <p className={labelCls}>{label}</p>
      {editable ? (
        <div className="relative w-full">
          {prefix ? (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9CA3AF] pointer-events-none">
              {prefix}
            </span>
          ) : null}
          <input
            className={`${inputCls} ${prefix ? "pl-7" : ""}`}
            value={value}
            placeholder={placeholder}
            inputMode={numeric ? "numeric" : undefined}
            onChange={(e) =>
              onChange?.(numeric ? e.target.value.replace(/[^\d.]/g, "") : e.target.value)
            }
          />
        </div>
      ) : (
        <div
          className={`${inputCls} flex items-center bg-[#F8F9FB] ${prefix ? "gap-1" : ""}`}
        >
          {prefix ? <span className="text-[#9CA3AF]">{prefix}</span> : null}
          <span>
            {value
              ? numeric
                ? Number(value).toLocaleString("en-IN")
                : value
              : "—"}
          </span>
        </div>
      )}
    </div>
  );
}

function SelectRuleStacked({
  label,
  value,
  options,
  onChange,
  editable,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  editable: boolean;
}) {
  const display = options.find((o) => o.value === value)?.label || value || "—";
  return (
    <div className="w-full min-w-0">
      <p className={labelCls}>{label}</p>
      {editable ? (
        <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <div className={`${inputCls} flex items-center bg-[#F8F9FB]`}>{display}</div>
      )}
    </div>
  );
}

function OperatingHoursField({
  label,
  value,
  editable,
  onChange,
}: {
  label: string;
  value: string;
  editable: boolean;
  onChange: (v: string) => void;
}) {
  const { start, end } = parseTimeLabel(value || "09:00 - 23:00");

  const update = (which: "start" | "end", next: string) => {
    const startVal = which === "start" ? next : start;
    const endVal = which === "end" ? next : end;
    onChange(formatTimeLabel(startVal, endVal));
  };

  return (
    <div className="w-full min-w-0">
      <p className={labelCls}>{label}</p>
      {editable ? (
        <div className="flex items-center gap-2 w-full">
          <input
            type="time"
            className={timeCls}
            value={start}
            onChange={(e) => update("start", e.target.value)}
            aria-label="Open time"
          />
          <span className="text-sm text-[#9CA3AF] shrink-0">–</span>
          <input
            type="time"
            className={timeCls}
            value={end}
            onChange={(e) => update("end", e.target.value)}
            aria-label="Close time"
          />
        </div>
      ) : (
        <div className={`${inputCls} flex items-center bg-[#F8F9FB]`}>{value || "—"}</div>
      )}
    </div>
  );
}
