"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { customerToFormValues } from "../../data";
import { CustomerWorkspace } from "../../components/CustomerWorkspace";
import { CustomerFormValues } from "../../types";
import { Button } from "../../../_components/ui/Button";
import { PageHeader } from "../../../_components/ui/PageHeader";
import { notify } from "../../../_components/ui/Toast";
import { useDemoStore } from "../../../store/demoStore";

export default function EditCustomerPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const customer = useDemoStore((s) => s.customers.find((c) => c.id === id || c.customerId === id));
  const updateCustomer = useDemoStore((s) => s.updateCustomer);
  const [form, setForm] = useState<CustomerFormValues | null>(() =>
    customer ? customerToFormValues(customer) : null
  );
  const [saving, setSaving] = useState(false);

  if (!customer || !form) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <PageHeader
          title="Customer Not Found"
          subtitle="Unable to edit a missing customer record."
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "User Management" },
            { label: "Customers", href: "/admin/customers" },
            { label: "Edit" },
          ]}
          actions={
            <Button variant="secondary" icon={ArrowLeft} onClick={() => router.push("/admin/customers")}>
              Back to Customers
            </Button>
          }
        />
        <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-6 py-14 text-center">
          <p className="text-sm text-[#6B7280] mb-4">
            No customer exists for ID <span className="font-medium text-[#111827]">{id}</span>.
          </p>
          <Link
            href="/admin/customers"
            className="text-sm font-medium text-[#C89B3C] hover:underline"
          >
            Return to customer list
          </Link>
        </div>
      </div>
    );
  }

  const update = <K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleCancel = () => router.push(`/admin/customers/${customer.id}`);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    updateCustomer(customer.id, {
      name: form.name || customer.name,
      email: form.email || customer.email,
      phone: form.phone || customer.phone,
      city: form.city || customer.city,
      country: form.country || customer.country,
      addressLine1: form.addressLine1,
      addressLine2: form.addressLine2,
      state: form.state,
      zipCode: form.zipCode,
      gender: form.gender || customer.gender,
      dob: form.dob || customer.dob,
      source: form.source,
      status: form.status,
      verification: form.verification,
      emailVerified: form.emailVerified,
      mobileVerified: form.mobileVerified,
      communicationPreference: form.communicationPreference,
      notes: form.notes,
      initials: (form.name || customer.name)
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    });
    setSaving(false);
    notify.updated("Customer");
    router.push(`/admin/customers/${customer.id}`);
  };

  const liveCustomer = {
    ...customer,
    name: form.name || customer.name,
    email: form.email || customer.email,
    phone: form.phone || customer.phone,
    city: form.city || customer.city,
    country: form.country || customer.country,
    addressLine1: form.addressLine1,
    addressLine2: form.addressLine2,
    state: form.state,
    zipCode: form.zipCode,
    gender: form.gender || customer.gender,
    dob: form.dob || customer.dob,
    source: form.source,
    status: form.status,
    verification: form.verification,
    emailVerified: form.emailVerified,
    mobileVerified: form.mobileVerified,
    communicationPreference: form.communicationPreference,
    notes: form.notes,
    initials: (form.name || customer.name)
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
  };

  return (
    <CustomerWorkspace
      customer={liveCustomer}
      mode="edit"
      form={form}
      onChange={update}
      onCancel={handleCancel}
      onSave={handleSave}
      saving={saving}
    />
  );
}
