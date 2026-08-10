"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CustomerWorkspace } from "../components/CustomerWorkspace";
import { Button } from "../../_components/ui/Button";
import { PageHeader } from "../../_components/ui/PageHeader";
import { confirmAction, notify } from "../../_components/ui/Toast";
import { useDemoStore } from "../../store/demoStore";

export default function ViewCustomerPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const customer = useDemoStore((s) => s.customers.find((c) => c.id === id || c.customerId === id));
  const removeCustomer = useDemoStore((s) => s.removeCustomer);

  if (!customer) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <PageHeader
          title="Customer Not Found"
          subtitle="The requested customer record could not be located."
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "User Management" },
            { label: "Customers", href: "/admin/customers" },
            { label: "Not Found" },
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

  return (
    <CustomerWorkspace
      customer={customer}
      mode="view"
      onEdit={() => router.push(`/admin/customers/${customer.id}/edit`)}
      onDelete={async () => {
        const ok = await confirmAction({
          title: "Delete Customer?",
          message: `Are you sure you want to delete ${customer.name}?\n\nThis action cannot be undone.`,
        });
        if (!ok) return;
        removeCustomer(customer.id);
        notify.deleted("Customer");
        router.push("/admin/customers");
      }}
    />
  );
}
