"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BusinessProfileWorkspace } from "../components/BusinessProfileWorkspace";
import type { OwnerSelectOption } from "../components/BusinessProfileWorkspace";
import {
  blankBusinessProfile,
  businessToFormValues,
  defaultDocumentSlots,
  emptyBusinessForm,
  isValidIfsc,
} from "../data";
import { BusinessDocument, BusinessProfileFormValues } from "../types";
import { notify } from "../../_components/ui/Toast";
import {
  createBusinessProfile,
  fetchBusinessProfile,
  formToCreatePayload,
  mapBusinessProfileDetail,
} from "@/lib/business-profiles";
import { fetchVenueOwners, mapVenueOwnerListItem } from "@/lib/venue-owners";

function CreateBusinessProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cloneId = searchParams.get("clone");
  const [sourceForm, setSourceForm] = useState<BusinessProfileFormValues | null>(null);
  const [sourceDocs, setSourceDocs] = useState<BusinessDocument[] | null>(null);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [loadingClone, setLoadingClone] = useState(Boolean(cloneId));
  const [ownerOptions, setOwnerOptions] = useState<OwnerSelectOption[]>([]);
  const [form, setForm] = useState<BusinessProfileFormValues>(emptyBusinessForm);
  const [documents, setDocuments] = useState<BusinessDocument[]>(defaultDocumentSlots);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchVenueOwners({ page: 1, page_size: 100, sort_by: "name" });
        if (cancelled) return;
        setOwnerOptions(
          data.items.map(mapVenueOwnerListItem).map((o) => ({
            id: o.id,
            name: o.name,
            email: o.email,
            phone: o.phone,
          }))
        );
      } catch {
        if (!cancelled) setOwnerOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!cloneId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchBusinessProfile(cloneId);
        if (cancelled) return;
        const mapped = mapBusinessProfileDetail(data);
        const cloned = businessToFormValues(mapped);
        setSourceId(mapped.id);
        setSourceForm({
          ...cloned,
          businessName: `${cloned.businessName} (Copy)`,
          status: "pending",
          verification: "pending",
        });
        setSourceDocs(
          mapped.documents?.length
            ? mapped.documents.map((d) => ({ ...d, status: "pending" as const, fileName: undefined, fileSize: undefined, uploadedDate: "" }))
            : defaultDocumentSlots()
        );
      } catch {
        if (!cancelled) notify.error("Unable to load business profile to clone.");
      } finally {
        if (!cancelled) setLoadingClone(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cloneId]);

  useEffect(() => {
    if (sourceForm) setForm(sourceForm);
  }, [sourceForm]);

  useEffect(() => {
    if (sourceDocs) setDocuments(sourceDocs);
  }, [sourceDocs]);

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
    if (sourceId) router.push(`/admin/business-profile/${sourceId}`);
    else router.push("/admin/business-profile");
  };

  const handleSave = async () => {
    if (!form.businessName.trim() || !form.legalBusinessName.trim() || !form.businessType.trim()) {
      notify.validation("Business name, legal name, and business type are required.");
      return;
    }
    if (!form.ownerId.trim() || !form.city.trim()) {
      notify.validation("Venue owner and city are required.");
      return;
    }
    if (form.ifscCode.trim() && !isValidIfsc(form.ifscCode)) {
      notify.validation("Please enter a valid IFSC code (e.g. HDFC0001234).");
      return;
    }
    setSaving(true);
    try {
      const result = await createBusinessProfile(formToCreatePayload(form));
      notify.created("Business profile");
      router.push(`/admin/business-profile/${result.business_profile.id}`);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Failed to create business profile");
    } finally {
      setSaving(false);
    }
  };

  if (loadingClone) {
    return (
      <div className="bg-white border border-[#E8EAF0] rounded-[14px] p-6 animate-pulse space-y-3">
        <div className="h-10 bg-[#F3F4F6] rounded-lg" />
        <div className="h-24 bg-[#F3F4F6] rounded-lg" />
      </div>
    );
  }

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
      saving={saving}
      ownerOptions={ownerOptions}
      pageLabel={sourceForm ? "Clone Business Profile" : "Create Business Profile"}
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
