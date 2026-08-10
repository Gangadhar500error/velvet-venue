"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { VenueOwnerWorkspace } from "../components/VenueOwnerWorkspace";
import { Button } from "../../_components/ui/Button";
import { PageHeader } from "../../_components/ui/PageHeader";
import { confirmAction, notify } from "../../_components/ui/Toast";
import { useDemoStore } from "../../store/demoStore";

export default function ViewVenueOwnerPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const owner = useDemoStore((s) => s.vendors.find((v) => v.id === id || v.ownerId === id));
  const removeVendor = useDemoStore((s) => s.removeVendor);

  if (!owner) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <PageHeader
          title="Venue Owner Not Found"
          subtitle="The requested venue owner record could not be located."
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "User Management" },
            { label: "Venue Owners", href: "/admin/venue-owners" },
            { label: "Not Found" },
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

  return (
    <VenueOwnerWorkspace
      owner={owner}
      mode="view"
      onEdit={() => router.push(`/admin/venue-owners/${owner.id}/edit`)}
      onDelete={async () => {
        const ok = await confirmAction({
          title: "Delete Venue Owner?",
          message: `Are you sure you want to delete ${owner.name}?\n\nThis action cannot be undone.`,
        });
        if (!ok) return;
        removeVendor(owner.id);
        notify.deleted("Venue owner");
        router.push("/admin/venue-owners");
      }}
    />
  );
}
