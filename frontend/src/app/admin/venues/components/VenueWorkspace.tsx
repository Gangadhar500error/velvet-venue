"use client";

import type { ComponentType, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  Copy,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  IndianRupee,
  Layers,
  MapPin,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  StickyNote,
  Trash2,
  Upload,
  UserRound,
  Users,
  Video,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useRouter } from "next/navigation";
import { PageBreadcrumb } from "../../_components/ui/PageHeader";
import { Button } from "../../_components/ui/Button";
import {
  ApprovalStatus,
  AvailabilityDay,
  AvailabilityLabel,
  DayAvailabilityStatus,
  Venue,
  VenueDocument,
  VenueFormValues,
  VenueStatus,
} from "../types";
import {
  amenityOptions,
  categoryOptions,
  cityOptions,
  eventCategoryOptions,
  formatCurrency,
  formatDate,
  formatDateTime,
  venueTypeOptions,
  type BusinessOption,
} from "../data";
import { DocumentsManager } from "./DocumentsManager";
import { PricingBookingRules } from "./PricingBookingRules";
import { AdditionalServicesCatalog } from "./AdditionalServicesCatalog";
import { VenueAvailabilityPanel } from "./VenueAvailabilityPanel";
import { notify, toast } from "../../_components/ui/Toast";
import {
  RelationCard,
  RelatedBookingsTable,
  RelatedInvoicesTable,
  ViewAllButton,
  flattenInvoices,
} from "../../_components/relations";
import { EntityViewLayout } from "../../_components/layout/EntityViewLayout";
import { fetchBusinessProfiles, mapBusinessProfileListItem } from "@/lib/business-profiles";
import { fetchVenueMeta } from "@/lib/venues";
import { fetchAvailabilityWindow } from "@/lib/availability";
import type { Booking } from "../../bookings/types";
import type { AmenityOption } from "../data";

type TabKey = "overview" | "gallery" | "availability" | "pricing" | "reviews" | "documents";
type CreateTabKey = "overview" | "pricing" | "gallery" | "documents";

const CREATE_TABS: CreateTabKey[] = ["overview", "pricing", "gallery", "documents"];

const ALL_TABS = [
  { key: "overview" as const, label: "Overview", icon: UserRound },
  { key: "pricing" as const, label: "Pricing", icon: IndianRupee },
  { key: "gallery" as const, label: "Gallery", icon: ImageIcon },
  { key: "documents" as const, label: "Documents", icon: FileText },
  { key: "availability" as const, label: "Availability", icon: CalendarDays },
  { key: "reviews" as const, label: "Reviews", icon: Star },
];

interface VenueWorkspaceProps {
  venue: Venue;
  mode: "view" | "edit" | "create";
  form?: VenueFormValues;
  onChange?: <K extends keyof VenueFormValues>(key: K, value: VenueFormValues[K]) => void;
  documents?: VenueDocument[];
  onDocumentsChange?: (documents: VenueDocument[]) => void;
  onCoverImageChange?: (url: string) => void;
  onGalleryImagesChange?: (urls: string[]) => void;
  onEdit?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  onSaveDraft?: () => void;
  /** Create mode: validate/save current tab; return true to advance to the next tab. */
  onSaveContinue?: (tab: CreateTabKey) => boolean | Promise<boolean>;
  onDelete?: () => void;
  saving?: boolean;
  pageLabel?: string;
  /** Open a specific tab on mount (e.g. availability after quick booking). */
  initialTab?: TabKey;
}

const labelCls =
  "shrink-0 w-[128px] sm:w-[142px] text-sm text-[#6B7280] leading-6 after:content-[':'] after:ml-0.5";
const valueCls = "text-sm font-semibold text-[#111827] leading-6 min-w-0";
const inputCls =
  "w-full min-w-0 h-9 px-0 py-0 bg-transparent border-0 border-b border-[#E5E7EB] rounded-none text-sm font-semibold text-[#111827] placeholder:text-[#9CA3AF] placeholder:font-normal outline-none transition-colors focus:ring-0 focus:border-[#C89B3C]";
const textareaCls =
  "w-full min-w-0 px-0 py-1.5 bg-transparent border-0 border-b border-[#E5E7EB] rounded-none text-sm font-semibold text-[#111827] placeholder:text-[#9CA3AF] placeholder:font-normal outline-none transition-colors focus:ring-0 focus:border-[#C89B3C] resize-none";

const statusStyles: Record<VenueStatus, string> = {
  published: "bg-[#ECFDF3] text-[#16A34A] border-[#D3F8E1]",
  draft: "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]",
  pending: "bg-[#FCFAF8] text-[#D97706] border-[#FDE9CB]",
  inactive: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
  archived: "bg-[#EEF2FF] text-[#4F46E5] border-[#E0E7FF]",
};

const approvalStyles: Record<ApprovalStatus, string> = {
  approved: "bg-[#ECFDF3] text-[#16A34A] border-[#D3F8E1]",
  pending: "bg-[#FCFAF8] text-[#D97706] border-[#FDE9CB]",
  rejected: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
};

const availabilityStyles: Record<AvailabilityLabel, string> = {
  available: "bg-[#ECFDF3] text-[#16A34A] border-[#D3F8E1]",
  busy: "bg-[#FCFAF8] text-[#D97706] border-[#FDE9CB]",
  blocked: "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]",
};

function VenueStatusBadge({ status }: { status: VenueStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

function ApprovalPill({ status }: { status: ApprovalStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${approvalStyles[status]}`}
    >
      {status}
    </span>
  );
}

function AvailabilityPill({ status }: { status: AvailabilityLabel }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${availabilityStyles[status]}`}
    >
      {status}
    </span>
  );
}

function AmenityIcon({ name, className }: { name: string; className?: string }) {
  const Icon =
    (LucideIcons as unknown as Record<string, ComponentType<{ className?: string }>>)[name] || Sparkles;
  return <Icon className={className} />;
}

export function VenueWorkspace({
  venue,
  mode,
  form,
  onChange,
  documents: documentsProp,
  onDocumentsChange,
  onCoverImageChange,
  onGalleryImagesChange,
  onEdit,
  onCancel,
  onSave,
  onSaveDraft,
  onSaveContinue,
  onDelete,
  saving,
  pageLabel,
  initialTab,
}: VenueWorkspaceProps) {
  const router = useRouter();
  const [businessOptionsLive, setBusinessOptionsLive] = useState<BusinessOption[]>([]);
  const [amenityOptionsLive, setAmenityOptionsLive] = useState<AmenityOption[]>(amenityOptions);
  const [eventCategoryOptionsLive, setEventCategoryOptionsLive] = useState(eventCategoryOptions);
  const editable = (mode === "edit" || mode === "create") && !!form && !!onChange;
  const isCreate = mode === "create";
  const [tab, setTab] = useState<TabKey>(initialTab || "overview");

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!editable) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchBusinessProfiles({
          page: 1,
          page_size: 100,
          sort_by: "business_name",
        });
        if (cancelled) return;
        setBusinessOptionsLive(
          data.items.map(mapBusinessProfileListItem).map((b) => ({
            id: b.id,
            businessId: b.businessId,
            name: b.businessName,
            businessType: b.businessType,
            ownerId: b.ownerId,
            ownerName: b.ownerName,
            ownerEmail: b.ownerEmail,
            ownerPhone: b.ownerPhone,
            supportEmail: b.supportEmail,
            supportPhone: b.supportPhone,
            city: b.city,
            state: b.state,
            gstNumber: b.gstNumber,
            panNumber: b.panNumber,
            addressLine1: b.addressLine1,
          }))
        );
      } catch {
        if (!cancelled) setBusinessOptionsLive([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editable]);

  useEffect(() => {
    if (!editable) return;
    let cancelled = false;
    (async () => {
      try {
        const meta = await fetchVenueMeta();
        if (cancelled) return;
        if (meta.amenities?.length) {
          const iconByKey = new Map(amenityOptions.map((a) => [a.key, a.icon]));
          setAmenityOptionsLive(
            meta.amenities.map((name) => ({
              key: name,
              label: name,
              icon: iconByKey.get(name) || "Sparkles",
            }))
          );
        }
        if (meta.event_types?.length) {
          setEventCategoryOptionsLive(meta.event_types);
        }
      } catch {
        /* keep static fallbacks */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editable]);

  const visibleTabs = isCreate ? ALL_TABS.filter((t) => CREATE_TABS.includes(t.key as CreateTabKey)) : ALL_TABS;
  const createTabIndex = CREATE_TABS.indexOf(tab as CreateTabKey);
  const isCreateFirstTab = isCreate && createTabIndex <= 0;
  const isCreateLastTab = isCreate && tab === "documents";

  const goPreviousTab = () => {
    if (createTabIndex > 0) setTab(CREATE_TABS[createTabIndex - 1]);
  };

  const handleSaveContinue = async () => {
    const current = (CREATE_TABS.includes(tab as CreateTabKey) ? tab : "overview") as CreateTabKey;
    if (onSaveContinue) {
      const ok = await onSaveContinue(current);
      if (!ok) return;
    }
    const idx = CREATE_TABS.indexOf(current);
    if (idx >= 0 && idx < CREATE_TABS.length - 1) setTab(CREATE_TABS[idx + 1]);
  };

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    businessProfile: true,
    info: true,
    description: true,
    location: true,
    capacity: true,
    amenities: true,
    services: true,
    eventInfo: true,
    business: true,
  });
  const toggleSection = (key: string) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const [availabilitySlotFilter, setAvailabilitySlotFilter] = useState("");
  const [listBookingSearch, setListBookingSearch] = useState("");
  const [listCustomerSearch, setListCustomerSearch] = useState("");
  const [listMonthFilter, setListMonthFilter] = useState("");
  const [addingService, setAddingService] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  const [localDocuments, setLocalDocuments] = useState<VenueDocument[]>(() => documentsProp ?? venue.documents);
  const documents = documentsProp ?? localDocuments;
  const handleDocumentsChange = (next: VenueDocument[]) => {
    if (onDocumentsChange) onDocumentsChange(next);
    else setLocalDocuments(next);
  };

  const [coverImage, setCoverImageState] = useState(venue.coverImage || "");
  const [galleryImages, setGalleryImagesState] = useState<string[]>(() => [...(venue.galleryImages || [])]);
  const [images360, setImages360] = useState<string[]>(() => [...(venue.images360 || [])]);
  const [videoUrl, setVideoUrl] = useState(venue.videoUrl || "");
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [availability, setAvailability] = useState<AvailabilityDay[]>(() => [...(venue.availability || [])]);
  const availabilityLoadedFor = useRef<string | null>(null);

  useEffect(() => {
    setCoverImageState(venue.coverImage || "");
    setGalleryImagesState([...(venue.galleryImages || [])]);
    setImages360([...(venue.images360 || [])]);
    setVideoUrl(venue.videoUrl || "");
    setAvailability([...(venue.availability || [])]);
    availabilityLoadedFor.current = null;
  }, [venue.id]);

  useEffect(() => {
    if (tab !== "availability" || mode === "create" || !venue.id) return;
    if (availabilityLoadedFor.current === venue.id) return;
    let cancelled = false;
    (async () => {
      try {
        const { days } = await fetchAvailabilityWindow(venue.id, venue.maxAdvanceBookingDays || 180);
        if (cancelled) return;
        availabilityLoadedFor.current = venue.id;
        setAvailability(days);
      } catch {
        if (!cancelled) setAvailability([...(venue.availability || [])]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, mode, venue.id, venue.maxAdvanceBookingDays]);

  const setCoverImage = (url: string) => {
    setCoverImageState(url);
    onCoverImageChange?.(url);
  };
  const setGalleryImages = (next: string[] | ((prev: string[]) => string[])) => {
    setGalleryImagesState((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      onGalleryImagesChange?.(value);
      return value;
    });
  };

  const activeBusinessOptions = useMemo(() => {
    return [
      { value: "", label: "Search / select business profile" },
      ...businessOptionsLive.map((b) => ({
        value: b.id,
        label: `${b.name} · ${b.city || "—"}`,
      })),
    ];
  }, [businessOptionsLive]);

  const resolveBusinessOption = (businessId: string) => {
    return businessOptionsLive.find((b) => b.id === businessId || b.businessId === businessId);
  };

  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("");
  const [bookingEventFilter, setBookingEventFilter] = useState("");
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewRatingFilter, setReviewRatingFilter] = useState("");
  const [reviewPhotosOnly, setReviewPhotosOnly] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const name = editable ? form!.name : venue.name;
  const city = editable ? form!.city || venue.city : venue.city;
  const businessName = editable ? form!.businessName || venue.businessName : venue.businessName;
  const ownerName = editable ? form!.ownerName || venue.ownerName : venue.ownerName;
  const category = editable ? form!.category : venue.category;
  const featured = editable ? form!.featured : venue.featured;
  const status = editable ? form!.status : venue.status;
  const approval = editable ? form!.approval : venue.approval;
  const initials =
    (name || "VN")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "VN";
  const crumbLabel = pageLabel || name || (isCreate ? "Create Venue" : "Venue");

  const handleBusinessSelect = (businessId: string) => {
    if (!onChange) return;
    onChange("businessId", businessId);
    const biz = resolveBusinessOption(businessId);
    onChange("businessName", biz?.name || "");
    onChange("ownerId", biz?.ownerId || "");
    onChange("ownerName", biz?.ownerName || "");
    onChange("ownerEmail", biz?.ownerEmail || "");
    onChange("ownerPhone", biz?.ownerPhone || "");
    onChange("supportEmail", biz?.supportEmail || "");
    onChange("supportPhone", biz?.supportPhone || "");
    if (biz?.city && onChange) onChange("city", form?.city || biz.city);
    if (biz?.state && onChange) onChange("state", form?.state || biz.state);
  };

  const selectedBusiness = resolveBusinessOption(editable ? form!.businessId : venue.businessId);

  const toggleAmenity = (key: string) => {
    if (!onChange || !form) return;
    const has = form.amenities.includes(key);
    onChange("amenities", has ? form.amenities.filter((a) => a !== key) : [...form.amenities, key]);
  };

  const toggleEventCategory = (key: string) => {
    if (!onChange || !form) return;
    const has = form.eventCategories.includes(key);
    onChange("eventCategories", has ? form.eventCategories.filter((a) => a !== key) : [...form.eventCategories, key]);
  };

  const addGalleryImage = (file: File) => setGalleryImages((prev) => [...prev, URL.createObjectURL(file)]);
  const replaceGalleryImage = (idx: number, file: File) =>
    setGalleryImages((prev) => prev.map((u, i) => (i === idx ? URL.createObjectURL(file) : u)));
  const removeGalleryImage = (idx: number) => setGalleryImages((prev) => prev.filter((_, i) => i !== idx));

  const add360Image = (file: File) => setImages360((prev) => [...prev, URL.createObjectURL(file)]);
  const replace360Image = (idx: number, file: File) =>
    setImages360((prev) => prev.map((u, i) => (i === idx ? URL.createObjectURL(file) : u)));
  const remove360Image = (idx: number) => setImages360((prev) => prev.filter((_, i) => i !== idx));

  const currentMonthPrefix = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const updateDayStatus = (date: string, status: DayAvailabilityStatus, slot = "Full Day") => {
    setAvailability((prev) => {
      const next = prev.map((a) => {
        if (a.date !== date || (a.slot || "Full Day") !== slot) return a;
        return {
          ...a,
          status,
          ...(status !== "booked"
            ? {
                bookingId: undefined,
                bookingRef: undefined,
                customerName: undefined,
                eventType: undefined,
                guests: undefined,
              }
            : {}),
        };
      });
      return next;
    });
  };

  const handleBookSlot = (payload: {
    date: string;
    dates?: string[];
    slot: string;
    slots?: string[];
    status: DayAvailabilityStatus;
    eventEndDate?: string;
    amount?: number;
  }) => {
    if (payload.status === "booked") {
      toast("This slot has already been booked.", "error");
      return;
    }
    const dates = (payload.dates && payload.dates.length > 0 ? payload.dates : [payload.date]).sort();
    const params = new URLSearchParams({
      from: "availability",
      venueRef: venue.id,
      venueId: venue.venueId,
      venueName: venue.name,
      businessId: venue.businessId,
      businessName: venue.businessName,
      date: dates[0],
      dates: dates.join(","),
      slot: payload.slot || "Full Day",
    });
    if (dates.length > 1) {
      params.set("eventEndDate", payload.eventEndDate || dates[dates.length - 1]);
    } else if (payload.eventEndDate) {
      params.set("eventEndDate", payload.eventEndDate);
    }
    if (payload.slots?.length) params.set("slots", payload.slots.join("|"));
    if (venue.ownerId) params.set("ownerId", venue.ownerId);
    if (venue.ownerName) params.set("ownerName", venue.ownerName);
    if (venue.operatingHours) params.set("hours", venue.operatingHours);
    if (venue.pricingMethod) params.set("pricingMethod", venue.pricingMethod);
    router.push(`/admin/bookings/create?${params.toString()}`);
  };

  const openBookingFromRow = (row: { bookingRef?: string; bookingId?: string }) => {
    const target = row.bookingRef || row.bookingId;
    if (!target) return;
    router.push(`/admin/bookings/${target}`);
  };

  const applyStatusToSelected = (status: DayAvailabilityStatus) => {
    if (selectedDates.length === 0) {
      notify.validation("Select one or more rows first.");
      return;
    }
    setAvailability((prev) => {
      const map = new Map(prev.map((a) => [a.date, a]));
      selectedDates.forEach((date) => {
        const existing = map.get(date);
        if (existing?.status === "booked") return;
        map.set(date, {
          ...(existing || { date }),
          date,
          status,
          ...(status !== "booked"
            ? { bookingId: undefined, customerName: undefined, eventType: undefined, guests: undefined }
            : {}),
        });
      });
      const next = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
      return next;
    });
    setSelectedDates([]);
  };

  const toggleRowSelect = (date: string, status: DayAvailabilityStatus) => {
    if (status === "booked") return;
    setSelectedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    );
  };

  const monthAvailabilityStats = useMemo(() => {
    const prefix = listMonthFilter || currentMonthPrefix;
    const monthDays = availability.filter(
      (a) => a.date.startsWith(prefix) && (a.status === "available" || a.status === "booked")
    );
    const available = monthDays.filter((a) => a.status === "available").length;
    const booked = monthDays.filter((a) => a.status === "booked").length;
    const denom = available + booked;
    const occupancy = denom > 0 ? Math.round((booked / denom) * 100) : 0;
    return { available, booked, occupancy };
  }, [availability, listMonthFilter, currentMonthPrefix]);

  const scheduleRows = useMemo(() => {
    const bookingByDate = new Map(venue.bookings.map((b) => [b.eventDate, b]));
    const monthPrefix = listMonthFilter || currentMonthPrefix;
    const slotKeyOf = (slot?: string) => {
      const s = (slot || "Full Day").toLowerCase();
      if (s.includes("morning")) return "morning";
      if (s.includes("afternoon")) return "afternoon";
      if (s.includes("evening")) return "evening";
      if (s.includes("half")) return "half_day";
      return "full_day";
    };
    let rows = [...availability]
      .filter((day) => day.status === "available" || day.status === "booked")
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((day) => {
        const booking = bookingByDate.get(day.date);
        return {
          ...day,
          customerName: day.customerName || booking?.customerName || "",
          eventType: day.eventType || booking?.eventType || "",
          guests: day.guests ?? booking?.guests,
          bookingId: day.bookingId || booking?.bookingId || "",
          bookingRef: day.bookingRef || "",
          dayName: new Date(day.date + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short" }),
          slot: day.slot || "Full Day",
          slotKey: slotKeyOf(day.slot),
        };
      });
    rows = rows.filter((r) => r.date.startsWith(monthPrefix));
    if (availabilityFilter === "available" || availabilityFilter === "booked") {
      rows = rows.filter((r) => r.status === availabilityFilter);
    }
    if (availabilitySlotFilter) rows = rows.filter((r) => r.slotKey === availabilitySlotFilter);
    if (listBookingSearch.trim()) {
      const q = listBookingSearch.toLowerCase();
      rows = rows.filter((r) => (r.bookingId || "").toLowerCase().includes(q));
    }
    if (listCustomerSearch.trim()) {
      const q = listCustomerSearch.toLowerCase();
      rows = rows.filter((r) => (r.customerName || "").toLowerCase().includes(q));
    }
    return rows;
  }, [
    availability,
    venue.bookings,
    availabilityFilter,
    availabilitySlotFilter,
    listBookingSearch,
    listCustomerSearch,
    listMonthFilter,
    currentMonthPrefix,
  ]);

  const resetListFilters = () => {
    setAvailabilityFilter("");
    setAvailabilitySlotFilter("");
    setListBookingSearch("");
    setListCustomerSearch("");
    setListMonthFilter("");
    setSelectedDates([]);
  };

  const monthOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    const base = new Date();
    for (let i = 0; i <= 1; i += 1) {
      const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      opts.push({
        value,
        label: d.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
      });
    }
    return opts;
  }, []);

  const relatedVenueBookings = useMemo(() => [] as Booking[], []);
  const relatedInvoices = useMemo(() => flattenInvoices([]), []);

  const venueBookings = useMemo(() => {
    return (venue.bookings || []).map((b) => ({
      id: b.id || b.bookingId,
      bookingId: b.bookingId,
      customerName: b.customerName,
      eventType: b.eventType,
      bookingDate: b.bookingDate || b.eventDate,
      eventDate: b.eventDate,
      guests: b.guests,
      amount: b.amount || 0,
      paymentStatus: (b.paymentStatus || "pending") as "paid" | "partial" | "refunded" | "pending",
      status: (b.status || "pending") as "completed" | "cancelled" | "pending" | "confirmed",
    }));
  }, [venue.bookings]);

  const filteredBookings = useMemo(() => {
    const q = bookingSearch.toLowerCase();
    return venueBookings.filter((b) => {
      const matchesSearch =
        !q ||
        b.bookingId.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.eventType.toLowerCase().includes(q);
      const matchesStatus = !bookingStatusFilter || b.status === bookingStatusFilter;
      const matchesEvent = !bookingEventFilter || b.eventType === bookingEventFilter;
      return matchesSearch && matchesStatus && matchesEvent;
    });
  }, [venueBookings, bookingSearch, bookingStatusFilter, bookingEventFilter]);

  const bookingEventOptions = useMemo(
    () => Array.from(new Set(venueBookings.map((b) => b.eventType))).filter(Boolean),
    [venueBookings]
  );

  const filteredReviews = useMemo(() => {
    const q = reviewSearch.toLowerCase();
    return venue.reviews.filter((r) => {
      const matchesRating = reviewRatingFilter ? r.rating === Number(reviewRatingFilter) : true;
      const matchesSearch =
        !q || r.customerName.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q);
      const matchesPhotos = !reviewPhotosOnly || (r.imagesCount || 0) > 0;
      return matchesRating && matchesSearch && matchesPhotos;
    });
  }, [venue.reviews, reviewRatingFilter, reviewSearch, reviewPhotosOnly]);

  const recommendationPct = useMemo(() => {
    if (venue.reviews.length === 0) return 0;
    const positive = venue.reviews.filter((r) => r.recommendation || r.rating >= 4).length;
    return Math.round((positive / venue.reviews.length) * 100);
  }, [venue.reviews]);

  const totalForPct = venue.totalReviews || 1;

  const showCreateFooter = isCreate;
  const showEditFooter = editable && !isCreate;
  const showStickyFooter = showCreateFooter || showEditFooter;

  return (
    <div className="flex flex-col gap-3 animate-fadeIn pb-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Venue Management" },
          { label: "Venues", href: "/admin/venues" },
          { label: crumbLabel },
        ]}
      />

      <div className="space-y-3">
        {/* Tabs */}
        <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-4 md:px-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            {visibleTabs.map((item) => {
              const active = tab === item.key;
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                    active ? "border-[#C89B3C] text-[#C89B3C]" : "border-transparent text-[#6B7280] hover:text-[#111827]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {mode === "view" && (
            <div className="flex flex-wrap items-center gap-2 py-2.5">
              <Button variant="primary" size="sm" icon={Pencil} onClick={onEdit}>
                Edit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={Trash2}
                onClick={onDelete}
                className="!text-[#DC2626] !border-[#FECACA] hover:!bg-[#FEF2F2]"
              >
                Delete
              </Button>
              <span className="hidden sm:block w-px h-6 bg-[#E8EAF0] mx-0.5" aria-hidden />
              <Button variant="secondary" size="sm" icon={Plus} onClick={() => router.push("/admin/venues/create")}>
                Add
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={Copy}
                onClick={() => router.push(`/admin/venues/create?clone=${venue.id}`)}
              >
                Clone
              </Button>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-4 py-3">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1 text-[13px] text-[#6B7280]">
            <span>
              Date Created{" "}
              <span className="font-semibold text-[#111827]">
                {isCreate ? "â€”" : formatDateTime(venue.createdAt)}
              </span>
            </span>
            <span className="hidden sm:inline text-[#E8EAF0]">|</span>
            <span>
              Last Updated{" "}
              <span className="font-semibold text-[#111827]">
                {isCreate ? "â€”" : formatDateTime(venue.updatedAt)}
              </span>
            </span>
          </div>
        </div>

        {tab === "overview" && (
          <EntityViewLayout
            main={
              <div className="relative">
                <div className="space-y-3">
                  {/* Identity header */}
                  <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-4 md:px-5 py-4">
                    <div className="flex items-start gap-4">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={name}
                          className="w-14 h-14 rounded-[12px] object-cover shrink-0 border border-[#E8EAF0]"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-[12px] bg-gradient-to-br from-[#C89B3C] to-[#B8862B] text-white text-lg font-semibold flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h1 className="text-xl font-semibold text-[#111827] truncate">
                            {name || (isCreate ? "New Venue" : "â€”")}
                          </h1>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[#4B5563]">
                          <span>
                            Venue ID:{" "}
                            <span className="font-medium text-[#374151]">
                              {isCreate ? "Auto-generated" : venue.venueId}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-[#9CA3AF]" />
                            {businessName || "â€”"}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <UserRound className="w-3.5 h-3.5 text-[#9CA3AF]" />
                            {ownerName || "â€”"}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#9CA3AF]" />
                            {city || "â€”"}
                          </span>
                          {category && (
                            <span className="inline-flex items-center gap-1.5 text-[#374151] font-medium">
                              {category}
                            </span>
                          )}
                          {venue.rating > 0 && (
                            <span className="inline-flex items-center gap-1.5">
                              <Star className="w-3.5 h-3.5 text-[#C89B3C] fill-current" />
                              {venue.rating.toFixed(1)} ({venue.totalReviews})
                            </span>
                          )}
                        </div>
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <VenueStatusBadge status={status} />
                          <ApprovalPill status={approval} />
                          {featured && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFF3EB] text-[#C89B3C] text-xs font-semibold border border-[#FFD4B0]">
                              <Star className="w-3 h-3 fill-current" />
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Compact KPI row */}
                  {!isCreate && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
                      <CompactKpi label="Total Bookings" value={String(venue.totalBookings)} />
                      <CompactKpi label="Upcoming Events" value={String(venue.upcomingBookings)} />
                      <CompactKpi label="Total Revenue" value={formatCurrency(venue.revenue)} />
                      <CompactKpi
                        label="Average Rating"
                        value={venue.rating > 0 ? venue.rating.toFixed(1) : "â€”"}
                      />
                      <CompactKpi
                        label="Venue Capacity"
                        value={String(venue.maxGuests || venue.seatingCapacity || "â€”")}
                      />
                      <CompactKpi
                        label="Availability"
                        value={
                          venue.availabilityLabel.charAt(0).toUpperCase() +
                          venue.availabilityLabel.slice(1)
                        }
                      />
                    </div>
                  )}

                  {/* Step 1 â€” Business Profile (create/edit) */}
                  {editable && (
                    <CollapsibleCard
                      id="businessProfile"
                      icon={Building2}
                      title="1. Business Profile"
                      subtitle="Required Â· Venue inherits owner and support details"
                      open={openSections.businessProfile}
                      onToggle={toggleSection}
                    >
                      <div className="space-y-3">
                        <SelectField
                          label="Business Profile"
                          required
                          value={form!.businessId}
                          onChange={handleBusinessSelect}
                          options={activeBusinessOptions}
                        />
                        {selectedBusiness && (
                          <div className="rounded-[12px] border border-[#E8EAF0] bg-[#FCFCFD] px-3.5 py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-[13px]">
                            <InheritedRow label="Business Name" value={selectedBusiness.name} />
                            <InheritedRow label="Business Type" value={selectedBusiness.businessType} />
                            <InheritedRow label="Venue Owner" value={selectedBusiness.ownerName} />
                            <InheritedRow label="GST" value={selectedBusiness.gstNumber} />
                            <InheritedRow label="PAN" value={selectedBusiness.panNumber} />
                            <InheritedRow label="Support Email" value={selectedBusiness.supportEmail} />
                            <InheritedRow label="Support Phone" value={selectedBusiness.supportPhone} />
                            <InheritedRow
                              label="Address"
                              value={[selectedBusiness.addressLine1, selectedBusiness.city]
                                .filter(Boolean)
                                .join(", ")}
                            />
                          </div>
                        )}
                      </div>
                    </CollapsibleCard>
                  )}

                  {/* Venue Information */}
                  <CollapsibleCard
                    id="info"
                    icon={UserRound}
                    title={editable ? "2. Venue Information" : "Venue Information"}
                    open={openSections.info}
                    onToggle={toggleSection}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
                      <InfoField label="Venue ID" value={isCreate ? "Auto-generated on save" : venue.venueId} />
                      <InfoField
                        label="Venue Name"
                        required
                        value={editable ? form!.name : venue.name}
                        editable={editable}
                        onChange={(v) => onChange?.("name", v)}
                      />
                      {editable ? (
                        <SelectField
                          label="Category"
                          required
                          value={form!.category}
                          onChange={(v) => onChange!("category", v)}
                          options={[
                            { value: "", label: "Select category" },
                            ...categoryOptions.map((c) => ({ value: c, label: c })),
                          ]}
                        />
                      ) : (
                        <InfoField label="Category" value={venue.category || "â€”"} />
                      )}
                      {editable ? (
                        <SelectField
                          label="Venue Type"
                          value={form!.venueType}
                          onChange={(v) => onChange!("venueType", v)}
                          options={venueTypeOptions.map((v) => ({ value: v, label: v }))}
                        />
                      ) : (
                        <InfoField label="Venue Type" value={venue.venueType || "â€”"} />
                      )}
                      {editable ? (
                        <SelectField
                          label="Status"
                          required
                          value={form!.status}
                          onChange={(v) => onChange!("status", v as VenueStatus)}
                          options={[
                            { value: "draft", label: "Draft" },
                            { value: "pending", label: "Pending" },
                            { value: "published", label: "Published" },
                            { value: "inactive", label: "Inactive" },
                            { value: "archived", label: "Archived" },
                          ]}
                        />
                      ) : (
                        <InlineField label="Status">
                          <VenueStatusBadge status={venue.status} />
                        </InlineField>
                      )}
                      {editable ? (
                        <SelectField
                          label="Approval Status"
                          value={form!.approval}
                          onChange={(v) => onChange!("approval", v as ApprovalStatus)}
                          options={[
                            { value: "pending", label: "Pending" },
                            { value: "approved", label: "Approved" },
                            { value: "rejected", label: "Rejected" },
                          ]}
                        />
                      ) : (
                        <InlineField label="Approval Status">
                          <ApprovalPill status={venue.approval} />
                        </InlineField>
                      )}
                    </div>
                  </CollapsibleCard>

                  {/* Location */}
                  <CollapsibleCard
                    id="location"
                    icon={MapPin}
                    title="Location"
                    open={openSections.location}
                    onToggle={toggleSection}
                  >
                    <div className="space-y-2">
                      <InfoField
                        label="Address Line 1"
                        value={editable ? form!.addressLine1 : venue.addressLine1 || ""}
                        editable={editable}
                        onChange={(v) => onChange?.("addressLine1", v)}
                        wide
                      />
                      <InfoField
                        label="Address Line 2"
                        value={editable ? form!.addressLine2 : venue.addressLine2 || ""}
                        editable={editable}
                        onChange={(v) => onChange?.("addressLine2", v)}
                        wide
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
                        {editable ? (
                          <SelectField
                            label="City"
                            required
                            value={form!.city}
                            onChange={(v) => onChange!("city", v)}
                            options={[
                              { value: "", label: "Select city" },
                              ...cityOptions.map((c) => ({ value: c, label: c })),
                            ]}
                          />
                        ) : (
                          <InfoField label="City" value={venue.city} />
                        )}
                        <InfoField
                          label="State"
                          value={editable ? form!.state : venue.state || ""}
                          editable={editable}
                          onChange={(v) => onChange?.("state", v)}
                        />
                        <InfoField
                          label="Country"
                          value={editable ? form!.country : venue.country}
                          editable={editable}
                          onChange={(v) => onChange?.("country", v)}
                        />
                        <InfoField
                          label="Postal Code"
                          value={editable ? form!.zipCode : venue.zipCode || ""}
                          editable={editable}
                          onChange={(v) => onChange?.("zipCode", v)}
                        />
                        <InfoField
                          label="Maps Link"
                          value={editable ? form!.mapsLink : venue.mapsLink || ""}
                          editable={editable}
                          onChange={(v) => onChange?.("mapsLink", v)}
                          wide
                        />
                        <InfoField
                          label="Latitude"
                          value={editable ? form!.latitude : venue.latitude || ""}
                          editable={editable}
                          onChange={(v) => onChange?.("latitude", v)}
                        />
                        <InfoField
                          label="Longitude"
                          value={editable ? form!.longitude : venue.longitude || ""}
                          editable={editable}
                          onChange={(v) => onChange?.("longitude", v)}
                        />
                        <InfoField
                          label="Nearby Landmark"
                          value={editable ? form!.nearbyLandmark : venue.nearbyLandmark || ""}
                          editable={editable}
                          onChange={(v) => onChange?.("nearbyLandmark", v)}
                          wide
                        />
                      </div>
                    </div>
                  </CollapsibleCard>

                  {/* Capacity */}
                  <CollapsibleCard
                    id="capacity"
                    icon={Users}
                    title="Capacity"
                    open={openSections.capacity}
                    onToggle={toggleSection}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
                      <NumberField
                        label="Maximum Guests"
                        required
                        hint="Total maximum guests the venue can accommodate."
                        value={editable ? form!.maxGuests : String(venue.maxGuests || "")}
                        editable={editable}
                        onChange={(v) => onChange?.("maxGuests", v)}
                      />
                      <NumberField
                        label="Seating Capacity"
                        required
                        hint="Maximum guests with seating arrangement."
                        value={editable ? form!.seatingCapacity : String(venue.seatingCapacity || "")}
                        editable={editable}
                        onChange={(v) => onChange?.("seatingCapacity", v)}
                      />
                      <NumberField
                        label="Dining Capacity"
                        required
                        hint="Maximum guests that can dine at the same time."
                        value={editable ? form!.diningCapacity : String(venue.diningCapacity || "")}
                        editable={editable}
                        onChange={(v) => onChange?.("diningCapacity", v)}
                      />
                      <NumberField
                        label="Minimum Guests"
                        hint="Minimum guest count required for accepting a booking."
                        value={editable ? form!.minGuests : String(venue.minGuests || "")}
                        editable={editable}
                        onChange={(v) => onChange?.("minGuests", v)}
                      />
                    </div>
                  </CollapsibleCard>

                  {/* Amenities */}
                  <CollapsibleCard
                    id="amenities"
                    icon={Sparkles}
                    title="Amenities"
                    subtitle={editable ? "Tap to toggle amenities available at this venue" : undefined}
                    open={openSections.amenities}
                    onToggle={toggleSection}
                  >
                    <AmenityChips
                      selected={editable ? form!.amenities : venue.amenities}
                      editable={editable}
                      onToggle={toggleAmenity}
                      options={amenityOptionsLive}
                    />
                  </CollapsibleCard>

                  {/* Additional Services */}
                  <CollapsibleCard
                    id="services"
                    icon={Layers}
                    title="Additional Services"
                    open={openSections.services}
                    onToggle={toggleSection}
                    actions={
                      editable ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Plus}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenSections((prev) => ({ ...prev, services: true }));
                            setAddingService(true);
                          }}
                        >
                          Add Service
                        </Button>
                      ) : undefined
                    }
                  >
                    <AdditionalServicesCatalog
                      services={editable ? form!.addons : venue.addons || []}
                      editable={editable}
                      onChange={(services) => onChange?.("addons", services)}
                      adding={addingService}
                      onAddingChange={setAddingService}
                    />
                  </CollapsibleCard>

                  {/* Supported Events */}
                  <CollapsibleCard
                    id="eventInfo"
                    icon={CalendarClock}
                    title="Supported Events"
                    open={openSections.eventInfo}
                    onToggle={toggleSection}
                  >
                    <ChipMultiSelect
                      options={eventCategoryOptionsLive}
                      selected={editable ? form!.eventCategories : venue.eventCategories}
                      editable={editable}
                      onToggle={toggleEventCategory}
                    />
                  </CollapsibleCard>

                  {/* Business Information â€” overview link only (no duplicate contacts) */}
                  {!editable && (
                    <CollapsibleCard
                      id="business"
                      icon={Building2}
                      title="Business Information"
                      open={openSections.business}
                      onToggle={toggleSection}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
                        <InfoField label="Business Profile" value={venue.businessName} />
                        <InfoField label="Venue Owner" value={venue.ownerName} />
                        <div className="sm:col-span-2">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/admin/business-profile/${venue.businessId}`)
                            }
                            className="text-sm font-medium text-[#C89B3C] hover:underline"
                          >
                            Open Business Profile
                          </button>
                        </div>
                      </div>
                    </CollapsibleCard>
                  )}

                  {/* Venue Description â€” last section */}
                  <CollapsibleCard
                    id="description"
                    icon={StickyNote}
                    title="Venue Description"
                    open={openSections.description}
                    onToggle={toggleSection}
                  >
                    <div className="space-y-3">
                      <div>
                        <InfoField
                          label="Short Description"
                          value={editable ? form!.shortDescription : venue.shortDescription || ""}
                          editable={editable}
                          onChange={(v) => onChange?.("shortDescription", v.slice(0, 200))}
                          wide
                          textarea
                        />
                        {editable && (
                          <p className="mt-1 ml-0 sm:ml-[150px] text-[11px] text-[#9CA3AF]">
                            {form!.shortDescription.length}/200 characters
                          </p>
                        )}
                      </div>
                      <InfoField
                        label="House Rules"
                        value={editable ? form!.houseRules : venue.houseRules || ""}
                        editable={editable}
                        onChange={(v) => onChange?.("houseRules", v)}
                        wide
                        textarea
                      />
                    </div>
                  </CollapsibleCard>
                </div>
              </div>
            }
            overview={<VenueOverviewCard venue={venue} isCreate={isCreate} />}
            crossReference={
              !isCreate ? (
                <>
                  <RelationCard
                    icon={Layers}
                    title="Bookings"
                    subtitle="All bookings for this venue"
                    defaultOpen
                    actions={<ViewAllButton href="/admin/bookings" label="View All Bookings" />}
                  >
                    <RelatedBookingsTable
                      bookings={relatedVenueBookings}
                      showCustomer
                      emptyText="No Bookings Found"
                    />
                  </RelationCard>

                  <RelationCard
                    icon={FileText}
                    title="Invoices"
                    subtitle="Every invoice generated for this venue"
                    defaultOpen
                    actions={<ViewAllButton href="/admin/invoices" label="View All Invoices" />}
                  >
                    <RelatedInvoicesTable rows={relatedInvoices} />
                  </RelationCard>
                </>
              ) : undefined
            }
          />
        )}

        {tab === "gallery" && (
          <div className="space-y-3">
            <CollapsibleCard id="cover" icon={ImageIcon} title="Cover Image" open onToggle={() => {}} noCollapse>
              <div className="relative rounded-[14px] overflow-hidden border border-[#E8EAF0] bg-[#F3F4F6] aspect-[16/7] max-h-[280px]">
                {coverImage ? (
                  <img src={coverImage} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#FFF3EB] text-[#C89B3C] text-4xl font-semibold">
                    {initials}
                  </div>
                )}
                {editable && (
                  <div className="absolute bottom-3 right-3 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="h-9 px-3 rounded-lg bg-white text-[#374151] text-[12px] font-medium inline-flex items-center gap-1.5 hover:bg-[#FCFCFD] shadow-sm border border-[#E8EAF0]"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {coverImage ? "Replace Cover" : "Add Cover"}
                    </button>
                  </div>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setCoverImage(URL.createObjectURL(file));
                    e.target.value = "";
                  }}
                />
              </div>
            </CollapsibleCard>

            <CollapsibleCard
              id="galleryGrid"
              icon={ImageIcon}
              title="Photo Gallery"
              subtitle={`${galleryImages.length} photo(s)`}
              open
              onToggle={() => {}}
              noCollapse
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {galleryImages.map((url, idx) => (
                  <GalleryTile
                    key={`${url}-${idx}`}
                    url={url}
                    editable={editable}
                    onPreview={() => setLightboxIndex(idx)}
                    onReplace={(file) => replaceGalleryImage(idx, file)}
                    onDelete={() => removeGalleryImage(idx)}
                  />
                ))}
                {editable && <AddTile onAdd={addGalleryImage} label="Add Photo" />}
              </div>
            </CollapsibleCard>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CollapsibleCard
                id="images360"
                icon={ImageIcon}
                title="360Â° Tour"
                open
                onToggle={() => {}}
                noCollapse
              >
                {images360.length > 0 ? (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">360 Tour Available</p>
                      <p className="text-[12px] text-[#9CA3AF] mt-0.5">{images360.length} view(s)</p>
                    </div>
                    <div className="flex gap-1.5">
                      <Button variant="secondary" size="sm" onClick={() => window.open(images360[0], "_blank")}>
                        Open
                      </Button>
                      {editable && <AddTileCompact onAdd={add360Image} />}
                    </div>
                  </div>
                ) : editable ? (
                  <AddTile onAdd={add360Image} label="Add 360 Tour" />
                ) : (
                  <p className="text-sm text-[#9CA3AF]">No 360Â° tour uploaded.</p>
                )}
              </CollapsibleCard>

              <CollapsibleCard id="videoCard" icon={Video} title="Video" open onToggle={() => {}} noCollapse>
                {videoUrl ? (
                  <div className="space-y-3">
                    <div className="relative group rounded-[12px] overflow-hidden border border-[#E8EAF0] bg-[#111827] aspect-video">
                      <button
                        type="button"
                        onClick={() => setShowVideoModal(true)}
                        className="absolute inset-0 w-full h-full flex items-center justify-center"
                        aria-label="Play video"
                      >
                        <span className="w-12 h-12 rounded-full bg-[#C89B3C] text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                          <Video className="w-5 h-5" />
                        </span>
                        <p className="absolute bottom-2 left-3 text-[12px] text-white/90 font-medium">Play video</p>
                      </button>
                      {editable && (
                        <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowVideoModal(false);
                              setVideoUrl("");
                            }}
                            className="h-8 w-8 rounded-lg bg-white border border-[#FECACA] text-[#DC2626] inline-flex items-center justify-center shadow-sm hover:bg-[#FEF2F2] transition-colors"
                            aria-label="Delete video"
                            title="Delete video"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    {editable && (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[12px] text-[#9CA3AF] truncate min-w-0 flex-1" title={videoUrl}>
                          {videoUrl}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button variant="secondary" size="sm" onClick={() => setShowVideoModal(true)}>
                            Play
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={Trash2}
                            onClick={() => {
                              setShowVideoModal(false);
                              setVideoUrl("");
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : editable ? (
                  <InlineField label="Video URL">
                    <input
                      className={inputCls}
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                  </InlineField>
                ) : (
                  <p className="text-sm text-[#9CA3AF]">No video added.</p>
                )}
              </CollapsibleCard>
            </div>

            {lightboxIndex !== null && galleryImages[lightboxIndex] && (
              <GalleryLightbox
                images={galleryImages}
                index={lightboxIndex}
                editable={editable}
                onClose={() => setLightboxIndex(null)}
                onPrev={() =>
                  setLightboxIndex((i) =>
                    i === null ? 0 : (i - 1 + galleryImages.length) % galleryImages.length
                  )
                }
                onNext={() =>
                  setLightboxIndex((i) => (i === null ? 0 : (i + 1) % galleryImages.length))
                }
                onReplace={(file) => {
                  replaceGalleryImage(lightboxIndex, file);
                }}
                onDelete={() => {
                  removeGalleryImage(lightboxIndex);
                  setLightboxIndex(null);
                }}
              />
            )}

            {showVideoModal && videoUrl && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                <div className="bg-white rounded-[14px] w-full max-w-3xl overflow-hidden border border-[#E8EAF0]">
                  <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#E8EAF0]">
                    <p className="text-sm font-semibold text-[#111827]">Venue Video</p>
                    <div className="flex items-center gap-1.5">
                      {editable && (
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => {
                            setShowVideoModal(false);
                            setVideoUrl("");
                          }}
                        >
                          Delete
                        </Button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowVideoModal(false)}
                        className="h-8 px-3 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] text-sm font-medium transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                  <div className="aspect-video bg-[#111827]">
                    <iframe
                      title="Venue video"
                      src={
                        videoUrl.includes("watch?v=")
                          ? videoUrl.replace("watch?v=", "embed/")
                          : videoUrl
                      }
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "availability" && (
          <VenueAvailabilityPanel
            key={venue.id}
            venue={venue}
            availability={availability}
            onBook={handleBookSlot}
            onViewBooking={openBookingFromRow}
            bookActionLabel="Proceed to Booking"
          />
        )}

        {tab === "pricing" && (
          <div className="space-y-3">
            {editable && form && onChange ? (
              <PricingBookingRules form={form} onChange={onChange} editable />
            ) : (
              <PricingBookingRules venue={venue} editable={false} />
            )}
          </div>
        )}

        {tab === "reviews" && (
          <CollapsibleCard id="reviewsTab" icon={Star} title="Reviews" subtitle="Customer feedback for this venue" open onToggle={() => {}} noCollapse>
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="grid grid-cols-3 gap-2.5 lg:min-w-[280px]">
                <CompactKpi label="Average Rating" value={venue.rating > 0 ? venue.rating.toFixed(1) : "â€”"} />
                <CompactKpi label="Total Reviews" value={String(venue.totalReviews)} />
                <CompactKpi label="Recommend %" value={`${recommendationPct}%`} />
              </div>
              <div className="flex-1 space-y-1.5">
                {venue.ratingDistribution.map((row) => (
                  <div key={row.stars} className="flex items-center gap-2.5">
                    <span className="text-[12px] text-[#6B7280] w-8">{row.stars}â˜…</span>
                    <div className="flex-1 h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#C89B3C]"
                        style={{ width: `${Math.round((row.count / totalForPct) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[12px] text-[#9CA3AF] w-6 text-right">{row.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                  placeholder="Search reviews..."
                  className={`${inputCls} pl-9`}
                />
              </div>
              <select value={reviewRatingFilter} onChange={(e) => setReviewRatingFilter(e.target.value)} className={inputCls}>
                <option value="">All Ratings</option>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} Stars
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setReviewPhotosOnly((v) => !v)}
                className={`h-9 px-3 rounded-lg border text-[12px] font-medium ${
                  reviewPhotosOnly
                    ? "border-[#FFD4B0] bg-[#FFF8F3] text-[#C89B3C]"
                    : "border-[#E8EAF0] text-[#4B5563]"
                }`}
              >
                With Photos
              </button>
            </div>

            {filteredReviews.length === 0 ? (
              <EmptyBlock icon={Star} text="No reviews found." />
            ) : (
              <div className="space-y-2.5">
                {filteredReviews.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            )}
          </CollapsibleCard>
        )}

        {tab === "documents" && (
          <CollapsibleCard
            id="documentsTab"
            icon={FileText}
            title="Documents"
            subtitle={editable ? "Upload and manage verification documents for this venue" : "Verification documents on file"}
            open
            onToggle={() => {}}
            noCollapse
          >
            <DocumentsManager documents={documents} onChange={handleDocumentsChange} mode={mode} />
          </CollapsibleCard>
        )}
      </div>

      {showCreateFooter && (
        <CreateFormActionBar
          showPrevious={!isCreateFirstTab}
          isLastTab={isCreateLastTab}
          saving={saving}
          onCancel={onCancel}
          onPrevious={goPreviousTab}
          onSaveDraft={onSaveDraft}
          onSaveContinue={handleSaveContinue}
          onCreate={onSave}
        />
      )}

      {showEditFooter && (
        <FormActionBar
          isCreate={false}
          saving={saving}
          onCancel={onCancel}
          onSave={onSave}
        />
      )}
    </div>
  );
}

function FormActionBar({
  isCreate,
  saving,
  onCancel,
  onSave,
  onSaveDraft,
}: {
  isCreate: boolean;
  saving?: boolean;
  onCancel?: () => void;
  onSave?: () => void;
  onSaveDraft?: () => void;
}) {
  return (
    <div className="shrink-0 sticky bottom-0 z-30">
      <div className="flex flex-wrap items-center justify-end gap-2 rounded-[14px] border border-[#E8EAF0] bg-white/95 backdrop-blur-md px-4 py-3 shadow-[0_-6px_20px_rgba(16,24,40,0.08)]">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        {isCreate && onSaveDraft && (
          <Button variant="secondary" onClick={onSaveDraft} disabled={saving}>
            Save Draft
          </Button>
        )}
        <Button variant="primary" onClick={onSave} loading={saving}>
          {isCreate ? "Save Venue" : "Update Venue"}
        </Button>
      </div>
    </div>
  );
}

function CreateFormActionBar({
  showPrevious,
  isLastTab,
  saving,
  onCancel,
  onPrevious,
  onSaveDraft,
  onSaveContinue,
  onCreate,
}: {
  showPrevious: boolean;
  isLastTab: boolean;
  saving?: boolean;
  onCancel?: () => void;
  onPrevious: () => void;
  onSaveDraft?: () => void;
  onSaveContinue: () => void;
  onCreate?: () => void;
}) {
  return (
    <div className="shrink-0 sticky bottom-0 z-30">
      <div className="flex flex-wrap items-center justify-end gap-2 rounded-[14px] border border-[#E8EAF0] bg-white/95 backdrop-blur-md px-4 py-3 shadow-[0_-6px_20px_rgba(16,24,40,0.08)]">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        {showPrevious && (
          <Button variant="secondary" onClick={onPrevious} disabled={saving}>
            Previous
          </Button>
        )}
        {onSaveDraft && (
          <Button variant="secondary" onClick={onSaveDraft} disabled={saving}>
            Save Draft
          </Button>
        )}
        {isLastTab ? (
          <Button variant="primary" onClick={onCreate} loading={saving}>
            Create Venue
          </Button>
        ) : (
          <Button variant="primary" onClick={onSaveContinue} loading={saving}>
            Save & Continue
          </Button>
        )}
      </div>
    </div>
  );
}

function InheritedRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <span className="text-[#9CA3AF] shrink-0 w-[110px]">{label}</span>
      <span className="font-semibold text-[#111827] truncate">{value || "â€”"}</span>
    </div>
  );
}

function CollapsibleCard({
  icon: Icon,
  title,
  subtitle,
  children,
  actions,
  open,
  onToggle,
  id,
  noCollapse,
}: {
  id: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  open: boolean;
  onToggle: (id: string) => void;
  noCollapse?: boolean;
}) {
  return (
    <section className="bg-white border border-[#E8EAF0] rounded-[14px] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#FFF3EB]/60 border-b border-[#E8EAF0]">
        {noCollapse ? (
          <div className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
            <Icon className="w-4 h-4 text-[#C89B3C] shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-[#111827]">{title}</p>
              {subtitle && <p className="text-[12px] text-[#9CA3AF] normal-case tracking-normal">{subtitle}</p>}
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => onToggle(id)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
            <Icon className="w-4 h-4 text-[#C89B3C] shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-[#111827]">{title}</p>
              {subtitle && <p className="text-[12px] text-[#9CA3AF] normal-case tracking-normal">{subtitle}</p>}
            </div>
          </button>
        )}
        {actions && <div className="shrink-0">{actions}</div>}
        {!noCollapse && (
          <button
            type="button"
            onClick={() => onToggle(id)}
            className="shrink-0 p-0.5 text-[#9CA3AF] hover:text-[#6B7280]"
            aria-label={open ? "Collapse" : "Expand"}
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
      {open && <div className="px-4 md:px-5 py-4">{children}</div>}
    </section>
  );
}

function InlineField({
  label,
  required,
  children,
  wide,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`flex items-start gap-2 ${wide ? "w-full" : ""}`}>
      <p className={labelCls}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </p>
      <div className="flex-1 min-w-0 pt-px">{children}</div>
    </div>
  );
}

function InfoField({
  label,
  value,
  editable,
  onChange,
  required,
  wide,
  textarea,
}: {
  label: string;
  value: string;
  editable?: boolean;
  onChange?: (value: string) => void;
  required?: boolean;
  wide?: boolean;
  textarea?: boolean;
}) {
  return (
    <InlineField label={label} required={required} wide={wide}>
      {editable ? (
        textarea ? (
          <textarea className={textareaCls} rows={2} value={value} onChange={(e) => onChange?.(e.target.value)} />
        ) : (
          <input className={inputCls} value={value} onChange={(e) => onChange?.(e.target.value)} />
        )
      ) : (
        <p className={`${valueCls} ${textarea ? "whitespace-pre-wrap" : ""}`}>{value || "â€”"}</p>
      )}
    </InlineField>
  );
}

function NumberField({
  label,
  value,
  editable,
  onChange,
  required,
  hint,
}: {
  label: string;
  value: string;
  editable?: boolean;
  onChange?: (value: string) => void;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <InlineField label={label} required={required}>
        {editable ? (
          <input
            type="number"
            min={0}
            inputMode="numeric"
            className={inputCls}
            value={value}
            onChange={(e) => onChange?.(e.target.value.replace(/[^0-9]/g, ""))}
          />
        ) : (
          <p className={valueCls}>{value || "â€”"}</p>
        )}
      </InlineField>
      {hint && (
        <p className="mt-1 ml-[136px] sm:ml-[150px] text-[11px] text-[#9CA3AF] leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <InlineField label={label} required={required}>
      <select className={`${inputCls} appearance-none cursor-pointer`} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value || "empty"} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </InlineField>
  );
}

function ToggleField({
  label,
  value,
  editable,
  onChange,
}: {
  label: string;
  value: boolean;
  editable?: boolean;
  onChange?: (value: boolean) => void;
}) {
  return (
    <InlineField label={label}>
      {editable ? (
        <button
          type="button"
          onClick={() => onChange?.(!value)}
          className={`inline-flex items-center h-6 w-11 rounded-full transition-colors ${value ? "bg-[#C89B3C]" : "bg-[#E5E7EB]"}`}
        >
          <span
            className={`inline-block h-5 w-5 bg-white rounded-full shadow transform transition-transform ${
              value ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      ) : (
        <p className={valueCls}>{value ? "Yes" : "No"}</p>
      )}
    </InlineField>
  );
}

function AmenityChips({
  selected,
  editable,
  onToggle,
  options = amenityOptions,
}: {
  selected: string[];
  editable?: boolean;
  onToggle?: (key: string) => void;
  options?: AmenityOption[];
}) {
  const list = editable ? options : options.filter((a) => selected.includes(a.key));
  if (!editable && list.length === 0) {
    return <p className="text-sm text-[#9CA3AF]">No amenities listed.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {list.map((a) => {
        const active = selected.includes(a.key);
        return (
          <button
            key={a.key}
            type="button"
            disabled={!editable}
            onClick={() => onToggle?.(a.key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px] font-medium transition-colors ${
              active ? "bg-[#FFF3EB] border-[#FFD4B0] text-[#C89B3C]" : "bg-white border-[#E8EAF0] text-[#6B7280]"
            } ${editable ? "cursor-pointer hover:border-[#FFD4B0]" : "cursor-default"}`}
          >
            <AmenityIcon name={a.icon} className="w-3.5 h-3.5" />
            {a.label}
          </button>
        );
      })}
    </div>
  );
}

function ChipMultiSelect({
  options,
  selected,
  editable,
  onToggle,
}: {
  options: string[];
  selected: string[];
  editable?: boolean;
  onToggle?: (value: string) => void;
}) {
  const list = editable ? options : options.filter((o) => selected.includes(o));
  if (!editable && list.length === 0) {
    return <p className="text-sm text-[#9CA3AF]">â€”</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {list.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            disabled={!editable}
            onClick={() => onToggle?.(opt)}
            className={`px-3 py-1.5 rounded-full border text-[13px] font-medium transition-colors ${
              active ? "bg-[#FFF3EB] border-[#FFD4B0] text-[#C89B3C]" : "bg-white border-[#E8EAF0] text-[#6B7280]"
            } ${editable ? "cursor-pointer hover:border-[#FFD4B0]" : "cursor-default"}`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function GalleryTile({
  url,
  onReplace,
  onDelete,
  onPreview,
  editable = true,
}: {
  url: string;
  onReplace: (file: File) => void;
  onDelete: () => void;
  onPreview: () => void;
  editable?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="relative group rounded-[12px] overflow-hidden border border-[#E8EAF0] aspect-[4/3] bg-[#F3F4F6]">
      <img
        src={url}
        alt=""
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
        <TileIconBtn icon={Eye} onClick={onPreview} />
        <TileIconBtn icon={Download} onClick={() => window.alert("Downloading image (demo)")} />
        {editable && (
          <>
            <TileIconBtn icon={Upload} onClick={() => inputRef.current?.click()} />
            <TileIconBtn icon={Trash2} onClick={onDelete} danger />
          </>
        )}
      </div>
      {editable && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onReplace(file);
            e.target.value = "";
          }}
        />
      )}
    </div>
  );
}

function TileIconBtn({
  icon: Icon,
  onClick,
  danger,
}: {
  icon: typeof Eye;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
        danger ? "bg-white text-red-600 hover:bg-red-50" : "bg-white text-[#374151] hover:bg-[#FFF3EB] hover:text-[#C89B3C]"
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function AddTile({ onAdd, label = "Add Image" }: { onAdd: (file: File) => void; label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragEnter={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onAdd(file);
      }}
      className={`aspect-[4/3] rounded-[12px] border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-colors ${
        dragging ? "border-[#C89B3C] bg-[#FFF8F3]" : "border-[#E5E7EB] bg-[#FAFAFA] hover:border-[#FFD4B0] hover:bg-[#FFF8F3]"
      }`}
    >
      <Plus className={`w-5 h-5 ${dragging ? "text-[#C89B3C]" : "text-[#9CA3AF]"}`} />
      <span className="text-[12px] font-medium text-[#6B7280]">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onAdd(file);
          e.target.value = "";
        }}
      />
    </button>
  );
}

function AddTileCompact({ onAdd }: { onAdd: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button variant="secondary" size="sm" icon={Plus} onClick={() => inputRef.current?.click()}>
        Add
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onAdd(file);
          e.target.value = "";
        }}
      />
    </>
  );
}

function GalleryLightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
  onReplace,
  onDelete,
  editable = true,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onReplace: (file: File) => void;
  onDelete: () => void;
  editable?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-4xl">
        <img
          src={images[index]}
          alt=""
          className="w-full max-h-[75vh] object-contain rounded-[14px] bg-black"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-white font-medium">
            {index + 1} / {images.length}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Button variant="secondary" size="sm" onClick={onPrev}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" onClick={onNext}>
              Next
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(images[index], "_blank")}
            >
              Download
            </Button>
            {editable && (
              <>
                <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
                  Replace
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onDelete}
                  className="!text-[#DC2626] !border-[#FECACA]"
                >
                  Delete
                </Button>
              </>
            )}
            <Button variant="primary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
        {editable && (
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onReplace(file);
              e.target.value = "";
            }}
          />
        )}
      </div>
    </div>
  );
}

function DayStatusPill({ status }: { status: DayAvailabilityStatus }) {
  const styles: Record<DayAvailabilityStatus, string> = {
    available: "bg-[#ECFDF3] text-[#16A34A] border-[#D3F8E1]",
    booked: "bg-[#FFF3EB] text-[#C89B3C] border-[#FFD4B0]",
    blocked: "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]",
    holiday: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
    maintenance: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function bookingTone(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-[#ECFDF3] text-[#16A34A] border-[#D3F8E1]";
    case "pending":
      return "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]";
    case "completed":
      return "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]";
    case "cancelled":
      return "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]";
    default:
      return "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]";
  }
}

function paymentTone(status: string) {
  switch (status) {
    case "paid":
      return "bg-[#ECFDF3] text-[#16A34A] border-[#D3F8E1]";
    case "partial":
      return "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]";
    case "pending":
      return "bg-[#FFF3EB] text-[#C89B3C] border-[#FFD4B0]";
    case "refunded":
      return "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]";
    case "failed":
      return "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]";
    default:
      return "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]";
  }
}

function BookingTinyPill({
  children,
  tone,
}: {
  children: ReactNode;
  tone: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${tone}`}
    >
      {children}
    </span>
  );
}

function AvailabilityEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
      <div className="w-12 h-12 rounded-2xl bg-[#FFF8F3] border border-[#FFD4B0] flex items-center justify-center mb-3">
        <CalendarDays className="w-6 h-6 text-[#C89B3C]" />
      </div>
      <p className="text-sm font-medium text-[#111827]">No bookings for the selected period.</p>
      <p className="text-[12px] text-[#9CA3AF] mt-1">Try adjusting filters or switching months.</p>
    </div>
  );
}

function ReviewCard({ review }: { review: Venue["reviews"][number] }) {
  const initials =
    review.avatarInitials ||
    review.customerName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  return (
    <div className="rounded-[12px] border border-[#E8EAF0] bg-[#FCFCFD] px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-[#FFF3EB] text-[#C89B3C] text-xs font-semibold flex items-center justify-center shrink-0 border border-[#FFD4B0]">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-[#111827]">{review.customerName}</p>
                {review.verifiedBooking && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border border-[#D3F8E1] bg-[#ECFDF3] text-[#16A34A]">
                    Verified Booking
                  </span>
                )}
              </div>
              <p className="text-[12px] text-[#9CA3AF] mt-0.5">
                {[review.eventType, review.bookingDate ? formatDate(review.bookingDate) : null]
                  .filter(Boolean)
                  .join(" Â· ") || formatDate(review.date)}
              </p>
            </div>
            <div className="flex items-center gap-1 text-[#C89B3C] shrink-0">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="text-sm font-semibold">{review.rating}.0</span>
            </div>
          </div>
          <p className="text-sm text-[#4B5563]">{review.comment}</p>
          <div className="mt-1.5 flex items-center gap-3 text-[12px] text-[#9CA3AF]">
            <span>{formatDate(review.date)}</span>
            {!!review.imagesCount && review.imagesCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                {review.imagesCount} photo(s)
              </span>
            )}
          </div>
          {review.reply && (
            <div className="mt-2 pl-3 border-l-2 border-[#C89B3C]/40">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                Venue Reply{review.replyDate ? ` Â· ${formatDate(review.replyDate)}` : ""}
              </p>
              <p className="text-sm text-[#4B5563] mt-0.5">{review.reply}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VenueOverviewCard({ venue, isCreate }: { venue: Venue; isCreate: boolean }) {
  return (
    <div className="bg-white border border-[#E8EAF0] rounded-[14px] overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="px-4 py-2.5 bg-[#FFF3EB]/70 border-b border-[#E8EAF0]">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-[#111827]">Venue Overview</p>
        {isCreate && (
          <p className="text-[12px] text-[#9CA3AF] mt-0.5 normal-case tracking-normal">
            Stats appear after the venue is saved
          </p>
        )}
      </div>
      <div className="p-4 space-y-3">
        {isCreate ? (
          <div className="rounded-[12px] border border-dashed border-[#E8EAF0] bg-[#FCFCFD] px-4 py-10 text-center">
            <p className="text-sm text-[#9CA3AF]">No venue activity yet</p>
            <p className="text-[12px] text-[#D1D5DB] mt-1">Booking and review stats will show here</p>
          </div>
        ) : (
          <>
            <OverviewRow label="Today's Bookings" value={String(venue.todaysBookings)} />
            <OverviewRow label="Upcoming Events" value={String(venue.upcomingBookings)} />
            <OverviewRow label="Operating Hours" value={venue.operatingHours || "—"} />
            <OverviewRow label="Average Rating" value={venue.rating > 0 ? `${venue.rating.toFixed(1)} / 5` : "—"} />
            <OverviewRow label="Total Reviews" value={String(venue.totalReviews)} />
            <div className="border-t border-[#E8EAF0] pt-3 space-y-3">
              <OverviewRow label="Revenue" value={formatCurrency(venue.revenue)} />
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-[#6B7280]">Availability</span>
                <AvailabilityPill status={venue.availabilityLabel} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-[#6B7280]">Approval</span>
                <ApprovalPill status={venue.approval} />
              </div>
              <OverviewRow label="Created Date" value={formatDate(venue.createdAt)} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function OverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13px] text-[#6B7280]">{label}</span>
      <span className="text-sm font-semibold text-[#111827]">{value}</span>
    </div>
  );
}

function CompactKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-[#E8EAF0] bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <p className="text-[11px] font-medium text-[#6B7280] truncate">{label}</p>
      <p className="text-sm font-semibold text-[#111827] mt-0.5 truncate">{value}</p>
    </div>
  );
}

function EmptyBlock({ icon: Icon, text }: { icon: ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="py-6 text-center">
      <div className="mx-auto w-9 h-9 rounded-xl bg-[#FFF3EB] text-[#C89B3C] flex items-center justify-center mb-2">
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-sm text-[#6B7280]">{text}</p>
    </div>
  );
}
