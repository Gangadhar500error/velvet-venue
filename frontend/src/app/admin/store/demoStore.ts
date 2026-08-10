"use client";



import { create } from "zustand";

import { mockBusinessProfiles } from "../business-profile/data";

import { BusinessProfile } from "../business-profile/types";

import { mockCustomers } from "../customers/data";

import { Customer } from "../customers/types";

import { mockVenueOwners } from "../venue-owners/data";

import { VenueOwner } from "../venue-owners/types";

import { mockVenues, updateVenueAvailabilityDay } from "../venues/data";

import { AvailabilityDay, Venue } from "../venues/types";

import { mockBookings } from "../bookings/data";

import { Booking } from "../bookings/types";

import { hydrateBookingPayments, seedAdvancePayment } from "../bookings/payments";

import { reconcileDemoState } from "./reconcileState";



function cloneArray<T>(items: T[]): T[] {

  return items.map((item) => structuredClone(item));

}



function normalizeSlot(s?: string) {

  const v = (s || "Full Day").toLowerCase();

  if (v.includes("morning")) return "morning";

  if (v.includes("afternoon")) return "afternoon";

  if (v.includes("evening")) return "evening";

  if (v.includes("night")) return "night";

  if (v.includes("full")) return "full_day";

  return v;

}



function initialState() {

  return reconcileDemoState({

    businesses: cloneArray(mockBusinessProfiles),

    venues: cloneArray(mockVenues),

    customers: cloneArray(mockCustomers),

    vendors: cloneArray(mockVenueOwners),

    bookings: cloneArray(mockBookings).map(hydrateBookingPayments),

  });

}



function reconcile(partial: {

  businesses?: BusinessProfile[];

  venues?: Venue[];

  customers?: Customer[];

  vendors?: VenueOwner[];

  bookings?: Booking[];

}) {

  return (current: ReturnType<typeof initialState>) =>

    reconcileDemoState({

      businesses: partial.businesses ?? current.businesses,

      venues: partial.venues ?? current.venues,

      customers: partial.customers ?? current.customers,

      vendors: partial.vendors ?? current.vendors,

      bookings: partial.bookings ?? current.bookings,

    });

}



interface DemoState {

  businesses: BusinessProfile[];

  venues: Venue[];

  customers: Customer[];

  vendors: VenueOwner[];

  bookings: Booking[];



  addBusiness: (business: BusinessProfile) => void;

  updateBusiness: (id: string, patch: Partial<BusinessProfile>) => void;

  removeBusiness: (id: string) => void;



  addVenue: (venue: Venue) => void;

  updateVenue: (id: string, patch: Partial<Venue>) => void;

  removeVenue: (id: string) => void;

  setVenueAvailability: (venueId: string, availability: AvailabilityDay[]) => void;

  markSlotBooked: (payload: {

    venueId: string;

    date: string;

    slot: string;

    bookingId: string;

    bookingRef: string;

    customerName: string;

    eventType: string;

    guests?: number;

  }) => boolean;



  addCustomer: (customer: Customer) => void;

  updateCustomer: (id: string, patch: Partial<Customer>) => void;

  removeCustomer: (id: string) => void;



  addVendor: (vendor: VenueOwner) => void;

  updateVendor: (id: string, patch: Partial<VenueOwner>) => void;

  removeVendor: (id: string) => void;



  addBooking: (booking: Booking) => void;

  updateBooking: (id: string, patch: Partial<Booking>) => void;

  removeBooking: (id: string) => void;



  patchAvailabilityDay: (

    venueId: string,

    date: string,

    slot: string,

    patch: Partial<AvailabilityDay>

  ) => void;



  nextBusinessIds: () => { id: string; businessId: string };

  nextVenueIds: () => { id: string; venueId: string };

  nextCustomerIds: () => { id: string; customerId: string };

  nextVendorIds: () => { id: string; ownerId: string };

  nextBookingIds: () => { id: string; bookingId: string };



  getActiveBusinesses: () => BusinessProfile[];

  getVenuesByBusiness: (businessId: string) => Venue[];

  getBookingById: (id: string) => Booking | undefined;

  getVenueById: (id: string) => Venue | undefined;

  getCustomerById: (id: string) => Customer | undefined;

  isSlotBooked: (venueId: string, date: string, slot: string) => boolean;

}



export const useDemoStore = create<DemoState>((set, get) => ({

  ...initialState(),



  addBusiness: (business) =>

    set((s) =>

      reconcile({

        businesses: s.businesses.some((b) => b.id === business.id)

          ? s.businesses.map((b) => (b.id === business.id ? business : b))

          : [business, ...s.businesses],

      })(s)

    ),

  updateBusiness: (id, patch) =>

    set((s) =>

      reconcile({

        businesses: s.businesses.map((b) =>

          b.id === id || b.businessId === id ? { ...b, ...patch } : b

        ),

      })(s)

    ),

  removeBusiness: (id) =>

    set((s) =>

      reconcile({

        businesses: s.businesses.filter((b) => b.id !== id && b.businessId !== id),

      })(s)

    ),



  addVenue: (venue) =>

    set((s) =>

      reconcile({

        venues: s.venues.some((v) => v.id === venue.id)

          ? s.venues.map((v) => (v.id === venue.id ? venue : v))

          : [venue, ...s.venues],

      })(s)

    ),

  updateVenue: (id, patch) =>

    set((s) =>

      reconcile({

        venues: s.venues.map((v) => (v.id === id || v.venueId === id ? { ...v, ...patch } : v)),

      })(s)

    ),

  removeVenue: (id) =>

    set((s) =>

      reconcile({

        venues: s.venues.filter((v) => v.id !== id && v.venueId !== id),

      })(s)

    ),

  setVenueAvailability: (venueId, availability) =>

    set((s) => ({

      venues: s.venues.map((v) =>

        v.id === venueId || v.venueId === venueId ? { ...v, availability } : v

      ),

    })),

  markSlotBooked: (payload) => {

    const venue = get().venues.find((v) => v.id === payload.venueId || v.venueId === payload.venueId);

    if (!venue) return false;

    const slotNorm = normalizeSlot(payload.slot);

    const idx = venue.availability.findIndex(

      (a) => a.date === payload.date && normalizeSlot(a.slot) === slotNorm

    );

    if (idx >= 0 && venue.availability[idx].status === "booked" && venue.availability[idx].bookingId) {

      return false;

    }

    const nextAvailability = [...venue.availability];

    const row: AvailabilityDay = {

      ...(idx >= 0 ? nextAvailability[idx] : { date: payload.date, slot: payload.slot }),

      date: payload.date,

      slot: payload.slot,

      status: "booked",

      bookingId: payload.bookingId,

      bookingRef: payload.bookingRef,

      customerName: payload.customerName,

      eventType: payload.eventType,

      guests: payload.guests,

    };

    if (idx >= 0) nextAvailability[idx] = row;

    else nextAvailability.push(row);



    updateVenueAvailabilityDay(payload.venueId, payload.date, payload.slot, row);



    set((s) =>

      reconcile({

        venues: s.venues.map((v) =>

          v.id === venue.id ? { ...v, availability: nextAvailability } : v

        ),

      })(s)

    );

    return true;

  },



  patchAvailabilityDay: (venueId, date, slot, patch) => {

    set((s) => ({

      venues: s.venues.map((v) => {

        if (v.id !== venueId && v.venueId !== venueId) return v;

        const slotNorm = normalizeSlot(slot);

        const idx = v.availability.findIndex(

          (a) => a.date === date && normalizeSlot(a.slot) === slotNorm

        );

        const next = [...v.availability];

        const base: AvailabilityDay =

          idx >= 0 ? next[idx] : { date, slot, status: "available" };

        const row: AvailabilityDay = {

          ...base,

          ...patch,

          date,

          slot: patch.slot || slot || base.slot,

          status: patch.status ?? base.status,

        };

        if (idx >= 0) next[idx] = row;

        else next.push(row);

        updateVenueAvailabilityDay(venueId, date, slot, row);

        return { ...v, availability: next };

      }),

    }));

  },



  nextBusinessIds: () => {

    const n = 300100 + get().businesses.length + 1;

    return { id: String(Date.now()), businessId: `BIZ-${n}` };

  },

  nextVenueIds: () => {

    const n = 40000 + get().venues.length + Math.floor(Math.random() * 40);

    return { id: String(Date.now()), venueId: `VEN-${n}` };

  },

  nextCustomerIds: () => {

    const n = 100200 + get().customers.length + 1;

    return { id: String(Date.now()), customerId: `CUST-${n}` };

  },

  nextVendorIds: () => {

    const n = 200200 + get().vendors.length + 1;

    return { id: String(Date.now()), ownerId: `OWN-${n}` };

  },

  nextBookingIds: () => {

    const n = 240900 + get().bookings.length + Math.floor(Math.random() * 40);

    return { id: String(Date.now()), bookingId: `BK-${n}` };

  },



  addCustomer: (customer) =>

    set((s) =>

      reconcile({

        customers: s.customers.some((c) => c.id === customer.id)

          ? s.customers.map((c) => (c.id === customer.id ? customer : c))

          : [customer, ...s.customers],

      })(s)

    ),

  updateCustomer: (id, patch) =>

    set((s) =>

      reconcile({

        customers: s.customers.map((c) =>

          c.id === id || c.customerId === id ? { ...c, ...patch } : c

        ),

      })(s)

    ),

  removeCustomer: (id) =>

    set((s) =>

      reconcile({

        customers: s.customers.filter((c) => c.id !== id && c.customerId !== id),

      })(s)

    ),



  addVendor: (vendor) =>

    set((s) =>

      reconcile({

        vendors: s.vendors.some((v) => v.id === vendor.id)

          ? s.vendors.map((v) => (v.id === vendor.id ? vendor : v))

          : [vendor, ...s.vendors],

      })(s)

    ),

  updateVendor: (id, patch) =>

    set((s) =>

      reconcile({

        vendors: s.vendors.map((v) => (v.id === id ? { ...v, ...patch } : v)),

      })(s)

    ),

  removeVendor: (id) =>

    set((s) =>

      reconcile({

        vendors: s.vendors.filter((v) => v.id !== id),

      })(s)

    ),



  addBooking: (booking) =>

    set((s) => {

      const withTxn = seedAdvancePayment(booking);

      const bookings = s.bookings.some((b) => b.id === withTxn.id)

        ? s.bookings.map((b) => (b.id === withTxn.id ? withTxn : b))

        : [withTxn, ...s.bookings];

      return reconcile({ bookings })(s);

    }),

  updateBooking: (id, patch) =>
    set((s) => {
      const prev = s.bookings.find((b) => b.id === id || b.bookingId === id);
      const bookings = s.bookings.map((b) => {
        if (b.id !== id && b.bookingId !== id) return b;
        return hydrateBookingPayments({ ...b, ...patch });
      });
      const next = bookings.find((b) => b.id === id || b.bookingId === id);
      let venues = s.venues;

      // When a booking is cancelled/refunded, free its availability slot again.
      if (
        prev &&
        next &&
        (next.bookingStatus === "cancelled" || next.bookingStatus === "refunded") &&
        prev.bookingStatus !== "cancelled" &&
        prev.bookingStatus !== "refunded"
      ) {
        const slotNorm = normalizeSlot(next.slot);
        venues = s.venues.map((v) => {
          if (v.id !== next.venueId && v.venueId !== next.venueId) return v;
          return {
            ...v,
            availability: v.availability.map((a) => {
              const sameDate = a.date === next.eventDate;
              const sameSlot = normalizeSlot(a.slot) === slotNorm;
              const sameBooking =
                a.bookingId === next.bookingId || a.bookingRef === next.id;
              if (sameDate && (sameSlot || sameBooking) && a.status === "booked") {
                return {
                  ...a,
                  status: "available" as const,
                  bookingId: undefined,
                  bookingRef: undefined,
                  customerName: undefined,
                  eventType: undefined,
                  guests: undefined,
                };
              }
              return a;
            }),
          };
        });
      }

      return reconcile({ bookings, venues })(s);
    }),

  removeBooking: (id) =>

    set((s) =>

      reconcile({

        bookings: s.bookings.filter((b) => b.id !== id && b.bookingId !== id),

      })(s)

    ),



  getActiveBusinesses: () =>

    get().businesses.filter((b) => String(b.status || "").toLowerCase() !== "inactive"),

  getVenuesByBusiness: (businessId) =>

    get().venues.filter((v) => v.businessId === businessId),

  getBookingById: (id) => get().bookings.find((b) => b.id === id || b.bookingId === id),

  getVenueById: (id) => get().venues.find((v) => v.id === id || v.venueId === id),

  getCustomerById: (id) => get().customers.find((c) => c.id === id || c.customerId === id),

  isSlotBooked: (venueId, date, slot) => {

    const venue = get().venues.find((v) => v.id === venueId || v.venueId === venueId);

    if (!venue) return false;

    const slotNorm = normalizeSlot(slot);

    return venue.availability.some(

      (a) =>

        a.date === date &&

        normalizeSlot(a.slot) === slotNorm &&

        a.status === "booked" &&

        Boolean(a.bookingId)

    );

  },

}));

