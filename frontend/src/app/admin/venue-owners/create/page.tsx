"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VenueOwnerWorkspace } from "../components/VenueOwnerWorkspace";
import {
  blankVenueOwner,
  emptyVenueOwnerForm,
  venueOwnerToFormValues,
} from "../data";
import { VenueOwner, VenueOwnerFormValues } from "../types";
import { notify } from "../../_components/ui/Toast";
import {
  createVenueOwner,
  fetchVenueOwner,
  formToCreatePayload,
  mapVenueOwnerDetail,
} from "@/lib/venue-owners";

function CreateVenueOwnerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cloneId = searchParams.get("clone");
  const [source, setSource] = useState<VenueOwner | undefined>();
  const [loadingClone, setLoadingClone] = useState(Boolean(cloneId));

  useEffect(() => {
    if (!cloneId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchVenueOwner(cloneId);
        if (!cancelled) setSource(mapVenueOwnerDetail(data));
      } catch {
        if (!cancelled) notify.error("Unable to load venue owner to clone.");
      } finally {
        if (!cancelled) setLoadingClone(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cloneId]);

  const initialForm = useMemo(() => {
    if (!source) return emptyVenueOwnerForm;
    const cloned = venueOwnerToFormValues(source);
    return {
      ...cloned,
      firstName: `${cloned.firstName} (Copy)`,
      email: "",
      status: "pending" as const,
      verification: "pending" as const,
    };
  }, [source]);

  const [form, setForm] = useState<VenueOwnerFormValues>(emptyVenueOwnerForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

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
    initials: (displayName || "VO")
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
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.phone.trim()) {
      notify.validation("First name, last name, email, and phone are required.");
      return;
    }
    setSaving(true);
    try {
      const result = await createVenueOwner(formToCreatePayload(form));
      if (result.existed) {
        notify.validation("Venue owner already exists. Opened existing record.");
        router.push(`/admin/venue-owners/${result.venue_owner.id}`);
        return;
      }
      notify.created("Venue Owner");
      router.push(`/admin/venue-owners/${result.venue_owner.id}`);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Failed to create venue owner");
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
    <VenueOwnerWorkspace
      owner={liveOwner}
      mode="create"
      form={form}
      onChange={update}
      onCancel={handleCancel}
      onSave={handleSave}
      saving={saving}
      pageLabel={source ? "Clone Venue Owner" : "Create Venue Owner"}
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
