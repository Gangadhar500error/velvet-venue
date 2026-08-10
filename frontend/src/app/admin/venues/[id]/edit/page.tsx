"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { venueToFormValues, defaultDocumentSlots } from "../../data";
import { VenueWorkspace } from "../../components/VenueWorkspace";
import { Venue, VenueDocument, VenueFormValues } from "../../types";
import { Button } from "../../../_components/ui/Button";
import { PageHeader } from "../../../_components/ui/PageHeader";
import { notify } from "../../../_components/ui/Toast";
import {
  fetchVenue,
  formToUpdatePayload,
  mapVenueDetail,
  updateVenue,
} from "@/lib/venues";

function mapDocumentsForApi(documents: VenueDocument[]) {
  return documents
    .filter((d) => d.name?.trim())
    .map((d) => ({
      id: d.id && !d.id.startsWith("doc-") && d.id.length > 20 ? d.id : undefined,
      name: d.name,
      document_type: d.name,
      status: d.status || "pending",
      file_name: d.fileName || null,
      file_size: d.fileSize || null,
      file_url: null,
      verified_by: d.verifiedBy || null,
      uploaded_date: d.uploadedDate || null,
    }));
}

export default function EditVenuePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [form, setForm] = useState<VenueFormValues | null>(null);
  const [documents, setDocuments] = useState<VenueDocument[]>(defaultDocumentSlots);
  const [coverImage, setCoverImage] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchVenue(id);
        if (cancelled) return;
        const mapped = mapVenueDetail(data);
        setVenue(mapped);
        setForm(venueToFormValues(mapped));
        setDocuments(
          mapped.documents?.length
            ? mapped.documents.map((d) => ({ ...d }))
            : defaultDocumentSlots()
        );
        setCoverImage(mapped.coverImage || "");
        setGalleryImages(mapped.galleryImages || []);
      } catch {
        if (!cancelled) {
          setVenue(null);
          setForm(null);
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
      <div className="bg-white border border-[#E8EAF0] rounded-[14px] p-6 animate-pulse space-y-3">
        <div className="h-10 bg-[#F3F4F6] rounded-lg" />
        <div className="h-24 bg-[#F3F4F6] rounded-lg" />
      </div>
    );
  }

  if (!venue || !form) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <PageHeader
          title="Venue Not Found"
          subtitle="Unable to edit a missing venue record."
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "Venue Management" },
            { label: "Venues", href: "/admin/venues" },
            { label: "Edit" },
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

  const update = <K extends keyof VenueFormValues>(key: K, value: VenueFormValues[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleCancel = () => router.push(`/admin/venues/${venue.id}`);

  const handleSave = async () => {
    if (!form.name.trim() || !form.businessId.trim() || !form.category.trim() || !form.city.trim()) {
      notify.validation("Venue name, business profile, category and city are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formToUpdatePayload(form),
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
      await updateVenue(venue.id, payload);
      notify.updated("Venue");
      router.push(`/admin/venues/${venue.id}`);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Failed to update venue");
    } finally {
      setSaving(false);
    }
  };

  const liveVenue: Venue = {
    ...venue,
    coverImage,
    galleryImages,
    name: form.name || venue.name,
    businessId: form.businessId || venue.businessId,
    businessName: form.businessName || venue.businessName,
    ownerId: form.ownerId || venue.ownerId,
    ownerName: form.ownerName || venue.ownerName,
    ownerEmail: form.ownerEmail || venue.ownerEmail,
    ownerPhone: form.ownerPhone || venue.ownerPhone,
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
    city: form.city || venue.city,
    state: form.state,
    country: form.country || venue.country,
    zipCode: form.zipCode,
    mapsLink: form.mapsLink,
    latitude: form.latitude,
    longitude: form.longitude,
    seatingCapacity: Number(form.seatingCapacity) || 0,
    diningCapacity: Number(form.diningCapacity) || 0,
    floatingCapacity: Number(form.floatingCapacity) || 0,
    theatreCapacity: Number(form.theatreCapacity) || 0,
    classroomCapacity: Number(form.classroomCapacity) || 0,
    standingCapacity: Number(form.standingCapacity) || 0,
    startingPrice: Number(form.startingPrice) || 0,
    weekendPrice: Number(form.weekendPrice) || 0,
    peakPrice: Number(form.peakPrice) || 0,
    securityDeposit: Number(form.securityDeposit) || 0,
    cleaningCharges: Number(form.cleaningCharges) || 0,
    bookingModel: form.bookingModel,
    pricingMethod: form.pricingMethod,
    foodPricingMethod: "slot_based",
    pricingSlots: form.pricingSlots,
    foodPricing: form.foodPricing,
    foodSlots: form.foodSlots,
    addons: form.addons,
    minOnlineBookingAmount: Number(form.minOnlineBookingAmount) || 0,
    onlineBookingAmountMode: "percent",
    gstMode: form.gstMode,
    gstPercent: Number(form.gstPercent) || 0,
    cancellationPreset: form.cancellationPreset,
    bookingConfirmation: form.bookingConfirmation,
    maxAdvanceBookingDays: Number(form.maxAdvanceBookingDays) || 0,
    minNoticePeriodHours: Number(form.minNoticePeriodHours) || 0,
    balancePaymentDue: form.balancePaymentDue,
    taxNotes: form.taxNotes,
    amenities: form.amenities,
    cancellationPolicy: form.cancellationPolicy,
    refundPolicy: form.refundPolicy,
    advancePaymentPercent: Number(form.advancePaymentPercent) || 0,
    smokingPolicy: form.smokingPolicy,
    alcoholPolicy: form.alcoholPolicy,
    outsideCatering: form.outsideCatering,
    outsideDecorations: form.outsideDecorations,
    outsidePhotography: form.outsidePhotography,
    petsAllowed: form.petsAllowed,
    noiseRestrictions: form.noiseRestrictions,
    notes: form.notes,
    nearbyLandmark: form.nearbyLandmark,
    weeklyOff: form.weeklyOff,
    checkInTime: form.checkInTime,
    checkOutTime: form.checkOutTime,
    contactPerson: form.contactPerson,
    contactPhone: form.contactPhone,
    contactEmail: form.contactEmail,
    parkingCapacity: Number(form.parkingCapacity) || 0,
    wheelchairAccessible: form.wheelchairAccessible,
    powerBackup: form.powerBackup,
    liftAvailable: form.liftAvailable,
    kitchenAvailable: form.kitchenAvailable,
    bridalRoomCount: Number(form.bridalRoomCount) || 0,
    restroomCount: Number(form.restroomCount) || 0,
    indoorArea: form.indoorArea,
    outdoorArea: form.outdoorArea,
    displayPriority: Number(form.displayPriority) || 0,
    minGuests: Number(form.minGuests) || 0,
    maxGuests: Number(form.maxGuests) || 0,
    operatingHours: form.operatingHours,
    bookingDuration: form.bookingDuration,
    eventCategories: form.eventCategories,
    documents,
    initials: (form.name || venue.name)
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
  };

  return (
    <VenueWorkspace
      venue={liveVenue}
      mode="edit"
      form={form}
      onChange={update}
      documents={documents}
      onDocumentsChange={setDocuments}
      onCoverImageChange={setCoverImage}
      onGalleryImagesChange={setGalleryImages}
      onCancel={handleCancel}
      onSave={handleSave}
      saving={saving}
    />
  );
}
