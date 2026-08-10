"use client";

import type { ComponentType, ReactNode } from "react";
import { useRef, useState } from "react";
import {
  Building2,
  CalendarDays,
  ChevronDown,
  Copy,
  CreditCard,
  FileText,
  Landmark,
  LayoutGrid,
  MapPin,
  Pencil,
  Phone,
  Plus,
  StickyNote,
  Trash2,
  Upload,
  UserRound,
  Download,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PageBreadcrumb } from "../../_components/ui/PageHeader";
import { Button } from "../../_components/ui/Button";
import { StatusBadge, VerificationBadge } from "../../_components/ui/StatusBadge";
import {
  BusinessDocument,
  BusinessProfile,
  BusinessProfileFormValues,
  BusinessStatus,
  VerificationStatus,
} from "../types";
import { cityOptions, formatDate, formatDateTime, isValidIfsc } from "../data";
import { DocumentsManager } from "./DocumentsManager";
import {
  EntityLink,
  entityHref,
  RelationCard,
  RelationEmpty,
  ViewAllButton,
} from "../../_components/relations";
import { EntityViewLayout } from "../../_components/layout/EntityViewLayout";
import type { BusinessVenue } from "../types";

type TabKey = "overview" | "documents";

export type OwnerSelectOption = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

interface BusinessProfileWorkspaceProps {
  business: BusinessProfile;
  mode: "view" | "edit" | "create";
  form?: BusinessProfileFormValues;
  onChange?: <K extends keyof BusinessProfileFormValues>(
    key: K,
    value: BusinessProfileFormValues[K]
  ) => void;
  documents?: BusinessDocument[];
  onDocumentsChange?: (documents: BusinessDocument[]) => void;
  onEdit?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  onSaveDraft?: () => void;
  onDelete?: () => void;
  saving?: boolean;
  /** Breadcrumb label override (e.g. Create / Clone) */
  pageLabel?: string;
  ownerOptions?: OwnerSelectOption[];
}

const labelCls =
  "shrink-0 w-[128px] sm:w-[142px] text-sm text-[#6B7280] leading-6 after:content-[':'] after:ml-0.5";
const valueCls = "text-sm font-semibold text-[#111827] leading-6 min-w-0";
const inputCls =
  "w-full min-w-0 h-9 px-0 py-0 bg-transparent border-0 border-b border-[#E5E7EB] rounded-none text-sm font-semibold text-[#111827] placeholder:text-[#9CA3AF] placeholder:font-normal outline-none transition-colors focus:ring-0 focus:border-[#C89B3C]";
const textareaCls =
  "w-full min-w-0 px-0 py-1.5 bg-transparent border-0 border-b border-[#E5E7EB] rounded-none text-sm font-semibold text-[#111827] placeholder:text-[#9CA3AF] placeholder:font-normal outline-none transition-colors focus:ring-0 focus:border-[#C89B3C] resize-none";

export function BusinessProfileWorkspace({
  business,
  mode,
  form,
  onChange,
  documents: documentsProp,
  onDocumentsChange,
  onEdit,
  onCancel,
  onSave,
  onSaveDraft,
  onDelete,
  saving,
  pageLabel,
  ownerOptions = [],
}: BusinessProfileWorkspaceProps) {
  const router = useRouter();
  const editable = (mode === "edit" || mode === "create") && !!form && !!onChange;
  const isCreate = mode === "create";
  const [tab, setTab] = useState<TabKey>("overview");
  const [localDocuments, setLocalDocuments] = useState<BusinessDocument[]>(
    () => documentsProp ?? business.documents
  );

  const documents = documentsProp ?? localDocuments;
  const handleDocumentsChange = (next: BusinessDocument[]) => {
    if (onDocumentsChange) onDocumentsChange(next);
    else setLocalDocuments(next);
  };

  const businessName = editable ? form!.businessName : business.businessName;
  const city = editable ? form!.city || business.city : business.city;
  const initials =
    (businessName || "BP")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "BP";
  const crumbLabel = pageLabel || businessName || (isCreate ? "Create Business Profile" : "Business Profile");

  const relatedVenues = business.venues || [];

  const handleOwnerSelect = (ownerId: string) => {
    if (!onChange) return;
    onChange("ownerId", ownerId);
    const owner = ownerOptions.find((o) => o.id === ownerId);
    onChange("ownerName", owner?.name || "");
    onChange("ownerEmail", owner?.email || "");
    onChange("ownerPhone", owner?.phone || "");
  };

  const syncBankProofDocument = (fileName: string, fileSize: string, uploadedDate: string) => {
    const next = documents.map((d) =>
      d.name === "Cancelled Cheque / Bank Proof"
        ? {
            ...d,
            status: "uploaded" as const,
            fileName,
            fileSize,
            uploadedDate,
            verifiedBy: "—",
          }
        : d
    );
    handleDocumentsChange(next);
  };

  const clearBankProofDocument = () => {
    const next = documents.map((d) =>
      d.name === "Cancelled Cheque / Bank Proof"
        ? {
            ...d,
            status: "pending" as const,
            fileName: undefined,
            fileSize: undefined,
            uploadedDate: "",
            verifiedBy: "—",
          }
        : d
    );
    handleDocumentsChange(next);
  };

  const accountHolderName = editable ? form!.accountHolderName : business.accountHolderName;
  const bankName = editable ? form!.bankName : business.bankName;
  const accountNumber = editable ? form!.accountNumber : business.accountNumber;
  const ifscCode = editable ? form!.ifscCode : business.ifscCode;
  const bankProofFileName = editable ? form!.bankProofFileName : business.bankProofFileName;
  const bankProofFileSize = editable ? form!.bankProofFileSize : business.bankProofFileSize;
  const bankProofUploadedDate = editable
    ? form!.bankProofUploadedDate
    : business.bankProofUploadedDate;

  return (
    <div className="flex flex-col gap-3 animate-fadeIn pb-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Venue Management" },
          { label: "Business Profiles", href: "/admin/business-profile" },
          { label: crumbLabel },
        ]}
      />

      <div className="space-y-3">
        {/* Tabs */}
        <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-4 md:px-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            {(
              [
                { key: "overview", label: "Overview", icon: UserRound },
                { key: "documents", label: "Documents", icon: FileText },
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
                onClick={() => router.push("/admin/business-profile/create")}
              >
                Add
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={Copy}
                onClick={() => router.push(`/admin/business-profile/create?clone=${business.id}`)}
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
                {isCreate ? "—" : formatDateTime(business.createdAt)}
              </span>
            </span>
            <span className="hidden sm:inline text-[#E8EAF0]">|</span>
            <span>
              Last Updated{" "}
              <span className="font-semibold text-[#111827]">
                {isCreate ? "—" : formatDateTime(business.updatedAt)}
              </span>
            </span>
          </div>
        </div>

        {tab === "overview" ? (
          <EntityViewLayout
            main={
              <div className="relative">
                <div className="space-y-3">
                    {/* Header card — identity strip only */}
                    <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-4 md:px-5 py-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-[12px] bg-[#F3F4F6] text-[#6B7280] text-lg font-semibold flex items-center justify-center shrink-0 border border-[#E8EAF0]">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h1 className="text-xl font-semibold text-[#111827] truncate">
                            {businessName || (isCreate ? "New Business Profile" : "—")}
                          </h1>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[#4B5563]">
                            <span>
                              Business ID:{" "}
                              <span className="font-medium text-[#374151]">
                                {isCreate ? "Auto-generated" : business.businessId}
                              </span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#9CA3AF]" />
                              {city || "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Business Information */}
                    <CollapsibleCard icon={Building2} title="Business Information" defaultOpen>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
                        <InfoField
                          label="Business ID"
                          value={isCreate ? "Auto-generated on save" : business.businessId}
                        />
                        <InfoField
                          label="Business Name"
                          required
                          value={editable ? form!.businessName : business.businessName}
                          editable={editable}
                          onChange={(v) => onChange?.("businessName", v)}
                        />
                        <InfoField
                          label="Legal Business Name"
                          value={editable ? form!.legalBusinessName : business.legalBusinessName || ""}
                          editable={editable}
                          onChange={(v) => onChange?.("legalBusinessName", v)}
                        />
                        {editable ? (
                          <SelectField
                            label="Business Type"
                            required
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
                          <InfoField label="Business Type" value={business.businessType || "—"} />
                        )}
                        <InfoField
                          label="Website"
                          value={editable ? form!.website : business.website || ""}
                          editable={editable}
                          onChange={(v) => onChange?.("website", v)}
                        />
                        <InfoField
                          label="Years In Business"
                          value={editable ? form!.yearsInBusiness : String(business.yearsInBusiness ?? "")}
                          editable={editable}
                          onChange={(v) => onChange?.("yearsInBusiness", v)}
                        />
                        {editable ? (
                          <SelectField
                            label="Status"
                            required
                            value={form!.status}
                            onChange={(v) => onChange!("status", v as BusinessStatus)}
                            options={[
                              { value: "active", label: "Active" },
                              { value: "pending", label: "Pending" },
                              { value: "inactive", label: "Inactive" },
                            ]}
                          />
                        ) : (
                          <InlineField label="Status">
                            <StatusBadge status={business.status} />
                          </InlineField>
                        )}
                        {editable ? (
                          <SelectField
                            label="Verification Status"
                            value={form!.verification}
                            onChange={(v) => onChange!("verification", v as VerificationStatus)}
                            options={[
                              { value: "verified", label: "Verified" },
                              { value: "pending", label: "Pending" },
                              { value: "rejected", label: "Rejected" },
                            ]}
                          />
                        ) : (
                          <InlineField label="Verification Status">
                            <VerificationBadge status={business.verification} />
                          </InlineField>
                        )}
                      </div>
                      <div className="mt-2">
                        <InfoField
                          label="Business Description"
                          value={editable ? form!.businessDescription : business.businessDescription || ""}
                          editable={editable}
                          onChange={(v) => onChange?.("businessDescription", v)}
                          wide
                          textarea
                        />
                      </div>
                    </CollapsibleCard>

                    {/* Owner Information */}
                    <CollapsibleCard icon={UserRound} title="Owner Information" defaultOpen>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
                        {isCreate && editable ? (
                          <SelectField
                            label="Venue Owner"
                            required
                            value={form!.ownerId}
                            onChange={handleOwnerSelect}
                            options={[
                              { value: "", label: "Select owner" },
                              ...ownerOptions.map((o) => ({ value: o.id, label: o.name })),
                            ]}
                          />
                        ) : (
                          <InfoField
                            label="Venue Owner"
                            value={editable ? form!.ownerName : business.ownerName}
                          />
                        )}
                        <InfoField
                          label="Owner Email"
                          value={editable ? form!.ownerEmail : business.ownerEmail}
                        />
                        <InfoField
                          label="Owner Phone"
                          value={editable ? form!.ownerPhone : business.ownerPhone}
                        />
                      </div>
                    </CollapsibleCard>

                    {/* Business Contact */}
                    <CollapsibleCard icon={Phone} title="Business Contact" defaultOpen>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
                        <InfoField
                          label="Support Email"
                          value={editable ? form!.supportEmail : business.supportEmail || ""}
                          editable={editable}
                          onChange={(v) => onChange?.("supportEmail", v)}
                        />
                        <InfoField
                          label="Support Phone"
                          value={editable ? form!.supportPhone : business.supportPhone || ""}
                          editable={editable}
                          onChange={(v) => onChange?.("supportPhone", v)}
                        />
                        <InfoField
                          label="Alternate Phone"
                          value={editable ? form!.alternatePhone : business.alternatePhone || ""}
                          editable={editable}
                          onChange={(v) => onChange?.("alternatePhone", v)}
                        />
                      </div>
                    </CollapsibleCard>

                    {/* Address Details */}
                    <CollapsibleCard icon={MapPin} title="Address Details" defaultOpen>
                      <div className="space-y-2">
                        <InfoField
                          label="Address Line 1"
                          value={editable ? form!.addressLine1 : business.addressLine1 || ""}
                          editable={editable}
                          onChange={(v) => onChange?.("addressLine1", v)}
                          wide
                        />
                        <InfoField
                          label="Address Line 2"
                          value={editable ? form!.addressLine2 : business.addressLine2 || ""}
                          editable={editable}
                          onChange={(v) => onChange?.("addressLine2", v)}
                          wide
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
                          {editable ? (
                            <SelectField
                              label="City"
                              required
                              value={form!.city}
                              onChange={(v) => onChange!("city", v)}
                              options={[
                                { value: "", label: "Select city" },
                                ...cityOptions.map((c) => ({ value: c, label: c })),
                              ]}
                            />
                          ) : (
                            <InfoField label="City" value={business.city} />
                          )}
                          <InfoField
                            label="State"
                            value={editable ? form!.state : business.state || ""}
                            editable={editable}
                            onChange={(v) => onChange?.("state", v)}
                          />
                          <InfoField
                            label="Country"
                            value={editable ? form!.country : business.country}
                            editable={editable}
                            onChange={(v) => onChange?.("country", v)}
                          />
                          <InfoField
                            label="Postal Code"
                            value={editable ? form!.zipCode : business.zipCode || ""}
                            editable={editable}
                            onChange={(v) => onChange?.("zipCode", v)}
                          />
                        </div>
                      </div>
                    </CollapsibleCard>

                    {/* Legal Information */}
                    <CollapsibleCard icon={Landmark} title="Legal Information" defaultOpen>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
                        <InfoField
                          label="GST Number"
                          value={editable ? form!.gstNumber : business.gstNumber || ""}
                          editable={editable}
                          onChange={(v) => onChange?.("gstNumber", v)}
                        />
                        <InfoField
                          label="PAN Number"
                          value={editable ? form!.panNumber : business.panNumber || ""}
                          editable={editable}
                          onChange={(v) => onChange?.("panNumber", v)}
                        />
                        <InfoField
                          label="Business Registration Number"
                          value={
                            editable
                              ? form!.businessRegistrationNumber
                              : business.businessRegistrationNumber || ""
                          }
                          editable={editable}
                          onChange={(v) => onChange?.("businessRegistrationNumber", v)}
                        />
                      </div>
                    </CollapsibleCard>

                    {/* Bank Details */}
                    <CollapsibleCard
                      icon={CreditCard}
                      title="Bank Details"
                      subtitle="Registered account for platform settlements and payouts"
                      defaultOpen
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
                        <InfoField
                          label="Account Holder Name"
                          required
                          value={accountHolderName || ""}
                          editable={editable}
                          onChange={(v) => onChange?.("accountHolderName", v.slice(0, 150))}
                        />
                        <InfoField
                          label="Bank Name"
                          required
                          value={bankName || ""}
                          editable={editable}
                          onChange={(v) => onChange?.("bankName", v.slice(0, 150))}
                        />
                        <InfoField
                          label="Account Number"
                          required
                          value={accountNumber || ""}
                          editable={editable}
                          onChange={(v) =>
                            onChange?.("accountNumber", v.replace(/\D/g, ""))
                          }
                        />
                        <div>
                          <InfoField
                            label="IFSC Code"
                            required
                            value={ifscCode || ""}
                            editable={editable}
                            onChange={(v) =>
                              onChange?.("ifscCode", v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11))
                            }
                          />
                          {editable && form!.ifscCode && !isValidIfsc(form!.ifscCode) && (
                            <p className="mt-1 ml-[136px] sm:ml-[150px] text-[11px] text-[#DC2626]">
                              Enter a valid IFSC (e.g. HDFC0001234)
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#F3F4F6]">
                        <p className={`${labelCls} mb-2 w-auto after:content-none`}>
                          Cancelled Cheque / Bank Proof
                        </p>
                        <BankProofUpload
                          fileName={bankProofFileName}
                          fileSize={bankProofFileSize}
                          uploadedDate={bankProofUploadedDate}
                          editable={editable}
                          onUpload={(file) => {
                            if (!onChange) return;
                            const size =
                              file.size < 1024 * 1024
                                ? `${(file.size / 1024).toFixed(0)} KB`
                                : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
                            const date = new Date().toISOString().slice(0, 10);
                            onChange("bankProofFileName", file.name);
                            onChange("bankProofFileSize", size);
                            onChange("bankProofUploadedDate", date);
                            syncBankProofDocument(file.name, size, date);
                          }}
                          onClear={() => {
                            if (!onChange) return;
                            onChange("bankProofFileName", "");
                            onChange("bankProofFileSize", "");
                            onChange("bankProofUploadedDate", "");
                            clearBankProofDocument();
                          }}
                        />
                      </div>
                    </CollapsibleCard>

                    {/* Admin Notes */}
                    <CollapsibleCard icon={StickyNote} title="Admin Notes" defaultOpen>
                      <InfoField
                        label="Internal Notes"
                        value={editable ? form!.notes : business.notes || ""}
                        editable={editable}
                        onChange={(v) => onChange?.("notes", v)}
                        wide
                        textarea
                      />
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
            overview={<BusinessOverviewCard business={business} isCreate={isCreate} />}
            crossReference={
              !isCreate ? (
                <>
                  <RelationCard
                    icon={LayoutGrid}
                    title="Venue List"
                    subtitle="All venues under this business profile"
                    defaultOpen
                    actions={<ViewAllButton href="/admin/venues" label="View All" />}
                  >
                    <BusinessVenuesTable venues={relatedVenues} />
                  </RelationCard>

                  <RelationCard
                    icon={CalendarDays}
                    title="Bookings"
                    subtitle="Bookings from all venues under this business"
                    defaultOpen
                    actions={<ViewAllButton href="/admin/bookings" label="View All Bookings" />}
                  >
                    <RelationEmpty icon={CalendarDays} text="No Bookings Found" />
                  </RelationCard>
                </>
              ) : undefined
            }
          />
        ) : (
          <CollapsibleCard
            icon={FileText}
            title="Documents"
            subtitle={
              editable
                ? "Upload and manage verification documents for this business"
                : "Verification documents on file"
            }
            defaultOpen
          >
            <DocumentsManager
              documents={documents}
              onChange={handleDocumentsChange}
              mode={mode}
            />
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
          {isCreate ? "Save Business Profile" : "Update Business Profile"}
        </Button>
      </div>
    </div>
  );
}

function BankProofUpload({
  fileName,
  fileSize,
  uploadedDate,
  editable,
  onUpload,
  onClear,
}: {
  fileName?: string;
  fileSize?: string;
  uploadedDate?: string;
  editable: boolean;
  onUpload: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const hasFile = Boolean(fileName);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />

      {!hasFile ? (
        editable ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) onUpload(file);
            }}
            className={`w-full rounded-[10px] border-2 border-dashed px-4 py-6 text-center transition-colors ${
              dragging
                ? "border-[#C89B3C] bg-[#FFF8F3]"
                : "border-[#E5E7EB] bg-[#FAFAFA] hover:border-[#FFD4B0] hover:bg-[#FFF8F3]"
            }`}
          >
            <Upload
              className={`w-5 h-5 mx-auto mb-1.5 ${dragging ? "text-[#C89B3C]" : "text-[#9CA3AF]"}`}
            />
            <p className="text-sm font-medium text-[#111827]">Upload cancelled cheque or bank proof</p>
            <p className="text-[12px] text-[#9CA3AF] mt-0.5">PDF, JPG or PNG · Optional</p>
          </button>
        ) : (
          <p className="text-sm text-[#9CA3AF]">No bank proof uploaded</p>
        )
      ) : (
        <div className="rounded-[10px] border border-[#E8EAF0] bg-[#FCFCFD] px-3.5 py-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#FFF3EB]">
              <FileText className="h-4 w-4 text-[#C89B3C]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#111827] truncate">{fileName}</p>
              <p className="text-[12px] text-[#9CA3AF] mt-0.5">
                {[fileSize, uploadedDate ? `Uploaded ${formatDate(uploadedDate)}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => window.alert(`Viewing ${fileName}`)}
                  className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-[#E8EAF0] text-[12px] font-medium text-[#4B5563] hover:border-[#FFD4B0] hover:text-[#C89B3C]"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
                <button
                  type="button"
                  onClick={() => window.alert(`Downloading ${fileName}`)}
                  className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-[#E8EAF0] text-[12px] font-medium text-[#4B5563] hover:border-[#FFD4B0] hover:text-[#C89B3C]"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                {editable && (
                  <>
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-[#FFD4B0] bg-[#FFF8F3] text-[12px] font-medium text-[#C89B3C]"
                    >
                      <Upload className="w-3.5 h-3.5" /> Replace
                    </button>
                    <button
                      type="button"
                      onClick={onClear}
                      className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] text-[12px] font-medium text-[#DC2626]"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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
  textarea,
}: {
  label: string;
  value: string;
  editable?: boolean;
  onChange?: (value: string) => void;
  required?: boolean;
  wide?: boolean;
  textarea?: boolean;
}) {
  return (
    <InlineField label={label} required={required} wide={wide}>
      {editable ? (
        textarea ? (
          <textarea
            className={textareaCls}
            rows={2}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
          />
        ) : (
          <input className={inputCls} value={value} onChange={(e) => onChange?.(e.target.value)} />
        )
      ) : (
        <p className={`${valueCls} ${textarea ? "whitespace-pre-wrap" : ""}`}>{value || "—"}</p>
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

function KpiTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "warning" | "muted";
}) {
  const toneCls: Record<string, string> = {
    default: "bg-[#FFF3EB] text-[#C89B3C] border-[#FFE4CC]",
    success: "bg-[#ECFDF3] text-[#16A34A] border-[#D3F8E1]",
    warning: "bg-[#FCFAF8] text-[#F59E0B] border-[#FDE9CB]",
    muted: "bg-[#F3F4F6] text-[#4B5563] border-[#E8EAF0]",
  };
  return (
    <div className={`rounded-[12px] border px-3.5 py-3 ${toneCls[tone]}`}>
      <p className="text-[12px] font-medium opacity-80">{label}</p>
      <p className="text-xl font-semibold mt-0.5">{value}</p>
    </div>
  );
}

function BusinessOverviewCard({
  business,
  isCreate,
}: {
  business: BusinessProfile;
  isCreate: boolean;
}) {
  return (
    <div className="bg-white border border-[#E8EAF0] rounded-[14px] overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="px-4 py-2.5 bg-[#FFF3EB]/70 border-b border-[#E8EAF0]">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-[#111827]">
          Business Overview
        </p>
        {isCreate && (
          <p className="text-[12px] text-[#9CA3AF] mt-0.5 normal-case tracking-normal">
            Stats appear after the business is saved
          </p>
        )}
      </div>
      <div className="p-4 space-y-3">
        {isCreate ? (
          <div className="rounded-[12px] border border-dashed border-[#E8EAF0] bg-[#FCFCFD] px-4 py-10 text-center">
            <p className="text-sm text-[#9CA3AF]">No venue activity yet</p>
            <p className="text-[12px] text-[#D1D5DB] mt-1">
              Venue and verification stats will show here
            </p>
          </div>
        ) : (
          <>
            <OverviewRow label="Total Venues" value={String(business.totalVenues)} />
            <OverviewRow label="Published" value={String(business.publishedVenues)} />
            <OverviewRow label="Pending" value={String(business.pendingVenues)} />
            <OverviewRow label="Inactive" value={String(business.inactiveVenues)} />
            <div className="border-t border-[#E8EAF0] pt-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-[#6B7280]">Verification Status</span>
                <VerificationBadge status={business.verification} />
              </div>
              <OverviewRow label="Business Type" value={business.businessType || "—"} />
              <OverviewRow label="Created Date" value={formatDate(business.createdAt)} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BusinessVenuesTable({ venues }: { venues: BusinessVenue[] }) {
  if (venues.length === 0) {
    return <RelationEmpty icon={LayoutGrid} text="No Venues Available" />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="border-b border-[#E8EAF0] text-left text-[11px] uppercase tracking-wider text-[#6B7280]">
            {["Venue ID", "Venue Name", "Category", "City", "Status"].map((h) => (
              <th key={h} className="pb-2.5 pr-3 font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {venues.map((v) => (
            <tr key={v.id} className="border-b border-[#F3F4F6] last:border-0">
              <td className="py-2.5 pr-3 whitespace-nowrap">
                <EntityLink href={entityHref.venue(v.id)}>{v.venueId}</EntityLink>
              </td>
              <td className="py-2.5 pr-3 font-medium text-[#111827]">{v.name}</td>
              <td className="py-2.5 pr-3 text-[#4B5563]">{v.category || "—"}</td>
              <td className="py-2.5 pr-3 text-[#4B5563]">{v.city || "—"}</td>
              <td className="py-2.5 pr-3 capitalize text-[#4B5563]">{v.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
