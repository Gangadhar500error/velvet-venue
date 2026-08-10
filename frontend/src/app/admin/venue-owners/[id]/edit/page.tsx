"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { venueOwnerToFormValues } from "../../data";
import { VenueOwnerWorkspace } from "../../components/VenueOwnerWorkspace";
import { VenueOwner, VenueOwnerFormValues } from "../../types";
import { Button } from "../../../_components/ui/Button";
import { PageHeader } from "../../../_components/ui/PageHeader";
import { notify } from "../../../_components/ui/Toast";
import {
  fetchVenueOwner,
  formToUpdatePayload,
  mapVenueOwnerDetail,
  updateVenueOwner,
} from "@/lib/venue-owners";

export default function EditVenueOwnerPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [owner, setOwner] = useState<VenueOwner | null>(null);
  const [form, setForm] = useState<VenueOwnerFormValues | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchVenueOwner(id);
        if (cancelled) return;
        const mapped = mapVenueOwnerDetail(data);
        setOwner(mapped);
        setForm(venueOwnerToFormValues(mapped));
      } catch {
        if (!cancelled) {
          setOwner(null);
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
            <Button
              variant="secondary"
              icon={ArrowLeft}
              onClick={() => router.push("/admin/venue-owners")}
            >
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
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.phone.trim()) {
      notify.validation("First name, last name, email, and phone are required.");
      return;
    }
    setSaving(true);
    try {
      const result = await updateVenueOwner(owner.id, formToUpdatePayload(form));
      notify.updated("Venue Owner");
      router.push(`/admin/venue-owners/${result.venue_owner.id}`);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Failed to update venue owner");
    } finally {
      setSaving(false);
    }
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
