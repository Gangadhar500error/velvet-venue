"use client";

import { Suspense, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "../../_components/ui/PageHeader";
import { Button } from "../../_components/ui/Button";
import { useDemoStore } from "../../store/demoStore";
import { findInvoiceContext } from "../../_components/relations";
import { InvoiceWorkspace } from "../components/InvoiceWorkspace";

function InvoiceDetailInner() {
  const params = useParams();
  const router = useRouter();
  const rawId = String(params.id || "");
  const bookings = useDemoStore((s) => s.bookings);

  const ctx = useMemo(() => findInvoiceContext(bookings, rawId), [bookings, rawId]);

  if (!ctx) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <PageHeader
          title="Invoice Not Found"
          subtitle="No invoice matches this reference."
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "Finance" },
            { label: "Invoices", href: "/admin/invoices" },
            { label: "Not Found" },
          ]}
          actions={
            <Button
              variant="secondary"
              icon={ArrowLeft}
              onClick={() => router.push("/admin/invoices")}
            >
              Back to Invoices
            </Button>
          }
        />
      </div>
    );
  }

  return <InvoiceWorkspace booking={ctx.booking} invoice={ctx.invoice} />;
}

export default function InvoiceDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white border border-[#E8EAF0] rounded-[14px] p-6 animate-pulse space-y-3">
          <div className="h-10 bg-[#F3F4F6] rounded-lg" />
          <div className="h-64 bg-[#F3F4F6] rounded-lg" />
        </div>
      }
    >
      <InvoiceDetailInner />
    </Suspense>
  );
}
