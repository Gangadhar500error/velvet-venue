"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, X } from "lucide-react";
import { defaultDocumentSlots } from "../data";
import { VenueWorkspace } from "../components/VenueWorkspace";
import { Venue, VenueDocument } from "../types";
import { Button } from "../../_components/ui/Button";
import { PageHeader } from "../../_components/ui/PageHeader";
import { confirmAction, notify, toast } from "../../_components/ui/Toast";
import { deleteVenue, fetchVenue, mapVenueDetail } from "@/lib/venues";

function ViewVenueContent() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [documents, setDocuments] = useState<VenueDocument[]>(defaultDocumentSlots);
  const [showCreatedBanner, setShowCreatedBanner] = useState(false);
  const tabParam = searchParams.get("tab");
  const initialTab =
    tabParam === "availability" ||
    tabParam === "gallery" ||
    tabParam === "pricing" ||
    tabParam === "documents" ||
    tabParam === "reviews" ||
    tabParam === "overview"
      ? tabParam
      : undefined;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchVenue(id);
        if (cancelled) return;
        const mapped = mapVenueDetail(data);
        setVenue(mapped);
        setDocuments(
          mapped.documents?.length
            ? mapped.documents.map((d) => ({ ...d }))
            : defaultDocumentSlots()
        );
        setNotFound(false);
      } catch {
        if (!cancelled) {
          setVenue(null);
          setNotFound(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (searchParams.get("created") === "1") {
      setShowCreatedBanner(true);
      router.replace(`/admin/venues/${id}${tabParam ? `?tab=${tabParam}` : ""}`, { scroll: false });
    }
  }, [searchParams, id, router, tabParam]);

  useEffect(() => {
    if (searchParams.get("booked") === "1") {
      toast("Booking created successfully.", "success");
      router.replace(`/admin/venues/${id}?tab=availability`, { scroll: false });
    }
  }, [searchParams, id, router]);

  if (loading) {
    return (
      <div className="bg-white border border-[#E8EAF0] rounded-[14px] p-6 animate-pulse space-y-3">
        <div className="h-10 bg-[#F3F4F6] rounded-lg" />
        <div className="h-24 bg-[#F3F4F6] rounded-lg" />
      </div>
    );
  }

  if (notFound || !venue) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <PageHeader
          title="Venue Not Found"
          subtitle="The requested venue could not be located."
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "Venue Management" },
            { label: "Venues", href: "/admin/venues" },
            { label: "Not Found" },
          ]}
          actions={
            <Button variant="secondary" icon={ArrowLeft} onClick={() => router.push("/admin/venues")}>
              Back to Venues
            </Button>
          }
        />
        <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-6 py-14 text-center">
          <p className="text-sm text-[#6B7280] mb-4">
            No venue exists for ID <span className="font-medium text-[#111827]">{id}</span>.
          </p>
          <Link href="/admin/venues" className="text-sm font-medium text-[#C89B3C] hover:underline">
            Return to venue list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showCreatedBanner && (
        <div className="flex items-start gap-3 rounded-[14px] border border-[#D3F8E1] bg-[#ECFDF3] px-4 py-3">
          <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#166534]">Venue created successfully.</p>
            <p className="text-[13px] text-[#15803D] mt-0.5">
              {venue.name} is ready. You can continue managing Overview, Pricing, Gallery, and more from here.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreatedBanner(false)}
            className="p-1 rounded-lg text-[#16A34A] hover:bg-[#DCFCE7] transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <VenueWorkspace
        venue={{ ...venue, documents, availability: [...(venue.availability || [])] }}
        mode="view"
        documents={documents}
        onDocumentsChange={setDocuments}
        initialTab={initialTab}
        onEdit={() => router.push(`/admin/venues/${venue.id}/edit`)}
        onDelete={async () => {
          const ok = await confirmAction({
            title: "Delete Venue?",
            message: `Are you sure you want to delete ${venue.name}?\n\nThis action cannot be undone.`,
          });
          if (!ok) return;
          try {
            await deleteVenue(venue.id);
            notify.deleted("Venue");
            router.push("/admin/venues");
          } catch (err) {
            notify.error(err instanceof Error ? err.message : "Failed to delete venue");
          }
        }}
      />
    </div>
  );
}

export default function ViewVenuePage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white border border-[#E8EAF0] rounded-[14px] p-6 animate-pulse space-y-3">
          <div className="h-10 bg-[#F3F4F6] rounded-lg" />
          <div className="h-24 bg-[#F3F4F6] rounded-lg" />
        </div>
      }
    >
      <ViewVenueContent />
    </Suspense>
  );
}
