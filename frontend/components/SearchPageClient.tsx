"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, MapPinned, TrainFront } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { CoachTabs } from "@/components/CoachTabs";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { SeatGrid } from "@/components/SeatGrid";
import { coaches, formatJourneyDate } from "@/components/railway-data";
import { getSeatAvailability } from "@/lib/api";

type SearchPageClientProps = {
  initialFrom: string;
  initialTo: string;
  initialDate: string;
  initialClass: string;
};

const SEAT_COUNT = 52;

function getFirstAvailableSeat(bookedSeatNumbers: string[]) {
  const bookedSeatSet = new Set(bookedSeatNumbers);
  return Array.from({ length: SEAT_COUNT }, (_, index) => String(index + 1)).find((seatNumber) => !bookedSeatSet.has(seatNumber)) ?? "1";
}

export function SearchPageClient({ initialFrom, initialTo, initialDate, initialClass }: SearchPageClientProps) {
  const [activeCoach, setActiveCoach] = useState("R1");
  const [selectedSeat, setSelectedSeat] = useState("1");
  const [bookedSeatNumbers, setBookedSeatNumbers] = useState<string[]>([]);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const bookHref = useMemo(
    () =>
      `/booking?from=${encodeURIComponent(initialFrom)}&to=${encodeURIComponent(initialTo)}&date=${encodeURIComponent(initialDate)}&class=${encodeURIComponent(initialClass)}&coach=${encodeURIComponent(activeCoach)}&seat=${encodeURIComponent(selectedSeat)}`,
    [activeCoach, initialClass, initialDate, initialFrom, initialTo, selectedSeat]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      try {
        setAvailabilityError(null);
        const availability = await getSeatAvailability({
          coachCode: activeCoach,
          originStation: initialFrom,
          destinationStation: initialTo,
          journeyDate: initialDate,
        });

        if (cancelled) {
          return;
        }

        const nextBookedSeatNumbers = availability.seats.filter((seat) => seat.status === "booked").map((seat) => seat.seatNumber);
        setBookedSeatNumbers(nextBookedSeatNumbers);
        setSelectedSeat((currentSeat) => {
          if (nextBookedSeatNumbers.includes(currentSeat)) {
            return getFirstAvailableSeat(nextBookedSeatNumbers);
          }

          return currentSeat;
        });
      } catch (error) {
        if (!cancelled) {
          setAvailabilityError(error instanceof Error ? error.message : "Unable to load seat availability");
          setBookedSeatNumbers([]);
        }
      }
    }

    void loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [activeCoach, initialDate, initialFrom, initialTo]);

  useEffect(() => {
    setSelectedSeat(getFirstAvailableSeat(bookedSeatNumbers));
  }, [bookedSeatNumbers, activeCoach]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <Card className="rail-panel border-white/70">
          <CardHeader className="border-b border-white/60 bg-white/30">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-orange-700">
              <MapPinned className="size-4" />
              Journey summary
            </div>
            <CardTitle className="text-3xl text-slate-900">
              {initialFrom} to {initialTo}
            </CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-4 text-base text-slate-600">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="size-4 text-orange-600" />
                {formatJourneyDate(initialDate)}
              </span>
              <span className="inline-flex items-center gap-2">
                <TrainFront className="size-4 text-orange-600" />
                Select a coach and seat before continuing
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <CoachTabs
              coaches={coaches}
              activeCoach={activeCoach}
              onCoachChange={(coachId) => {
                setActiveCoach(coachId);
              }}
            />
            <div className="flex justify-start lg:justify-end">
              <Link
                href={bookHref}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f766e,#14b8a6_58%,#22c55e)] px-6 text-base font-medium text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-105"
              >
                Continue
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {availabilityError && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {availabilityError}. The UI is using the latest known seat state.
          </div>
        )}

        <SeatGrid
          coachId={activeCoach}
          selectedSeat={selectedSeat}
          bookedSeatNumbers={bookedSeatNumbers}
          onSeatChange={setSelectedSeat}
        />
      </main>
      <Footer />
    </div>
  );
}