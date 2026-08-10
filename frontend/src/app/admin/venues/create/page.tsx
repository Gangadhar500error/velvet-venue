"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VenueWorkspace } from "../components/VenueWorkspace";
import {
  blankVenue,
  defaultDocumentSlots,
  emptyVenueForm,
  venueToFormValues,
} from "../data";
import { VenueDocument, VenueFormValues } from "../types";
import { notify } from "../../_components/ui/Toast";
import { useDemoStore } from "../../store/demoStore";

function CreateVenueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cloneId = searchParams.get("clone");
  const venues = useDemoStore((s) => s.venues);
  const addVenue = useDemoStore((s) => s.addVenue);
  const nextVenueIds = useDemoStore((s) => s.nextVenueIds);
  const source = cloneId ? venues.find((v) => v.id === cloneId || v.venueId === cloneId) : undefined;
  const isClone = Boolean(source);

  const initialForm = useMemo(() => {
    if (!source) return emptyVenueForm;
    const cloned = venueToFormValues(source);
    return {
      ...cloned,
      name: `${cloned.name} (Copy)`,
      status: "draft" as const,
      approval: "pending" as const,
      featured: false,
    };
  }, [source]);

  const [form, setForm] = useState<VenueFormValues>(initialForm);
  const [documents, setDocuments] = useState<VenueDocument[]>(() =>
    source?.documents?.length ? source.documents.map((d) => ({ ...d })) : defaultDocumentSlots()
  );
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof VenueFormValues>(key: K, value: VenueFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buildLiveVenue = (ids?: { id: string; venueId: string }) => {
    const now = new Date().toISOString();
    return blankVenue({
      ...(ids || {}),
      coverImage: source?.coverImage || "",
      galleryImages: source?.galleryImages ? [...source.galleryImages] : [],
      images360: source?.images360 ? [...source.images360] : [],
      videoUrl: source?.videoUrl || "",
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
      foodPricingMethod: "slot_based" as const,
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
      createdAt: now,
      updatedAt: now,
      createdBy: "Admin",
      updatedBy: "Admin",
      initials:
        (form.name || "NV")
          .split(" ")
          .filter(Boolean)
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
    });
  };

  const liveVenue = buildLiveVenue();

  const validateOverview = () => {
    if (!form.name.trim() || !form.businessId.trim() || !form.category.trim() || !form.city.trim()) {
      notify.validation("Venue name, business profile, category and city are required.");
      return false;
    }
    if (
      venues.some(
        (v) =>
          v.businessId === form.businessId &&
          v.name.trim().toLowerCase() === form.name.trim().toLowerCase()
      )
    ) {
      notify.validation("Venue already exists.");
      return false;
    }
    return true;
  };

  const handleCancel = () => {
    if (source) router.push(`/admin/venues/${source.id}`);
    else router.push("/admin/venues");
  };

  const handleSaveContinue = async (tab: "overview" | "pricing" | "gallery" | "documents") => {
    if (tab === "overview" && !validateOverview()) return false;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    return true;
  };

  const handleCreate = async () => {
    if (!validateOverview()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    const ids = nextVenueIds();
    const created = buildLiveVenue(ids);
    addVenue(created);
    setSaving(false);
    notify.created("Venue");
    router.push(`/admin/venues/${created.id}?created=1`);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
  };

  return (
    <VenueWorkspace
      venue={liveVenue}
      mode="create"
      form={form}
      onChange={update}
      documents={documents}
      onDocumentsChange={setDocuments}
      onCancel={handleCancel}
      onSave={handleCreate}
      onSaveDraft={handleSaveDraft}
      onSaveContinue={handleSaveContinue}
      saving={saving}
      pageLabel={isClone ? "Clone Venue" : "Create Venue"}
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
