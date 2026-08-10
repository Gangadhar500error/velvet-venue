"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { venueOwnerToFormValues } from "../../data";
import { VenueOwnerWorkspace } from "../../components/VenueOwnerWorkspace";
import { VenueOwnerFormValues } from "../../types";
import { Button } from "../../../_components/ui/Button";
import { PageHeader } from "../../../_components/ui/PageHeader";
import { notify } from "../../../_components/ui/Toast";
import { useDemoStore } from "../../../store/demoStore";

export default function EditVenueOwnerPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const owner = useDemoStore((s) => s.vendors.find((v) => v.id === id || v.ownerId === id));
  const updateVendor = useDemoStore((s) => s.updateVendor);
  const [form, setForm] = useState<VenueOwnerFormValues | null>(() =>
    owner ? venueOwnerToFormValues(owner) : null
  );
  const [saving, setSaving] = useState(false);

  if (!owner || !form) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <PageHeader
          title="Venue Owner Not Found"
          subtitle="Unable to edit a missing venue owner record."
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "User Management" },
            { label: "Venue Owners", href: "/admin/venue-owners" },
            { label: "Edit" },
          ]}
          actions={
            <Button variant="secondary" icon={ArrowLeft} onClick={() => router.push("/admin/venue-owners")}>
              Back to Venue Owners
            </Button>
          }
        />
        <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-6 py-14 text-center">
          <p className="text-sm text-[#6B7280] mb-4">
            No venue owner exists for ID <span className="font-medium text-[#111827]">{id}</span>.
          </p>
          <Link
            href="/admin/venue-owners"
            className="text-sm font-medium text-[#C89B3C] hover:underline"
          >
            Return to venue owner list
          </Link>
        </div>
      </div>
    );
  }

  const update = <K extends keyof VenueOwnerFormValues>(key: K, value: VenueOwnerFormValues[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleCancel = () => router.push(`/admin/venue-owners/${owner.id}`);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    const displayName = `${form.firstName} ${form.lastName}`.trim();
    updateVendor(owner.id, {
      firstName: form.firstName,
      lastName: form.lastName,
      name: displayName || owner.name,
      email: form.email || owner.email,
      phone: form.phone || owner.phone,
      alternateMobile: form.alternateMobile,
      gender: form.gender || owner.gender,
      businessName: form.businessName,
      businessType: form.businessType,
      city: form.city || owner.city,
      country: form.country || owner.country,
      addressLine1: form.addressLine1,
      addressLine2: form.addressLine2,
      state: form.state,
      zipCode: form.zipCode,
      source: form.source,
      status: form.status,
      verification: form.verification,
      initials: (displayName || owner.name)
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    });
    setSaving(false);
    notify.updated("Venue owner");
    router.push(`/admin/venue-owners/${owner.id}`);
  };

  const displayName = `${form.firstName} ${form.lastName}`.trim();

  const liveOwner = {
    ...owner,
    firstName: form.firstName,
    lastName: form.lastName,
    name: displayName || owner.name,
    email: form.email || owner.email,
    phone: form.phone || owner.phone,
    alternateMobile: form.alternateMobile,
    gender: form.gender || owner.gender,
    businessName: form.businessName,
    businessType: form.businessType,
    city: form.city || owner.city,
    country: form.country || owner.country,
    addressLine1: form.addressLine1,
    addressLine2: form.addressLine2,
    state: form.state,
    zipCode: form.zipCode,
    source: form.source,
    status: form.status,
    verification: form.verification,
    initials: (displayName || owner.name)
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
  };

  return (
    <VenueOwnerWorkspace
      owner={liveOwner}
      mode="edit"
      form={form}
      onChange={update}
      onCancel={handleCancel}
      onSave={handleSave}
      saving={saving}
    />
  );
}
