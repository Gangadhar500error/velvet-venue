"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { businessToFormValues, defaultDocumentSlots, isValidIfsc } from "../../data";
import { BusinessProfileWorkspace } from "../../components/BusinessProfileWorkspace";
import { BusinessDocument, BusinessProfileFormValues } from "../../types";
import { Button } from "../../../_components/ui/Button";
import { PageHeader } from "../../../_components/ui/PageHeader";
import { notify } from "../../../_components/ui/Toast";
import { useDemoStore } from "../../../store/demoStore";

export default function EditBusinessProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const business = useDemoStore((s) => s.businesses.find((b) => b.id === id || b.businessId === id));
  const updateBusiness = useDemoStore((s) => s.updateBusiness);
  const [form, setForm] = useState<BusinessProfileFormValues | null>(() =>
    business ? businessToFormValues(business) : null
  );
  const [documents, setDocuments] = useState<BusinessDocument[]>(() =>
    business?.documents?.length
      ? business.documents.map((d) => ({ ...d }))
      : defaultDocumentSlots()
  );
  const [saving, setSaving] = useState(false);

  if (!business || !form) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <PageHeader
          title="Business Profile Not Found"
          subtitle="Unable to edit a missing business profile record."
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "Venue Management" },
            { label: "Business Profiles", href: "/admin/business-profile" },
            { label: "Edit" },
          ]}
          actions={
            <Button
              variant="secondary"
              icon={ArrowLeft}
              onClick={() => router.push("/admin/business-profile")}
            >
              Back to Business Profiles
            </Button>
          }
        />
        <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-6 py-14 text-center">
          <p className="text-sm text-[#6B7280] mb-4">
            No business profile exists for ID <span className="font-medium text-[#111827]">{id}</span>.
          </p>
          <Link
            href="/admin/business-profile"
            className="text-sm font-medium text-[#C89B3C] hover:underline"
          >
            Return to business profile list
          </Link>
        </div>
      </div>
    );
  }

  const update = <K extends keyof BusinessProfileFormValues>(
    key: K,
    value: BusinessProfileFormValues[K]
  ) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleCancel = () => router.push(`/admin/business-profile/${business.id}`);

  const handleSave = async () => {
    if (
      !form.accountHolderName.trim() ||
      !form.bankName.trim() ||
      !form.accountNumber.trim() ||
      !form.ifscCode.trim()
    ) {
      notify.validation("Account holder name, bank name, account number and IFSC code are required.");
      return;
    }
    if (!isValidIfsc(form.ifscCode)) {
      notify.validation("Please enter a valid IFSC code (e.g. HDFC0001234).");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    updateBusiness(business.id, {
      businessName: form.businessName || business.businessName,
      legalBusinessName: form.legalBusinessName,
      businessType: form.businessType,
      businessDescription: form.businessDescription,
      website: form.website,
      yearsInBusiness: Number(form.yearsInBusiness) || business.yearsInBusiness,
      ownerId: form.ownerId || business.ownerId,
      ownerName: form.ownerName || business.ownerName,
      ownerEmail: form.ownerEmail || business.ownerEmail,
      ownerPhone: form.ownerPhone || business.ownerPhone,
      supportEmail: form.supportEmail,
      supportPhone: form.supportPhone,
      alternatePhone: form.alternatePhone,
      addressLine1: form.addressLine1,
      addressLine2: form.addressLine2,
      city: form.city || business.city,
      state: form.state,
      country: form.country || business.country,
      zipCode: form.zipCode,
      gstNumber: form.gstNumber,
      businessRegistrationNumber: form.businessRegistrationNumber,
      panNumber: form.panNumber,
      accountHolderName: form.accountHolderName,
      bankName: form.bankName,
      accountNumber: form.accountNumber,
      ifscCode: form.ifscCode,
      bankProofFileName: form.bankProofFileName,
      bankProofFileSize: form.bankProofFileSize,
      bankProofUploadedDate: form.bankProofUploadedDate,
      notes: form.notes,
      status: form.status,
      verification: form.verification,
      documents,
      initials: (form.businessName || business.businessName)
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    });
    setSaving(false);
    notify.updated("Business profile");
    router.push(`/admin/business-profile/${business.id}`);
  };

  const liveBusiness = {
    ...business,
    businessName: form.businessName || business.businessName,
    legalBusinessName: form.legalBusinessName,
    businessType: form.businessType,
    businessDescription: form.businessDescription,
    website: form.website,
    yearsInBusiness: Number(form.yearsInBusiness) || business.yearsInBusiness,
    ownerId: form.ownerId || business.ownerId,
    ownerName: form.ownerName || business.ownerName,
    ownerEmail: form.ownerEmail || business.ownerEmail,
    ownerPhone: form.ownerPhone || business.ownerPhone,
    supportEmail: form.supportEmail,
    supportPhone: form.supportPhone,
    alternatePhone: form.alternatePhone,
    addressLine1: form.addressLine1,
    addressLine2: form.addressLine2,
    city: form.city || business.city,
    state: form.state,
    country: form.country || business.country,
    zipCode: form.zipCode,
    gstNumber: form.gstNumber,
    businessRegistrationNumber: form.businessRegistrationNumber,
    panNumber: form.panNumber,
    accountHolderName: form.accountHolderName,
    bankName: form.bankName,
    accountNumber: form.accountNumber,
    ifscCode: form.ifscCode,
    bankProofFileName: form.bankProofFileName,
    bankProofFileSize: form.bankProofFileSize,
    bankProofUploadedDate: form.bankProofUploadedDate,
    notes: form.notes,
    status: form.status,
    verification: form.verification,
    documents,
    initials: (form.businessName || business.businessName)
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
  };

  return (
    <BusinessProfileWorkspace
      business={liveBusiness}
      mode="edit"
      form={form}
      onChange={update}
      documents={documents}
      onDocumentsChange={setDocuments}
      onCancel={handleCancel}
      onSave={handleSave}
      saving={saving}
    />
  );
}
