"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { BusinessProfileWorkspace } from "../components/BusinessProfileWorkspace";
import { Button } from "../../_components/ui/Button";
import { PageHeader } from "../../_components/ui/PageHeader";
import { confirmAction, notify } from "../../_components/ui/Toast";
import type { BusinessDocument, BusinessProfile } from "../types";
import {
  deleteBusinessProfile,
  fetchBusinessProfile,
  mapBusinessProfileDetail,
} from "@/lib/business-profiles";

export default function ViewBusinessProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBusinessProfile(id);
        if (cancelled) return;
        const mapped = mapBusinessProfileDetail(data);
        setBusiness(mapped);
        setDocuments(mapped.documents || []);
      } catch (err) {
        if (!cancelled) {
          setBusiness(null);
          setError(err instanceof Error ? err.message : "Business profile not found");
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
            {error || (
              <>
                No business profile exists for ID{" "}
                <span className="font-medium text-[#111827]">{id}</span>.
              </>
            )}
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
      business={business}
      mode="view"
      documents={documents}
      onDocumentsChange={setDocuments}
      onEdit={() => router.push(`/admin/business-profile/${business.id}/edit`)}
      onDelete={async () => {
        const venueNote =
          business.totalVenues > 0
            ? `\n\nThis will also soft-delete ${business.totalVenues} linked venue(s).`
            : "";
        const ok = await confirmAction({
          title: "Delete Business Profile?",
          message: `Are you sure you want to delete ${business.businessName}?${venueNote}\n\nThis will soft-delete the business profile.`,
          confirmLabel: "Delete",
        });
        if (!ok) return;
        try {
          await deleteBusinessProfile(business.id);
          notify.deleted("Business profile");
          router.push("/admin/business-profile");
        } catch (err) {
          notify.error(err instanceof Error ? err.message : "Delete failed");
        }
      }}
    />
  );
}
