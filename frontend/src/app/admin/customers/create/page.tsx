"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomerWorkspace } from "../components/CustomerWorkspace";
import {
  blankCustomer,
  customerToFormValues,
  emptyCustomerForm,
} from "../data";
import { CustomerFormValues } from "../types";
import { notify } from "../../_components/ui/Toast";
import { useDemoStore } from "../../store/demoStore";

function CreateCustomerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cloneId = searchParams.get("clone");
  const customers = useDemoStore((s) => s.customers);
  const addCustomer = useDemoStore((s) => s.addCustomer);
  const nextCustomerIds = useDemoStore((s) => s.nextCustomerIds);
  const source = cloneId
    ? customers.find((c) => c.id === cloneId || c.customerId === cloneId)
    : undefined;
  const isClone = Boolean(source);

  const initialForm = useMemo(() => {
    if (!source) return emptyCustomerForm;
    const cloned = customerToFormValues(source);
    return {
      ...cloned,
      name: `${cloned.name} (Copy)`,
      email: "",
      emailVerified: false,
      mobileVerified: false,
      status: "pending" as const,
      verification: "pending" as const,
      notes: "",
    };
  }, [source]);

  const [form, setForm] = useState<CustomerFormValues>(initialForm);
  const [saving, setSaving] = useState(false);

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
    if (!form.name.trim() || !form.email.trim()) {
      notify.validation("Customer name and email are required.");
      return;
    }
    if (customers.some((c) => c.email.toLowerCase() === form.email.trim().toLowerCase())) {
      notify.validation("Customer already exists.");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    const ids = nextCustomerIds();
    addCustomer(
      blankCustomer({
        id: ids.id,
        customerId: ids.customerId,
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
      })
    );
    setSaving(false);
    notify.created("Customer");
    router.push("/admin/customers");
  };

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
