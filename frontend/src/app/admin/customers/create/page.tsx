"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomerWorkspace } from "../components/CustomerWorkspace";
import {
  blankCustomer,
  customerToFormValues,
  emptyCustomerForm,
} from "../data";
import { Customer, CustomerFormValues } from "../types";
import { notify } from "../../_components/ui/Toast";
import {
  createCustomer,
  fetchCustomer,
  formToCreatePayload,
  mapCustomerDetail,
} from "@/lib/customers";

function CreateCustomerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cloneId = searchParams.get("clone");
  const [source, setSource] = useState<Customer | undefined>();
  const [loadingClone, setLoadingClone] = useState(Boolean(cloneId));
  const isClone = Boolean(source);

  useEffect(() => {
    if (!cloneId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchCustomer(cloneId);
        if (!cancelled) setSource(mapCustomerDetail(data));
      } catch {
        if (!cancelled) notify.error("Unable to load customer to clone.");
      } finally {
        if (!cancelled) setLoadingClone(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cloneId]);

  const initialForm = useMemo(() => {
    if (!source) return emptyCustomerForm;
    const cloned = customerToFormValues(source);
    return {
      ...cloned,
      name: `${cloned.name} (Copy)`,
      email: "",
      phone: "",
      emailVerified: false,
      mobileVerified: false,
      status: "pending" as const,
      verification: "pending" as const,
      notes: "",
    };
  }, [source]);

  const [form, setForm] = useState<CustomerFormValues>(emptyCustomerForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const update = <K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const liveCustomer = blankCustomer({
    name: form.name,
    email: form.email,
    phone: form.phone,
    city: form.city,
    country: form.country,
    addressLine1: form.addressLine1,
    addressLine2: form.addressLine2,
    state: form.state,
    zipCode: form.zipCode,
    gender: form.gender || undefined,
    dob: form.dob,
    source: form.source,
    status: form.status,
    verification: form.verification,
    emailVerified: form.emailVerified,
    mobileVerified: form.mobileVerified,
    communicationPreference: form.communicationPreference,
    notes: form.notes,
    initials: (form.name || "NC")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
  });

  const handleCancel = () => {
    if (source) router.push(`/admin/customers/${source.id}`);
    else router.push("/admin/customers");
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      notify.validation("Customer name, email, and mobile are required.");
      return;
    }
    setSaving(true);
    try {
      const result = await createCustomer(formToCreatePayload(form));
      if (result.existed) {
        notify.validation("Customer already exists. Opened existing record.");
        router.push(`/admin/customers/${result.customer.id}`);
        return;
      }
      notify.created("Customer");
      router.push(`/admin/customers/${result.customer.id}`);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Failed to create customer");
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
    <CustomerWorkspace
      customer={liveCustomer}
      mode="create"
      form={form}
      onChange={update}
      onCancel={handleCancel}
      onSave={handleSave}
      saving={saving}
      pageLabel={isClone ? "Clone Customer" : "Create Customer"}
    />
  );
}

export default function CreateCustomerPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white border border-[#E8EAF0] rounded-[14px] p-6 animate-pulse space-y-3">
          <div className="h-10 bg-[#F3F4F6] rounded-lg" />
          <div className="h-24 bg-[#F3F4F6] rounded-lg" />
        </div>
      }
    >
      <CreateCustomerContent />
    </Suspense>
  );
}
