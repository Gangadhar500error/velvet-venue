"use client";

import type { ComponentType, ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Copy,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Star,
  Trash2,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PageBreadcrumb } from "../../_components/ui/PageHeader";
import { Button } from "../../_components/ui/Button";
import { StatusBadge, VerificationBadge } from "../../_components/ui/StatusBadge";
import {
  Customer,
  CustomerFormValues,
  CustomerStatus,
  Gender,
  RegistrationSource,
  VerificationStatus,
} from "../types";
import { cityOptions, formatCurrency, formatDate, formatDateTime } from "../data";
import { useDemoStore } from "../../store/demoStore";
import {
  RelationCard,
  RelatedBookingsTable,
  RelatedInvoicesTable,
  ViewAllButton,
  bookingsForCustomer,
  flattenInvoices,
} from "../../_components/relations";
import { EntityViewLayout } from "../../_components/layout/EntityViewLayout";
import { FileText } from "lucide-react";

type TabKey = "overview" | "reviews";

interface CustomerWorkspaceProps {
  customer: Customer;
  mode: "view" | "edit" | "create";
  form?: CustomerFormValues;
  onChange?: <K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) => void;
  onEdit?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  saving?: boolean;
  /** Breadcrumb label override (e.g. Create / Clone) */
  pageLabel?: string;
}

const labelCls =
  "shrink-0 w-[128px] sm:w-[142px] text-sm text-[#6B7280] leading-6 after:content-[':'] after:ml-0.5";
const valueCls = "text-sm font-semibold text-[#111827] leading-6 min-w-0";
const inputCls =
  "w-full min-w-0 h-9 px-0 py-0 bg-transparent border-0 border-b border-[#E5E7EB] rounded-none text-sm font-semibold text-[#111827] placeholder:text-[#9CA3AF] placeholder:font-normal outline-none transition-colors focus:ring-0 focus:border-[#C89B3C]";

export function CustomerWorkspace({
  customer,
  mode,
  form,
  onChange,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  saving,
  pageLabel,
}: CustomerWorkspaceProps) {
  const router = useRouter();
  const editable = (mode === "edit" || mode === "create") && !!form && !!onChange;
  const isCreate = mode === "create";
  const [tab, setTab] = useState<TabKey>("overview");
  const [reviewSearch, setReviewSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");

  // Live display values (header stays read-only text; edits only in Customer Information)
  const name = editable ? form!.name : customer.name;
  const phone = editable ? form!.phone : customer.phone;
  const email = editable ? form!.email : customer.email;
  const city = editable ? form!.city || customer.city : customer.city;
  const status = editable ? form!.status : customer.status;
  const verification = editable ? form!.verification : customer.verification;
  const sourceLabel = (editable ? form!.source : customer.source).replace(/_/g, " ");
  const initials =
    (name || "NC")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "NC";
  const crumbLabel = pageLabel || name || (isCreate ? "Create Customer" : "Customer");

  const filteredReviews = useMemo(() => {
    return customer.recentReviews.filter((r) => {
      const matchesRating = ratingFilter ? r.rating === Number(ratingFilter) : true;
      const q = reviewSearch.toLowerCase();
      const matchesSearch =
        !q || r.venue.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q);
      return matchesRating && matchesSearch;
    });
  }, [customer.recentReviews, ratingFilter, reviewSearch]);

  const ratingDistribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    customer.recentReviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1] += 1;
    });
    const total = customer.recentReviews.length || 1;
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: counts[star - 1],
      pct: Math.round((counts[star - 1] / total) * 100),
    }));
  }, [customer.recentReviews]);

  const allBookings = useDemoStore((s) => s.bookings);
  const relatedBookings = useMemo(() => {
    const byCode = bookingsForCustomer(allBookings, customer.customerId);
    const byId = bookingsForCustomer(allBookings, customer.id);
    const map = new Map<string, (typeof allBookings)[0]>();
    [...byCode, ...byId].forEach((b) => map.set(b.id, b));
    return Array.from(map.values());
  }, [allBookings, customer.customerId, customer.id]);
  const relatedInvoices = useMemo(
    () => flattenInvoices(relatedBookings),
    [relatedBookings]
  );

  return (
    <div className="flex flex-col gap-3 animate-fadeIn pb-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "User Management" },
          { label: "Customers", href: "/admin/customers" },
          { label: crumbLabel },
        ]}
      />

      <div className="space-y-3">
        {/* Tabs · View actions only on top */}
        <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-4 md:px-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            {(
              [
                { key: "overview", label: "Overview", icon: UserRound },
                { key: "reviews", label: "Reviews", icon: Star },
              ] as const
            ).map((item) => {
              const active = tab === item.key;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    active
                      ? "border-[#C89B3C] text-[#C89B3C]"
                      : "border-transparent text-[#6B7280] hover:text-[#111827]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
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
                onClick={() => router.push("/admin/customers/create")}
              >
                Add
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={Copy}
                onClick={() => router.push(`/admin/customers/create?clone=${customer.id}`)}
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
                {isCreate ? "—" : formatDateTime(customer.createdAt)}
              </span>
            </span>
            <span className="hidden sm:inline text-[#E8EAF0]">|</span>
            <span>
              Last Updated{" "}
              <span className="font-semibold text-[#111827]">
                {isCreate ? "—" : formatDateTime(customer.updatedAt)}
              </span>
            </span>
          </div>
        </div>

        {tab === "overview" ? (
          <EntityViewLayout
            main={
              <div className="relative">
                <div className="space-y-3">
                    {/* Identity — always read-only */}
                    <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-4 md:px-5 py-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-[12px] bg-[#F3F4F6] text-[#6B7280] text-lg font-semibold flex items-center justify-center shrink-0 border border-[#E8EAF0]">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h1 className="text-xl font-semibold text-[#111827] truncate">
                          {name || (isCreate ? "New Customer" : "—")}
                        </h1>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[#6B7280]">
                          <span>
                            ID:{" "}
                            <span className="font-medium text-[#374151]">
                              {isCreate ? "Auto-generated" : customer.customerId}
                            </span>
                          </span>
                          <span>
                            Member since:{" "}
                            <span className="font-medium text-[#374151]">
                              {isCreate ? "—" : customer.memberSince}
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

                {/* Customer Information — edit only here */}
                <CollapsibleCard icon={UserRound} title="Customer Information" defaultOpen>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
                    <InfoField
                      label="Customer ID"
                      value={isCreate ? "Auto-generated on save" : customer.customerId}
                    />
                    <InfoField
                      label="Customer Name"
                      required
                      value={editable ? form!.name : customer.name}
                      editable={editable}
                      onChange={(v) => onChange?.("name", v)}
                    />
                    <InfoField
                      label="Phone"
                      required
                      value={editable ? form!.phone : customer.phone}
                      editable={editable}
                      onChange={(v) => onChange?.("phone", v)}
                    />
                    <InfoField
                      label="Email"
                      value={editable ? form!.email : customer.email}
                      editable={editable}
                      onChange={(v) => onChange?.("email", v)}
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
                      <InfoField label="Gender" value={formatGender(customer.gender)} />
                    )}
                    {editable ? (
                      <InlineField label="Date of Birth">
                        <input
                          type="date"
                          className={inputCls}
                          value={form!.dob}
                          onChange={(e) => onChange!("dob", e.target.value)}
                        />
                      </InlineField>
                    ) : (
                      <InfoField label="Date of Birth" value={formatDate(customer.dob || "")} />
                    )}
                    {editable ? (
                      <SelectField
                        label="Registration Source"
                        value={form!.source}
                        onChange={(v) => onChange!("source", v as RegistrationSource)}
                        options={[
                          { value: "website", label: "Website" },
                          { value: "mobile_app", label: "Mobile App" },
                          { value: "referral", label: "Referral" },
                          { value: "admin", label: "Admin" },
                          { value: "partner", label: "Partner" },
                        ]}
                      />
                    ) : (
                      <InfoField label="Registration Source" value={sourceLabel} />
                    )}
                    <InfoField label="Member Since" value={customer.memberSince} />
                    {editable ? (
                      <SelectField
                        label="Status"
                        required
                        value={form!.status}
                        onChange={(v) => onChange!("status", v as CustomerStatus)}
                        options={[
                          { value: "active", label: "Active" },
                          { value: "pending", label: "Pending" },
                          { value: "inactive", label: "Inactive" },
                          { value: "blocked", label: "Blocked" },
                        ]}
                      />
                    ) : (
                      <InlineField label="Status">
                        <StatusBadge status={customer.status} />
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
                        <VerificationBadge status={customer.verification} />
                      </InlineField>
                    )}
                  </div>
                </CollapsibleCard>

                <CollapsibleCard icon={MapPin} title="Address Details" defaultOpen>
                  <div className="space-y-2">
                    <InfoField
                      label="Address Line 1"
                      value={editable ? form!.addressLine1 : customer.addressLine1 || ""}
                      editable={editable}
                      onChange={(v) => onChange?.("addressLine1", v)}
                      wide
                    />
                    <InfoField
                      label="Address Line 2"
                      value={editable ? form!.addressLine2 : customer.addressLine2 || ""}
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
                        <InfoField label="City" value={customer.city} />
                      )}
                      <InfoField
                        label="State / Province"
                        value={editable ? form!.state : customer.state || ""}
                        editable={editable}
                        onChange={(v) => onChange?.("state", v)}
                      />
                      <InfoField
                        label="PIN / Postal Code"
                        value={editable ? form!.zipCode : customer.zipCode || ""}
                        editable={editable}
                        onChange={(v) => onChange?.("zipCode", v)}
                      />
                      <InfoField
                        label="Country"
                        value={editable ? form!.country : customer.country}
                        editable={editable}
                        onChange={(v) => onChange?.("country", v)}
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
                    />
                  )}
                </div>
            }
            overview={<AccountOverviewCard customer={customer} isCreate={isCreate} />}
            crossReference={
              !isCreate ? (
                <>
                  <RelationCard
                    icon={CalendarDays}
                    title="Bookings"
                    subtitle="Bookings belonging to this customer"
                    defaultOpen
                    actions={
                      <ViewAllButton href="/admin/bookings" label="View All Bookings" />
                    }
                  >
                    <RelatedBookingsTable bookings={relatedBookings} />
                  </RelationCard>

                  <RelationCard
                    icon={FileText}
                    title="Invoices"
                    subtitle="Invoices generated for this customer's bookings"
                    defaultOpen
                    actions={
                      <ViewAllButton href="/admin/invoices" label="View All Invoices" />
                    }
                  >
                    <RelatedInvoicesTable rows={relatedInvoices} />
                  </RelationCard>
                </>
              ) : undefined
            }
          />
        ) : (
          <CollapsibleCard icon={Star} title="Reviews" subtitle="Customer feedback" defaultOpen>
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="rounded-[12px] border border-[#E8EAF0] bg-[#FFF3EB] px-4 py-3.5 min-w-[140px]">
                <p className="text-[13px] text-[#6B7280]">Average Rating</p>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="w-5 h-5 text-[#C89B3C] fill-current" />
                  <p className="text-2xl font-semibold text-[#111827]">
                    {customer.averageRating > 0 ? customer.averageRating.toFixed(1) : "—"}
                  </p>
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                {ratingDistribution.map((row) => (
                  <div key={row.star} className="flex items-center gap-2.5">
                    <span className="text-[12px] text-[#6B7280] w-8">{row.star}★</span>
                    <div className="flex-1 h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#C89B3C]"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                    <span className="text-[12px] text-[#9CA3AF] w-6 text-right">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                  placeholder="Search reviews..."
                  className={`${inputCls} pl-9`}
                />
              </div>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className={inputCls}
              >
                <option value="">All Ratings</option>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} Stars
                  </option>
                ))}
              </select>
            </div>

            {filteredReviews.length === 0 ? (
              <EmptyBlock icon={Star} text="No reviews found." />
            ) : (
              <div className="space-y-2.5">
                {filteredReviews.map((r) => (
                  <div key={r.id} className="rounded-[12px] border border-[#E8EAF0] bg-[#FCFCFD] px-4 py-3">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <p className="text-sm font-semibold text-[#111827]">{r.venue}</p>
                      <div className="flex items-center gap-1 text-[#C89B3C]">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="text-sm font-semibold">{r.rating}.0</span>
                      </div>
                    </div>
                    <p className="text-sm text-[#4B5563]">{r.comment}</p>
                    <p className="text-[12px] text-[#9CA3AF] mt-1.5">{formatDate(r.date)}</p>
                    {r.reply && (
                      <div className="mt-2 pl-3 border-l-2 border-[#C89B3C]/40">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                          Venue Reply
                        </p>
                        <p className="text-sm text-[#4B5563] mt-0.5">{r.reply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CollapsibleCard>
        )}
      </div>
    </div>
  );
}

function FormActionBar({
  isCreate,
  saving,
  onCancel,
  onSave,
}: {
  isCreate: boolean;
  saving?: boolean;
  onCancel?: () => void;
  onSave?: () => void;
}) {
  return (
    <div className="sticky bottom-0 z-20 mt-3">
      <div className="flex flex-wrap items-center justify-end gap-2 rounded-t-[14px] border border-b-0 border-[#E8EAF0] bg-white/95 backdrop-blur-md px-4 py-3 shadow-[0_-6px_20px_rgba(16,24,40,0.08)]">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onSave} loading={saving}>
          {isCreate ? "Save Customer" : "Update Customer"}
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
      <select className={`${inputCls} appearance-none cursor-pointer`} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value || "empty"} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </InlineField>
  );
}

function AccountOverviewCard({
  customer,
  isCreate,
}: {
  customer: Customer;
  isCreate: boolean;
}) {
  return (
    <div className="bg-white border border-[#E8EAF0] rounded-[14px] overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="px-4 py-2.5 bg-[#FFF3EB]/70 border-b border-[#E8EAF0]">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-[#111827]">
          Account Overview
        </p>
        {isCreate && (
          <p className="text-[12px] text-[#9CA3AF] mt-0.5 normal-case tracking-normal">
            Stats appear after the customer is saved
          </p>
        )}
      </div>
      <div className="p-4 space-y-3">
        {isCreate ? (
          <div className="rounded-[12px] border border-dashed border-[#E8EAF0] bg-[#FCFCFD] px-4 py-10 text-center">
            <p className="text-sm text-[#9CA3AF]">No account activity yet</p>
            <p className="text-[12px] text-[#D1D5DB] mt-1">
              Bookings, payments and ratings will show here
            </p>
          </div>
        ) : (
          <>
            <OverviewRow label="Total Bookings" value={String(customer.bookings)} />
            <OverviewRow label="Upcoming" value={String(customer.upcomingBookings)} />
            <OverviewRow label="Completed" value={String(customer.completedBookings)} />
            <OverviewRow label="Cancelled" value={String(customer.cancelledBookings)} />
            <div className="border-t border-[#E8EAF0] pt-3 space-y-3">
              <OverviewRow label="Lifetime Spend" value={formatCurrency(customer.totalSpend)} />
              <OverviewRow label="Total Paid" value={formatCurrency(customer.totalPaid)} />
              <OverviewRow label="Pending" value={formatCurrency(customer.pendingPayments)} />
              <OverviewRow
                label="Avg Rating"
                value={
                  customer.averageRating > 0
                    ? `${customer.averageRating.toFixed(1)} / 5`
                    : "—"
                }
              />
            </div>
            <div className="border-t border-[#E8EAF0] pt-3">
              <p className="text-[12px] text-[#9CA3AF] mb-1">Last Booking</p>
              <p className="text-sm font-semibold text-[#111827]">
                {customer.lastBooking || "—"}
              </p>
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
