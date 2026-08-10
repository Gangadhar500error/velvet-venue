"use client";

import type { ComponentType, ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  Briefcase,
  Building2,
  CalendarDays,
  ChevronDown,
  Copy,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PageBreadcrumb } from "../../_components/ui/PageHeader";
import { Button } from "../../_components/ui/Button";
import { StatusBadge, VerificationBadge } from "../../_components/ui/StatusBadge";
import {
  Gender,
  RegistrationSource,
  VenueOwner,
  VenueOwnerFormValues,
  VenueOwnerStatus,
  VerificationStatus,
} from "../types";
import { cityOptions, formatCurrency, formatDate, formatDateTime } from "../data";
import { useDemoStore } from "../../store/demoStore";
import {
  RelationCard,
  RelatedBookingsTable,
  RelatedBusinessesTable,
  RelatedVenuesTable,
  ViewAllButton,
  bookingsForOwner,
  businessesForOwner,
  summarizeBookings,
  venuesForOwner,
} from "../../_components/relations";
import { EntityViewLayout } from "../../_components/layout/EntityViewLayout";

interface VenueOwnerWorkspaceProps {
  owner: VenueOwner;
  mode: "view" | "edit" | "create";
  form?: VenueOwnerFormValues;
  onChange?: <K extends keyof VenueOwnerFormValues>(key: K, value: VenueOwnerFormValues[K]) => void;
  onEdit?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  onSaveDraft?: () => void;
  onDelete?: () => void;
  saving?: boolean;
  pageLabel?: string;
}

const labelCls =
  "shrink-0 w-[128px] sm:w-[142px] text-sm text-[#6B7280] leading-6 after:content-[':'] after:ml-0.5";
const valueCls = "text-sm font-semibold text-[#111827] leading-6 min-w-0";
const inputCls =
  "w-full min-w-0 h-9 px-0 py-0 bg-transparent border-0 border-b border-[#E5E7EB] rounded-none text-sm font-semibold text-[#111827] placeholder:text-[#9CA3AF] placeholder:font-normal outline-none transition-colors focus:ring-0 focus:border-[#C89B3C]";

export function VenueOwnerWorkspace({
  owner,
  mode,
  form,
  onChange,
  onEdit,
  onCancel,
  onSave,
  onSaveDraft,
  onDelete,
  saving,
  pageLabel,
}: VenueOwnerWorkspaceProps) {
  const router = useRouter();
  const editable = (mode === "edit" || mode === "create") && !!form && !!onChange;
  const isCreate = mode === "create";

  const name = editable
    ? `${form!.firstName} ${form!.lastName}`.trim()
    : owner.name;
  const phone = editable ? form!.phone : owner.phone;
  const email = editable ? form!.email : owner.email;
  const city = editable ? form!.city || owner.city : owner.city;
  const status = editable ? form!.status : owner.status;
  const verification = editable ? form!.verification : owner.verification;
  const sourceLabel = (editable ? form!.source : owner.source).replace(/_/g, " ");
  const initials =
    (name || "VO")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "VO";
  const crumbLabel = pageLabel || name || (isCreate ? "Create Venue Owner" : "Venue Owner");

  const allBookings = useDemoStore((s) => s.bookings);
  const allVenues = useDemoStore((s) => s.venues);
  const allBusinesses = useDemoStore((s) => s.businesses);

  const relatedBusinesses = useMemo(() => {
    const a = businessesForOwner(allBusinesses, owner.id);
    const b = businessesForOwner(allBusinesses, owner.ownerId || "");
    const map = new Map(a.concat(b).map((x) => [x.id, x]));
    return Array.from(map.values());
  }, [allBusinesses, owner.id, owner.ownerId]);

  const relatedVenues = useMemo(() => {
    const a = venuesForOwner(allVenues, owner.id);
    const b = venuesForOwner(allVenues, owner.ownerId || "");
    const map = new Map(a.concat(b).map((x) => [x.id, x]));
    return Array.from(map.values());
  }, [allVenues, owner.id, owner.ownerId]);

  const relatedBookings = useMemo(
    () => bookingsForOwner(allBookings, allVenues, owner),
    [allBookings, allVenues, owner]
  );
  const stats = useMemo(() => summarizeBookings(relatedBookings), [relatedBookings]);

  return (
    <div className="flex flex-col gap-3 animate-fadeIn pb-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "User Management" },
          { label: "Venue Owners", href: "/admin/venue-owners" },
          { label: crumbLabel },
        ]}
      />

      <div className="space-y-3">
        {/* Tabs */}
        <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-4 md:px-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-3 text-sm font-medium border-b-2 -mb-px border-[#C89B3C] text-[#C89B3C]"
            >
              <UserRound className="w-4 h-4" />
              Overview
            </button>
          </div>

          {mode === "view" && (
            <div className="flex flex-wrap items-center gap-2 py-2.5">
              <Button variant="primary" size="sm" icon={Pencil} onClick={onEdit}>
                Edit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={Trash2}
                onClick={onDelete}
                className="!text-[#DC2626] !border-[#FECACA] hover:!bg-[#FEF2F2]"
              >
                Delete
              </Button>
              <span className="hidden sm:block w-px h-6 bg-[#E8EAF0] mx-0.5" aria-hidden />
              <Button
                variant="secondary"
                size="sm"
                icon={Plus}
                onClick={() => router.push("/admin/venue-owners/create")}
              >
                Add
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={Copy}
                onClick={() => router.push(`/admin/venue-owners/create?clone=${owner.id}`)}
              >
                Clone
              </Button>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-4 py-3">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1 text-[13px] text-[#6B7280]">
            <span>
              Date Created{" "}
              <span className="font-semibold text-[#111827]">
                {isCreate ? "—" : formatDateTime(owner.createdAt)}
              </span>
            </span>
            <span className="hidden sm:inline text-[#E8EAF0]">|</span>
            <span>
              Last Updated{" "}
              <span className="font-semibold text-[#111827]">
                {isCreate ? "—" : formatDateTime(owner.updatedAt)}
              </span>
            </span>
          </div>
        </div>

        <EntityViewLayout
          main={
            <div className="relative">
              <div className="space-y-3">
                    {/* Header card */}
                    <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-4 md:px-5 py-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-[12px] bg-[#F3F4F6] text-[#6B7280] text-lg font-semibold flex items-center justify-center shrink-0 border border-[#E8EAF0]">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h1 className="text-xl font-semibold text-[#111827] truncate">
                            {name || (isCreate ? "New Venue Owner" : "—")}
                          </h1>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[#6B7280]">
                            <span>
                              Owner ID:{" "}
                              <span className="font-medium text-[#374151]">
                                {isCreate ? "Auto-generated" : owner.ownerId}
                              </span>
                            </span>
                          </div>
                          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[#4B5563]">
                            <span className="inline-flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" />
                              {phone || "—"}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-[#9CA3AF]" />
                              {email || "—"}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#9CA3AF]" />
                              {city || "—"}
                            </span>
                            <StatusBadge status={status} />
                            <VerificationBadge status={verification} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Owner Information */}
                    <CollapsibleCard icon={UserRound} title="Owner Information" defaultOpen>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
                        <InfoField
                          label="Owner ID"
                          value={isCreate ? "Auto-generated on save" : owner.ownerId}
                        />
                        {editable ? (
                          <>
                            <InfoField
                              label="First Name"
                              required
                              value={form!.firstName}
                              editable
                              onChange={(v) => onChange?.("firstName", v)}
                            />
                            <InfoField
                              label="Last Name"
                              required
                              value={form!.lastName}
                              editable
                              onChange={(v) => onChange?.("lastName", v)}
                            />
                          </>
                        ) : (
                          <InfoField label="Full Name" value={owner.name} />
                        )}
                        <InfoField
                          label="Email"
                          required
                          value={editable ? form!.email : owner.email}
                          editable={editable}
                          onChange={(v) => onChange?.("email", v)}
                        />
                        <InfoField
                          label="Phone"
                          required
                          value={editable ? form!.phone : owner.phone}
                          editable={editable}
                          onChange={(v) => onChange?.("phone", v)}
                        />
                        <InfoField
                          label="Alternate Mobile"
                          value={editable ? form!.alternateMobile : owner.alternateMobile || ""}
                          editable={editable}
                          onChange={(v) => onChange?.("alternateMobile", v)}
                        />
                        {editable ? (
                          <SelectField
                            label="Gender"
                            value={form!.gender}
                            onChange={(v) => onChange!("gender", v as Gender | "")}
                            options={[
                              { value: "", label: "Select" },
                              { value: "male", label: "Male" },
                              { value: "female", label: "Female" },
                              { value: "other", label: "Other" },
                              { value: "prefer_not_to_say", label: "Prefer not to say" },
                            ]}
                          />
                        ) : (
                          <InfoField label="Gender" value={formatGender(owner.gender)} />
                        )}
                        <InfoField
                          label="Business Name"
                          value={editable ? form!.businessName : owner.businessName || ""}
                          editable={editable}
                          onChange={(v) => onChange?.("businessName", v)}
                        />
                        {editable ? (
                          <SelectField
                            label="Business Type"
                            value={form!.businessType}
                            onChange={(v) => onChange!("businessType", v)}
                            options={[
                              { value: "", label: "Select" },
                              { value: "Private Limited", label: "Private Limited" },
                              { value: "Proprietorship", label: "Proprietorship" },
                              { value: "Partnership", label: "Partnership" },
                              { value: "LLP", label: "LLP" },
                            ]}
                          />
                        ) : (
                          <InfoField label="Business Type" value={owner.businessType || "—"} />
                        )}
                        {editable ? (
                          <SelectField
                            label="Registration Source"
                            value={form!.source}
                            onChange={(v) => onChange!("source", v as RegistrationSource)}
                            options={[
                              { value: "website", label: "Website" },
                              { value: "referral", label: "Referral" },
                              { value: "admin", label: "Admin" },
                            ]}
                          />
                        ) : (
                          <InfoField label="Registration Source" value={sourceLabel} />
                        )}
                        {editable ? (
                          <SelectField
                            label="Status"
                            required
                            value={form!.status}
                            onChange={(v) => onChange!("status", v as VenueOwnerStatus)}
                            options={[
                              { value: "active", label: "Active" },
                              { value: "pending", label: "Pending" },
                              { value: "inactive", label: "Inactive" },
                            ]}
                          />
                        ) : (
                          <InlineField label="Status">
                            <StatusBadge status={owner.status} />
                          </InlineField>
                        )}
                        {editable ? (
                          <SelectField
                            label="Verification"
                            value={form!.verification}
                            onChange={(v) => onChange!("verification", v as VerificationStatus)}
                            options={[
                              { value: "verified", label: "Verified" },
                              { value: "pending", label: "Pending" },
                              { value: "rejected", label: "Rejected" },
                            ]}
                          />
                        ) : (
                          <InlineField label="Verification">
                            <VerificationBadge status={owner.verification} />
                          </InlineField>
                        )}
                      </div>
                    </CollapsibleCard>

                    {/* Address */}
                    <CollapsibleCard icon={MapPin} title="Address Details" defaultOpen>
                      <div className="space-y-2">
                        <InfoField
                          label="Address Line 1"
                          value={editable ? form!.addressLine1 : owner.addressLine1 || ""}
                          editable={editable}
                          onChange={(v) => onChange?.("addressLine1", v)}
                          wide
                        />
                        <InfoField
                          label="Address Line 2"
                          value={editable ? form!.addressLine2 : owner.addressLine2 || ""}
                          editable={editable}
                          onChange={(v) => onChange?.("addressLine2", v)}
                          wide
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
                          {editable ? (
                            <SelectField
                              label="City"
                              value={form!.city}
                              onChange={(v) => onChange!("city", v)}
                              options={[
                                { value: "", label: "Select city" },
                                ...cityOptions.map((c) => ({ value: c, label: c })),
                              ]}
                            />
                          ) : (
                            <InfoField label="City" value={owner.city} />
                          )}
                          <InfoField
                            label="State / Province"
                            value={editable ? form!.state : owner.state || ""}
                            editable={editable}
                            onChange={(v) => onChange?.("state", v)}
                          />
                          <InfoField
                            label="Country"
                            value={editable ? form!.country : owner.country}
                            editable={editable}
                            onChange={(v) => onChange?.("country", v)}
                          />
                          <InfoField
                            label="Postal Code"
                            value={editable ? form!.zipCode : owner.zipCode || ""}
                            editable={editable}
                            onChange={(v) => onChange?.("zipCode", v)}
                          />
                        </div>
                      </div>
                    </CollapsibleCard>
                  </div>

                  {editable && (
                    <FormActionBar
                      isCreate={isCreate}
                      saving={saving}
                      onCancel={onCancel}
                      onSave={onSave}
                      onSaveDraft={onSaveDraft}
                    />
                  )}
                </div>
          }
          overview={
            <OwnerOverviewCard
              owner={owner}
              isCreate={isCreate}
              stats={{
                businesses: relatedBusinesses.length,
                venues: relatedVenues.length,
                bookings: stats.total,
                revenue: stats.revenue,
                pending: stats.pending,
                completed: stats.completed,
                upcoming: stats.upcoming,
              }}
            />
          }
          crossReference={
            !isCreate ? (
              <>
                <RelationCard
                  icon={Briefcase}
                  title="Business Profiles"
                  subtitle="Business profiles owned by this venue owner"
                  defaultOpen
                  actions={
                    <ViewAllButton href="/admin/business-profile" label="View All" />
                  }
                >
                  <RelatedBusinessesTable businesses={relatedBusinesses} />
                </RelationCard>

                <RelationCard
                  icon={Building2}
                  title="Venues"
                  subtitle="Venues owned by this venue owner"
                  defaultOpen
                  actions={<ViewAllButton href="/admin/venues" label="View All" />}
                >
                  <RelatedVenuesTable venues={relatedVenues} />
                </RelationCard>

                <RelationCard
                  icon={CalendarDays}
                  title="Bookings"
                  subtitle="Bookings across all venues owned by this venue owner"
                  defaultOpen
                  actions={<ViewAllButton href="/admin/bookings" label="View All Bookings" />}
                >
                  <RelatedBookingsTable bookings={relatedBookings} showCustomer />
                </RelationCard>
              </>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}

function FormActionBar({
  isCreate,
  saving,
  onCancel,
  onSave,
  onSaveDraft,
}: {
  isCreate: boolean;
  saving?: boolean;
  onCancel?: () => void;
  onSave?: () => void;
  onSaveDraft?: () => void;
}) {
  return (
    <div className="sticky bottom-0 z-20 mt-3">
      <div className="flex flex-wrap items-center justify-end gap-2 rounded-t-[14px] border border-b-0 border-[#E8EAF0] bg-white/95 backdrop-blur-md px-4 py-3 shadow-[0_-6px_20px_rgba(16,24,40,0.08)]">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        {isCreate && onSaveDraft && (
          <Button variant="secondary" onClick={onSaveDraft} disabled={saving}>
            Save Draft
          </Button>
        )}
        <Button variant="primary" onClick={onSave} loading={saving}>
          {isCreate ? "Save Venue Owner" : "Update Venue Owner"}
        </Button>
      </div>
    </div>
  );
}

function CollapsibleCard({
  icon: Icon,
  title,
  subtitle,
  children,
  actions,
  defaultOpen = true,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="bg-white border border-[#E8EAF0] rounded-[14px] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#FFF3EB]/60 border-b border-[#E8EAF0]">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
        >
          <Icon className="w-4 h-4 text-[#C89B3C] shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-[#111827]">
              {title}
            </p>
            {subtitle && (
              <p className="text-[12px] text-[#9CA3AF] normal-case tracking-normal">{subtitle}</p>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#9CA3AF] shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {open && <div className="px-4 md:px-5 py-4">{children}</div>}
    </section>
  );
}

function InlineField({
  label,
  required,
  children,
  wide,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`flex items-start gap-2 ${wide ? "w-full" : ""}`}>
      <p className={labelCls}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </p>
      <div className="flex-1 min-w-0 pt-px">{children}</div>
    </div>
  );
}

function InfoField({
  label,
  value,
  editable,
  onChange,
  required,
  wide,
}: {
  label: string;
  value: string;
  editable?: boolean;
  onChange?: (value: string) => void;
  required?: boolean;
  wide?: boolean;
}) {
  return (
    <InlineField label={label} required={required} wide={wide}>
      {editable ? (
        <input className={inputCls} value={value} onChange={(e) => onChange?.(e.target.value)} />
      ) : (
        <p className={valueCls}>{value || "—"}</p>
      )}
    </InlineField>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <InlineField label={label} required={required}>
      <select
        className={`${inputCls} appearance-none cursor-pointer`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value || "empty"} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </InlineField>
  );
}

function OwnerOverviewCard({
  owner,
  isCreate,
  stats,
}: {
  owner: VenueOwner;
  isCreate: boolean;
  stats?: {
    businesses: number;
    venues: number;
    bookings: number;
    revenue: number;
    pending: number;
    completed: number;
    upcoming: number;
  };
}) {
  return (
    <div className="bg-white border border-[#E8EAF0] rounded-[14px] overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="px-4 py-2.5 bg-[#FFF3EB]/70 border-b border-[#E8EAF0]">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-[#111827]">
          Owner Overview
        </p>
        {isCreate && (
          <p className="text-[12px] text-[#9CA3AF] mt-0.5 normal-case tracking-normal">
            Stats appear after the owner is saved
          </p>
        )}
      </div>
      <div className="p-4 space-y-3">
        {isCreate || !stats ? (
          <div className="rounded-[12px] border border-dashed border-[#E8EAF0] bg-[#FCFCFD] px-4 py-10 text-center">
            <p className="text-sm text-[#9CA3AF]">No account activity yet</p>
            <p className="text-[12px] text-[#D1D5DB] mt-1">
              Business and venue stats will show here
            </p>
          </div>
        ) : (
          <>
            <OverviewRow label="Business Profiles" value={String(stats.businesses)} />
            <OverviewRow label="Venues" value={String(stats.venues)} />
            <OverviewRow label="Bookings" value={String(stats.bookings)} />
            <OverviewRow label="Revenue" value={formatCurrency(stats.revenue)} />
            <OverviewRow label="Pending Payments" value={formatCurrency(stats.pending)} />
            <OverviewRow label="Completed Events" value={String(stats.completed)} />
            <OverviewRow label="Upcoming Events" value={String(stats.upcoming)} />
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] text-[#6B7280]">Verification Status</span>
              <VerificationBadge status={owner.verification} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function OverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13px] text-[#6B7280]">{label}</span>
      <span className="text-sm font-semibold text-[#111827]">{value}</span>
    </div>
  );
}

function EmptyBlock({
  icon: Icon,
  text,
}: {
  icon: ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="py-6 text-center">
      <div className="mx-auto w-9 h-9 rounded-xl bg-[#FFF3EB] text-[#C89B3C] flex items-center justify-center mb-2">
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-sm text-[#6B7280]">{text}</p>
    </div>
  );
}

function formatGender(gender?: string) {
  if (!gender) return "—";
  return gender.replace(/_/g, " ");
}
