"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VenueOwnerWorkspace } from "../components/VenueOwnerWorkspace";
import {
  blankVenueOwner,
  emptyVenueOwnerForm,
  venueOwnerToFormValues,
} from "../data";
import { VenueOwnerFormValues } from "../types";
import { notify } from "../../_components/ui/Toast";
import { useDemoStore } from "../../store/demoStore";

function CreateVenueOwnerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cloneId = searchParams.get("clone");
  const vendors = useDemoStore((s) => s.vendors);
  const addVendor = useDemoStore((s) => s.addVendor);
  const nextVendorIds = useDemoStore((s) => s.nextVendorIds);
  const source = cloneId ? vendors.find((v) => v.id === cloneId) : undefined;
  const isClone = Boolean(source);

  const initialForm = useMemo(() => {
    if (!source) return emptyVenueOwnerForm;
    const cloned = venueOwnerToFormValues(source);
    return {
      ...cloned,
      firstName: `${cloned.firstName} (Copy)`,
      lastName: cloned.lastName,
      email: "",
      status: "pending" as const,
      verification: "pending" as const,
    };
  }, [source]);

  const [form, setForm] = useState<VenueOwnerFormValues>(initialForm);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof VenueOwnerFormValues>(key: K, value: VenueOwnerFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const displayName = `${form.firstName} ${form.lastName}`.trim();

  const liveOwner = blankVenueOwner({
    firstName: form.firstName,
    lastName: form.lastName,
    name: displayName,
    email: form.email,
    phone: form.phone,
    alternateMobile: form.alternateMobile,
    gender: form.gender || undefined,
    businessName: form.businessName,
    businessType: form.businessType,
    city: form.city,
    country: form.country,
    addressLine1: form.addressLine1,
    addressLine2: form.addressLine2,
    state: form.state,
    zipCode: form.zipCode,
    source: form.source,
    status: form.status,
    verification: form.verification,
    initials: (displayName || "NO")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
  });

  const handleCancel = () => {
    if (source) router.push(`/admin/venue-owners/${source.id}`);
    else router.push("/admin/venue-owners");
  };

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      notify.validation("First name, last name and email are required.");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    const ids = nextVendorIds();
    addVendor(
      blankVenueOwner({
        id: ids.id,
        ownerId: ids.ownerId,
        firstName: form.firstName,
        lastName: form.lastName,
        name: displayName,
        email: form.email,
        phone: form.phone,
        alternateMobile: form.alternateMobile,
        gender: form.gender || undefined,
        businessName: form.businessName,
        businessType: form.businessType,
        city: form.city,
        country: form.country,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        state: form.state,
        zipCode: form.zipCode,
        source: form.source,
        status: form.status,
        verification: form.verification,
        initials: (displayName || "NO")
          .split(" ")
          .filter(Boolean)
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
      })
    );
    setSaving(false);
    notify.created("Venue owner");
    router.push("/admin/venue-owners");
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    router.push("/admin/venue-owners");
  };

  return (
    <VenueOwnerWorkspace
      owner={liveOwner}
      mode="create"
      form={form}
      onChange={update}
      onCancel={handleCancel}
      onSave={handleSave}
      onSaveDraft={handleSaveDraft}
      saving={saving}
      pageLabel={isClone ? "Clone Venue Owner" : "Create Venue Owner"}
    />
  );
}

export default function CreateVenueOwnerPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white border border-[#E8EAF0] rounded-[14px] p-6 animate-pulse space-y-3">
          <div className="h-10 bg-[#F3F4F6] rounded-lg" />
          <div className="h-24 bg-[#F3F4F6] rounded-lg" />
        </div>
      }
    >
      <CreateVenueOwnerContent />
    </Suspense>
  );
}
