"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VenueWorkspace } from "../components/VenueWorkspace";
import {
  blankVenue,
  defaultDocumentSlots,
  emptyVenueForm,
  validatePricingSlots,
  venueToFormValues,
} from "../data";
import { VenueDocument, VenueFormValues } from "../types";
import { notify } from "../../_components/ui/Toast";
import {
  createVenue,
  fetchVenue,
  formToCreatePayload,
  mapVenueDetail,
} from "@/lib/venues";

function mapDocumentsForApi(documents: VenueDocument[]) {
  return documents
    .filter((d) => d.name?.trim())
    .map((d) => ({
      name: d.name,
      document_type: d.name,
      status: d.status || "pending",
      file_name: d.fileName || null,
      file_size: d.fileSize || null,
      file_url: d.fileUrl || null,
      verified_by: d.verifiedBy || null,
      uploaded_date: d.uploadedDate || null,
    }));
}

function CreateVenueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cloneId = searchParams.get("clone");
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [loadingClone, setLoadingClone] = useState(Boolean(cloneId));
  const [form, setForm] = useState<VenueFormValues>(emptyVenueForm);
  const [documents, setDocuments] = useState<VenueDocument[]>(() => defaultDocumentSlots());
  const [saving, setSaving] = useState(false);
  const [coverImage, setCoverImage] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  useEffect(() => {
    if (!cloneId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchVenue(cloneId);
        if (cancelled) return;
        const mapped = mapVenueDetail(data);
        setSourceId(mapped.id);
        const cloned = venueToFormValues(mapped);
        setForm({
          ...cloned,
          name: `${cloned.name} (Copy)`,
          status: "draft",
          approval: "pending",
          featured: false,
        });
        setDocuments(mapped.documents?.length ? mapped.documents.map((d) => ({ ...d })) : defaultDocumentSlots());
        setCoverImage(mapped.coverImage || "");
        setGalleryImages(mapped.galleryImages || []);
      } catch {
        if (!cancelled) notify.error("Unable to load venue to clone.");
      } finally {
        if (!cancelled) setLoadingClone(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cloneId]);

  const update = <K extends keyof VenueFormValues>(key: K, value: VenueFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const liveVenue = blankVenue({
    coverImage,
    galleryImages,
    name: form.name,
    businessId: form.businessId,
    businessName: form.businessName,
    ownerId: form.ownerId,
    ownerName: form.ownerName,
    ownerEmail: form.ownerEmail,
    ownerPhone: form.ownerPhone,
    supportEmail: form.supportEmail,
    supportPhone: form.supportPhone,
    category: form.category,
    venueType: form.venueType,
    status: form.status,
    approval: form.approval,
    featured: form.featured,
    shortDescription: form.shortDescription,
    detailedDescription: form.detailedDescription,
    highlights: form.highlights ? form.highlights.split("\n").filter(Boolean) : [],
    houseRules: form.houseRules,
    addressLine1: form.addressLine1,
    addressLine2: form.addressLine2,
    city: form.city,
    state: form.state,
    country: form.country,
    zipCode: form.zipCode,
    mapsLink: form.mapsLink,
    latitude: form.latitude,
    longitude: form.longitude,
    seatingCapacity: Number(form.seatingCapacity) || 0,
    diningCapacity: Number(form.diningCapacity) || 0,
    floatingCapacity: Number(form.floatingCapacity) || 0,
    bookingModel: form.bookingModel,
    bookingTypes: form.bookingTypes && form.bookingTypes.length > 0 ? form.bookingTypes : [form.bookingModel || "venue_only"],
    pricingMethod: form.pricingMethod,
    pricingSlots: form.pricingSlots,
    foodSlots: form.foodSlots,
    addons: form.addons,
    gstPercent: Number(form.gstPercent) || 0,
    advancePaymentPercent: Number(form.advancePaymentPercent) || 0,
    amenities: form.amenities,
    eventCategories: form.eventCategories,
    minGuests: Number(form.minGuests) || 0,
    maxGuests: Number(form.maxGuests) || 0,
    operatingHours: form.operatingHours,
    documents,
    initials: (form.name || "NV")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
  });

  const validateOverview = () => {
    if (!form.name.trim() || !form.businessId.trim() || !form.category.trim() || !form.city.trim()) {
      notify.validation("Venue name, business profile, category and city are required.");
      return false;
    }
    return true;
  };

  const validatePricing = () => {
    const res = validatePricingSlots(form);
    if (!res.valid) {
      notify.validation(res.message || "Invalid slot configuration.");
      return false;
    }
    return true;
  };

  const handleCancel = () => {
    if (sourceId) router.push(`/admin/venues/${sourceId}`);
    else router.push("/admin/venues");
  };

  const handleCreate = async () => {
    if (!validateOverview()) return;
    if (!validatePricing()) return;
    setSaving(true);
    try {
      const base = formToCreatePayload(form);
      const payload = {
        ...base,
        cover_image_url: coverImage || null,
        gallery: [
          ...(coverImage
            ? [{ image_url: coverImage, image_type: "cover", display_order: 0 }]
            : []),
          ...galleryImages.map((url, i) => ({
            image_url: url,
            image_type: "gallery",
            display_order: i + 1,
          })),
        ],
        documents: mapDocumentsForApi(documents),
      };
      const result = await createVenue(payload);
      notify.created("Venue");
      router.push(`/admin/venues/${result.venue.id}?created=1`);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Failed to create venue");
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
    <VenueWorkspace
      venue={liveVenue}
      mode="create"
      form={form}
      onChange={update}
      documents={documents}
      onDocumentsChange={setDocuments}
      onCoverImageChange={setCoverImage}
      onGalleryImagesChange={setGalleryImages}
      onCancel={handleCancel}
      onSave={handleCreate}
      onSaveContinue={async (tab) => {
        if (tab === "overview" && !validateOverview()) return false;
        if (tab === "pricing" && !validatePricing()) return false;
        return true;
      }}
      saving={saving}
      pageLabel={sourceId ? "Clone Venue" : "Create Venue"}
    />
  );
}

export default function CreateVenuePage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white border border-[#E8EAF0] rounded-[14px] p-6 animate-pulse space-y-3">
          <div className="h-10 bg-[#F3F4F6] rounded-lg" />
          <div className="h-24 bg-[#F3F4F6] rounded-lg" />
        </div>
      }
    >
      <CreateVenueContent />
    </Suspense>
  );
}
