"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BusinessProfileWorkspace } from "../components/BusinessProfileWorkspace";
import {
  blankBusinessProfile,
  businessToFormValues,
  defaultDocumentSlots,
  emptyBusinessForm,
  isValidIfsc,
} from "../data";
import { BusinessDocument, BusinessProfileFormValues } from "../types";
import { notify } from "../../_components/ui/Toast";
import { useDemoStore } from "../../store/demoStore";

function CreateBusinessProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cloneId = searchParams.get("clone");
  const businesses = useDemoStore((s) => s.businesses);
  const addBusiness = useDemoStore((s) => s.addBusiness);
  const nextBusinessIds = useDemoStore((s) => s.nextBusinessIds);
  const source = cloneId
    ? businesses.find((b) => b.id === cloneId || b.businessId === cloneId)
    : undefined;
  const isClone = Boolean(source);

  const initialForm = useMemo(() => {
    if (!source) return emptyBusinessForm;
    const cloned = businessToFormValues(source);
    return {
      ...cloned,
      businessName: `${cloned.businessName} (Copy)`,
      status: "pending" as const,
      verification: "pending" as const,
    };
  }, [source]);

  const [form, setForm] = useState<BusinessProfileFormValues>(initialForm);
  const [documents, setDocuments] = useState<BusinessDocument[]>(() =>
    source?.documents?.length ? source.documents.map((d) => ({ ...d })) : defaultDocumentSlots()
  );
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof BusinessProfileFormValues>(
    key: K,
    value: BusinessProfileFormValues[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const liveBusiness = blankBusinessProfile({
    businessName: form.businessName,
    legalBusinessName: form.legalBusinessName,
    businessType: form.businessType,
    businessDescription: form.businessDescription,
    website: form.website,
    yearsInBusiness: Number(form.yearsInBusiness) || 0,
    ownerId: form.ownerId,
    ownerName: form.ownerName,
    ownerEmail: form.ownerEmail,
    ownerPhone: form.ownerPhone,
    supportEmail: form.supportEmail,
    supportPhone: form.supportPhone,
    alternatePhone: form.alternatePhone,
    addressLine1: form.addressLine1,
    addressLine2: form.addressLine2,
    city: form.city,
    state: form.state,
    country: form.country,
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
    initials: (form.businessName || "NB")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
  });

  const handleCancel = () => {
    if (source) router.push(`/admin/business-profile/${source.id}`);
    else router.push("/admin/business-profile");
  };

  const handleSave = async () => {
    if (!form.businessName.trim() || !form.ownerId.trim() || !form.city.trim()) {
      notify.validation("Business name, venue owner and city are required.");
      return;
    }
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
    const ids = nextBusinessIds();
    addBusiness(
      blankBusinessProfile({
        id: ids.id,
        businessId: ids.businessId,
        businessName: form.businessName,
        legalBusinessName: form.legalBusinessName,
        businessType: form.businessType,
        businessDescription: form.businessDescription,
        website: form.website,
        yearsInBusiness: Number(form.yearsInBusiness) || 0,
        ownerId: form.ownerId,
        ownerName: form.ownerName,
        ownerEmail: form.ownerEmail,
        ownerPhone: form.ownerPhone,
        supportEmail: form.supportEmail,
        supportPhone: form.supportPhone,
        alternatePhone: form.alternatePhone,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        state: form.state,
        country: form.country,
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
        initials: (form.businessName || "NB")
          .split(" ")
          .filter(Boolean)
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
      })
    );
    setSaving(false);
    notify.created("Business profile");
    router.push("/admin/business-profile");
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    router.push("/admin/business-profile");
  };

  return (
    <BusinessProfileWorkspace
      business={liveBusiness}
      mode="create"
      form={form}
      onChange={update}
      documents={documents}
      onDocumentsChange={setDocuments}
      onCancel={handleCancel}
      onSave={handleSave}
      onSaveDraft={handleSaveDraft}
      saving={saving}
      pageLabel={isClone ? "Clone Business Profile" : "Create Business Profile"}
    />
  );
}

export default function CreateBusinessProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white border border-[#E8EAF0] rounded-[14px] p-6 animate-pulse space-y-3">
          <div className="h-10 bg-[#F3F4F6] rounded-lg" />
          <div className="h-24 bg-[#F3F4F6] rounded-lg" />
        </div>
      }
    >
      <CreateBusinessProfileContent />
    </Suspense>
  );
}
