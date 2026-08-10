"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { defaultDocumentSlots } from "../data";
import { BusinessProfileWorkspace } from "../components/BusinessProfileWorkspace";
import { BusinessDocument } from "../types";
import { Button } from "../../_components/ui/Button";
import { PageHeader } from "../../_components/ui/PageHeader";
import { confirmAction, notify } from "../../_components/ui/Toast";
import { useDemoStore } from "../../store/demoStore";

export default function ViewBusinessProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const business = useDemoStore((s) => s.businesses.find((b) => b.id === id || b.businessId === id));
  const removeBusiness = useDemoStore((s) => s.removeBusiness);
  const [documents, setDocuments] = useState<BusinessDocument[]>(() =>
    business?.documents?.length
      ? business.documents.map((d) => ({ ...d }))
      : defaultDocumentSlots()
  );

  if (!business) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <PageHeader
          title="Business Profile Not Found"
          subtitle="The requested business profile could not be located."
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "Venue Management" },
            { label: "Business Profiles", href: "/admin/business-profile" },
            { label: "Not Found" },
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

  return (
    <BusinessProfileWorkspace
      business={{ ...business, documents }}
      mode="view"
      documents={documents}
      onDocumentsChange={setDocuments}
      onEdit={() => router.push(`/admin/business-profile/${business.id}/edit`)}
      onDelete={async () => {
        const ok = await confirmAction({
          title: "Delete Business Profile?",
          message: `Are you sure you want to delete ${business.businessName}?\n\nThis action cannot be undone.`,
        });
        if (!ok) return;
        removeBusiness(business.id);
        notify.deleted("Business profile");
        router.push("/admin/business-profile");
      }}
    />
  );
}
