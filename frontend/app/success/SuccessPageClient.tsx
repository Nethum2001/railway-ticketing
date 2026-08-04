"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Download, MapPin, MoveDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { formatJourneyDate } from "@/components/railway-data";
import {
  getMyBookings,
  getStoredAuthSession,
  type BookingResponse,
} from "@/lib/api";

export type SuccessSearchParams = {
  bookingCode?: string | string[];
  bookingCodes?: string | string[];
  seat?: string | string[];
  seats?: string | string[];
  coach?: string | string[];
  from?: string | string[];
  to?: string | string[];
  date?: string | string[];
  name?: string | string[];
  travelClass?: string | string[];
  fare?: string | string[];
};

function pickFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function formatMoney(value: number) {
  return `Rs. ${value.toLocaleString("en-LK")}`;
}

type ReservationViewModel = {
  bookingCode: string;
  bookingCodes: string[];
  coach: string;
  seats: string[];
  from: string;
  to: string;
  date: string;
  passenger: string;
  travelClass: string;
  totalFare: number;
};

function buildInitialReservation(searchParams: SuccessSearchParams): ReservationViewModel {
  const bookingCode = pickFirst(searchParams.bookingCode);
  const bookingCodesRaw = pickFirst(searchParams.bookingCodes);
  const seatsRaw = pickFirst(searchParams.seats) || pickFirst(searchParams.seat);
  const fareRaw = Number(pickFirst(searchParams.fare));

  const bookingCodes = (bookingCodesRaw || bookingCode)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    bookingCode,
    bookingCodes,
    coach: pickFirst(searchParams.coach),
    seats: seatsRaw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    from: pickFirst(searchParams.from),
    to: pickFirst(searchParams.to),
    date: pickFirst(searchParams.date),
    passenger: pickFirst(searchParams.name),
    travelClass: pickFirst(searchParams.travelClass),
    totalFare: Number.isFinite(fareRaw) ? Math.max(0, fareRaw) : 0,
  };
}

function mergeWithFetchedBookings(
  base: ReservationViewModel,
  fetchedBookings: BookingResponse[],
): ReservationViewModel {
  if (fetchedBookings.length === 0) {
    return base;
  }

  const bookingsByCode = new Map(fetchedBookings.map((booking) => [booking.bookingCode, booking]));
  const orderedBookings = base.bookingCodes
    .map((code) => bookingsByCode.get(code))
    .filter((booking): booking is BookingResponse => Boolean(booking));

  if (orderedBookings.length === 0) {
    return base;
  }

  const firstBooking = orderedBookings[0];

  return {
    bookingCode: firstBooking.bookingCode,
    bookingCodes: orderedBookings.map((booking) => booking.bookingCode),
    coach: firstBooking.coachCode,
    seats: orderedBookings.map((booking) => booking.seatNumber),
    from: firstBooking.originStation,
    to: firstBooking.destinationStation,
    date: firstBooking.journeyDate,
    passenger: firstBooking.passengerName,
    travelClass: firstBooking.travelClass,
    totalFare: orderedBookings.reduce((sum, booking) => sum + booking.fare, 0),
  };
}

export function SuccessPageClient({ searchParams }: { searchParams: SuccessSearchParams }) {
  const [reservation, setReservation] = useState<ReservationViewModel>(() =>
    buildInitialReservation(searchParams),
  );
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    const initial = buildInitialReservation(searchParams);
    setReservation(initial);

    if (initial.bookingCodes.length === 0) {
      return;
    }

    const session = getStoredAuthSession();
    const token = session?.accessToken;
    if (!token) {
      return;
    }
    const authToken = token;

    let active = true;

    async function loadReservationFromApi() {
      try {
        setIsLoadingDetails(true);
        const allBookings = await getMyBookings(authToken);
        const bookedCodes = new Set(initial.bookingCodes);
        const matchedBookings = allBookings.filter((booking) => bookedCodes.has(booking.bookingCode));

        if (!active) {
          return;
        }

        setReservation((current) => mergeWithFetchedBookings(current, matchedBookings));
      } catch {
        // Keep using query-provided booking details if API fetch fails.
      } finally {
        if (active) {
          setIsLoadingDetails(false);
        }
      }
    }

    loadReservationFromApi();

    return () => {
      active = false;
    };
  }, [searchParams]);

  const seatSummary = useMemo(() => {
    if (reservation.coach && reservation.seats.length > 0) {
      return `${reservation.coach}-${reservation.seats.join(", ")}`;
    }

    return reservation.seats.length > 0 ? reservation.seats.join(", ") : "N/A";
  }, [reservation.coach, reservation.seats]);

  const classSummary = reservation.travelClass
    ? reservation.travelClass.replace(/_/g, " ")
    : "N/A";

  const fareSummary = formatMoney(reservation.totalFare);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <Card className="rail-panel overflow-hidden border-white/70">
          <CardHeader className="border-b border-white/60 bg-white/30 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="size-9" />
            </div>
            <CardTitle className="text-3xl text-slate-950">Booking Successful</CardTitle>
            {isLoadingDetails && (
              <p className="mt-2 text-sm text-slate-500">Refreshing reservation details...</p>
            )}
          </CardHeader>
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-stretch">
            <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:h-full">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Booking ID</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {reservation.bookingCode || "N/A"}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Passenger</p>
                  <p className="text-lg font-semibold text-slate-900">{reservation.passenger || "N/A"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Seat</p>
                  <p className="text-lg font-semibold text-slate-900">{seatSummary}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                  <p className="text-sm text-slate-500">Booking codes</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {reservation.bookingCodes.length > 0 ? reservation.bookingCodes.join(", ") : "N/A"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Class</p>
                  <p className="text-lg font-semibold text-slate-900">{classSummary}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <MapPin className="size-4 text-orange-600" />
                  Journey
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-center">
                  <span className="flex-1 text-lg font-semibold text-slate-900">{reservation.from || "N/A"}</span>
                  <MoveDown className="size-5 text-orange-500" />
                  <span className="flex-1 text-lg font-semibold text-slate-900">{reservation.to || "N/A"}</span>
                </div>
                <p className="mt-4 text-sm text-slate-500">
                  Travel date: {reservation.date ? formatJourneyDate(reservation.date) : "N/A"}
                </p>
              </div>
            </div>

            <div className="flex min-w-[240px] flex-col justify-between gap-4 rounded-3xl bg-slate-950 p-6 text-white">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-300">Ticket summary</p>
                <h2 className="mt-2 text-2xl font-semibold">Download your ticket</h2>
                <p className="mt-3 text-sm text-slate-300">Keep this confirmation for boarding and future reference.</p>
                <p className="mt-4 text-sm text-slate-300">Fare paid: {fareSummary}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="grid grid-cols-12 gap-1">
                  {Array.from({ length: 24 }).map((_, index) => (
                    <span key={index} className="h-14 rounded-sm bg-white/80" />
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f766e,#14b8a6_58%,#22c55e)] px-5 text-base font-medium text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-105"
              >
                <Download className="size-4" />
                Download Ticket
              </button>
              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 text-base font-medium text-white transition hover:bg-white/10"
              >
                Book Another Journey
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
