"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { businessToFormValues, isValidIfsc } from "../../data";
import {
  BusinessProfileWorkspace,
  type OwnerSelectOption,
} from "../../components/BusinessProfileWorkspace";
import { BusinessDocument, BusinessProfile, BusinessProfileFormValues } from "../../types";
import { Button } from "../../../_components/ui/Button";
import { PageHeader } from "../../../_components/ui/PageHeader";
import { notify } from "../../../_components/ui/Toast";
import {
  fetchBusinessProfile,
  formToUpdatePayload,
  mapBusinessProfileDetail,
  updateBusinessProfile,
} from "@/lib/business-profiles";
import { fetchVenueOwners, mapVenueOwnerListItem } from "@/lib/venue-owners";

export default function EditBusinessProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [form, setForm] = useState<BusinessProfileFormValues | null>(null);
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);
  const [ownerOptions, setOwnerOptions] = useState<OwnerSelectOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchVenueOwners({ page: 1, page_size: 100, sort_by: "name" });
        if (!cancelled) {
          setOwnerOptions(
            data.items.map(mapVenueOwnerListItem).map((o) => ({
              id: o.id,
              name: o.name,
              email: o.email,
              phone: o.phone,
            }))
          );
        }
      } catch {
        if (!cancelled) setOwnerOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchBusinessProfile(id);
        if (cancelled) return;
        const mapped = mapBusinessProfileDetail(data);
        setBusiness(mapped);
        setForm(businessToFormValues(mapped));
        setDocuments(mapped.documents || []);
      } catch {
        if (!cancelled) {
          setBusiness(null);
          setForm(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C89B3C]" />
      </div>
    );
  }

  if (!business || !form) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <PageHeader
          title="Business Profile Not Found"
          subtitle="Unable to edit a missing business profile."
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
    if (!form.businessName.trim() || !form.legalBusinessName.trim() || !form.businessType.trim()) {
      notify.validation("Business name, legal name, and business type are required.");
      return;
    }
    if (form.ifscCode.trim() && !isValidIfsc(form.ifscCode)) {
      notify.validation("Please enter a valid IFSC code (e.g. HDFC0001234).");
      return;
    }
    setSaving(true);
    try {
      const result = await updateBusinessProfile(business.id, formToUpdatePayload(form));
      notify.updated("Business profile");
      router.push(`/admin/business-profile/${result.business_profile.id}`);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Failed to update business profile");
    } finally {
      setSaving(false);
    }
  };

  const liveBusiness: BusinessProfile = {
    ...business,
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
    initials: (form.businessName || business.businessName)
      .split(" ")
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
      ownerOptions={ownerOptions}
    />
  );
}
