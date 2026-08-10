"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { VenueOwnerWorkspace } from "../components/VenueOwnerWorkspace";
import { Button } from "../../_components/ui/Button";
import { PageHeader } from "../../_components/ui/PageHeader";
import { confirmAction, notify } from "../../_components/ui/Toast";
import type { VenueOwner } from "../types";
import { deleteVenueOwner, fetchVenueOwner, mapVenueOwnerDetail } from "@/lib/venue-owners";

export default function ViewVenueOwnerPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [owner, setOwner] = useState<VenueOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchVenueOwner(id);
        if (!cancelled) setOwner(mapVenueOwnerDetail(data));
      } catch (err) {
        if (!cancelled) {
          setOwner(null);
          setError(err instanceof Error ? err.message : "Venue owner not found");
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
            {error || (
              <>
                No venue owner exists for ID{" "}
                <span className="font-medium text-[#111827]">{id}</span>.
              </>
            )}
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
          message: `Are you sure you want to delete ${owner.name}?\n\nThis will soft-delete the owner and deactivate their login.`,
        });
        if (!ok) return;
        try {
          await deleteVenueOwner(owner.id);
          notify.deleted("Venue Owner");
          router.push("/admin/venue-owners");
        } catch (err) {
          notify.error(err instanceof Error ? err.message : "Delete failed");
        }
      }}
    />
  );
}
