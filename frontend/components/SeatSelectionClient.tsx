"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, MapPinned, TrainFront, Ticket } from "lucide-react";

import { SeatGrid } from "@/components/SeatGrid";
import { CoachTabs } from "@/components/CoachTabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { getSeatAvailability, holdSeats } from "@/lib/api";
import {
  JourneyClass,
  buildFareMatrix,
  calculateJourneyFare,
  formatJourneyDate,
  getCoachSeats,
  getCoachesForClass,
  getJourneyPreview,
  getTrainByNumber,
  trainServices,
} from "@/components/railway-data";

import { cn } from "@/lib/utils";

const CLASS_LABELS: Record<JourneyClass, string> = {
  FIRST_CLASS: "First class",
  SECOND_CLASS: "Second class",
};

type SeatSelectionClientProps = {
  trainNo: string;
  initialFrom: string;
  initialTo: string;
  initialDate: string;
  initialCoachCode?: string;
  initialSelectedSeats?: string[];
  initialClass?: JourneyClass;
  initialHoldToken?: string;
};

function formatMoney(amount: number) {
  return `Rs. ${amount.toLocaleString("en-LK")}`;
}

function renderFareMatrixTable(
  label: string,
  travelClass: JourneyClass,
  selectedClass: JourneyClass,
  originStation: string,
  destinationStation: string,
  trainNo: string,
) {
  const train = getTrainByNumber(trainNo) ?? trainServices[0];
  if (!train) {
    return null;
  }

  const matrix = buildFareMatrix(train, travelClass);

  return (
    <div className={cn("rounded-3xl border p-4", selectedClass === travelClass ? "border-orange-300 bg-orange-50/70" : "border-slate-200 bg-white")}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">{label}</p>
          <h4 className="text-lg font-semibold text-slate-900">{CLASS_LABELS[travelClass]}</h4>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", selectedClass === travelClass ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-600")}>
          {selectedClass === travelClass ? "Selected" : "Compare"}
        </span>
      </div>

      <div className="max-h-[420px] overflow-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-[720px] border-collapse text-xs">
          <thead className="sticky top-0 bg-slate-50 text-slate-500">
            <tr>
              <th className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold">From / To</th>
              {train.routeStops.map((destinationStop) => (
                <th key={destinationStop.station} className="border-b border-slate-200 px-3 py-2 text-center font-semibold">
                  {destinationStop.station}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map(({ originStop, cells }, rowIndex) => (
              <tr key={originStop.station} className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                <th className="sticky left-0 z-10 border-r border-slate-200 bg-inherit px-3 py-2 text-left font-semibold text-slate-700">
                  {originStop.station}
                </th>
                {cells.map((cell, columnIndex) => {
                  const isSelectedPath = originStop.station === originStation && cell?.destinationStop.station === destinationStation;
                  if (!cell) {
                    return <td key={`${originStop.station}-${columnIndex}`} className="border-b border-slate-100 px-3 py-2 text-center text-slate-300">-</td>;
                  }

                  return (
                    <td
                      key={`${originStop.station}-${cell.destinationStop.station}`}
                      className={cn(
                        "border-b border-slate-100 px-3 py-2 text-center font-semibold",
                        isSelectedPath ? "bg-orange-500 text-white" : "text-slate-700",
                        selectedClass === travelClass && isSelectedPath ? "shadow-inner" : ""
                      )}
                    >
                      {formatMoney(cell.fare)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SeatSelectionClient({
  trainNo,
  initialFrom,
  initialTo,
  initialDate,
  initialCoachCode,
  initialSelectedSeats = [],
  initialClass = "SECOND_CLASS",
  initialHoldToken,
}: SeatSelectionClientProps) {
  const router = useRouter();
  const train = getTrainByNumber(trainNo) ?? getTrainByNumber(trainServices[0].trainNo) ?? trainServices[0];
  const journey = train ? getJourneyPreview(train, initialFrom, initialTo) : null;

  const [travelClass, setTravelClass] = useState<JourneyClass>(initialClass);
  const coaches = getCoachesForClass(travelClass);
  const [activeCoach, setActiveCoach] = useState(() => {
    if (initialCoachCode && coaches.some((coach) => coach.id === initialCoachCode)) {
      return initialCoachCode;
    }

    return coaches[0]?.id ?? "R2";
  });
  const [bookedSeatNumbers, setBookedSeatNumbers] = useState<string[]>([]);
  const [selectedSeatsByCoach, setSelectedSeatsByCoach] = useState<Record<string, string[]>>(() => {
    if (!initialCoachCode || initialSelectedSeats.length === 0) {
      return {};
    }

    return { [initialCoachCode]: initialSelectedSeats };
  });
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [fareDialogClass, setFareDialogClass] = useState<JourneyClass>(initialClass);
  const [holdToken] = useState(() => initialHoldToken || crypto.randomUUID());
  const [isContinuing, setIsContinuing] = useState(false);

  const activeSelectedSeats = selectedSeatsByCoach[activeCoach] ?? [];
  const farePerSeat = train && journey ? calculateJourneyFare(train, initialFrom, initialTo, travelClass) : 0;
  const totalFare = farePerSeat * activeSelectedSeats.length;
  const selectedSeatCount = activeSelectedSeats.length;
  const activeCoachAvailability = bookedSeatNumbers;

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      if (!train) {
        return;
      }

      try {
        setAvailabilityError(null);
        const availability = await getSeatAvailability({
          coachCode: activeCoach,
          originStation: initialFrom,
          destinationStation: initialTo,
          journeyDate: initialDate,
          holderKey: holdToken,
        });

        if (cancelled) {
          return;
        }

        const nextBookedSeatNumbers = availability.seats
          .filter((seat) => seat.status === "booked")
          .map((seat) => seat.seatNumber);

        setBookedSeatNumbers(nextBookedSeatNumbers);
        setSelectedSeatsByCoach((current) => {
          const currentSeats = current[activeCoach] ?? [];
          const bookedSet = new Set(nextBookedSeatNumbers);
          const nextSeats = currentSeats.filter((seat) => !bookedSet.has(seat));

          if (nextSeats.length === currentSeats.length) {
            return current;
          }

          return {
            ...current,
            [activeCoach]: nextSeats,
          };
        });
      } catch (error) {
        if (!cancelled) {
          setAvailabilityError(error instanceof Error ? error.message : "Unable to load seat availability");
          const fallbackBooked = Object.entries(getCoachSeats(activeCoach))
            .filter(([, status]) => status === "booked")
            .map(([seatNumber]) => seatNumber);
          setBookedSeatNumbers(fallbackBooked);
        }
      }
    }

    void loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [activeCoach, holdToken, initialDate, initialFrom, initialTo, train]);

  function toggleSeat(seatId: string) {
    if (bookedSeatNumbers.includes(seatId)) {
      return;
    }

    setSelectedSeatsByCoach((current) => {
      const currentSeats = current[activeCoach] ?? [];
      const isSelected = currentSeats.includes(seatId);

      if (isSelected) {
        return {
          ...current,
          [activeCoach]: currentSeats.filter((seatNumber) => seatNumber !== seatId),
        };
      }

      if (currentSeats.length >= 5) {
        return current;
      }

      return {
        ...current,
        [activeCoach]: [...currentSeats, seatId],
      };
    });
  }

  async function handleContinue() {
    if (!train || selectedSeatCount === 0) {
      return;
    }

    setIsContinuing(true);
    setAvailabilityError(null);

    try {
      const holdResponse = await holdSeats({
        holderKey: holdToken,
        coachCode: activeCoach,
        seatNumbers: activeSelectedSeats,
        originStation: initialFrom,
        destinationStation: initialTo,
        journeyDate: initialDate,
      });

      if (!holdResponse.success) {
        setAvailabilityError(holdResponse.message ?? "One or more seats are no longer available");
        return;
      }

      const seats = activeSelectedSeats.join(",");
      router.push(
        `/booking?train=${encodeURIComponent(train.trainNo)}&from=${encodeURIComponent(initialFrom)}&to=${encodeURIComponent(initialTo)}&date=${encodeURIComponent(initialDate)}&coach=${encodeURIComponent(activeCoach)}&seats=${encodeURIComponent(seats)}&class=${encodeURIComponent(travelClass)}&fare=${encodeURIComponent(String(totalFare))}&holdToken=${encodeURIComponent(holdToken)}`,
      );
    } catch (error) {
      setAvailabilityError(error instanceof Error ? error.message : "Unable to reserve seats right now");
    } finally {
      setIsContinuing(false);
    }
  }

  if (!train || !journey) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-12 sm:px-6 lg:px-8">
          <Card className="w-full rail-panel border-white/70">
            <CardContent className="p-8 text-center text-slate-600">
              Unable to match a train for this route. Please go back and choose a valid segment.
              <div className="mt-6">
                <Link href="/search" className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white">
                  Back to search
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const fareComparisonStops = journey;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <Card className="rail-panel border-white/70 overflow-hidden">
          <CardHeader className="border-b border-white/60 bg-white/30">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-orange-700">
              <TrainFront className="size-4" />
              Selected train
            </div>
            <CardTitle className="text-3xl text-slate-900">
              {train.trainName} - Train {train.trainNo}
            </CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-4 text-base text-slate-600">
              <span className="inline-flex items-center gap-2">
                <MapPinned className="size-4 text-orange-600" />
                {train.startingCity} to {train.endingCity}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="size-4 text-orange-600" />
                {formatJourneyDate(initialDate)}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Starting city</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{train.startingCity}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Ending city</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{train.endingCity}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Departure time</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{train.departureTime}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Arrival time</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{train.arrivalTime}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Route preview</p>
                <p className="mt-2">Expected arrival at {fareComparisonStops.destinationStop.station}: {fareComparisonStops.arrivalTime}</p>
                <p>Expected reach time from {initialFrom}: {fareComparisonStops.arrivalTime}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Travel time {train.travelTime}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{train.description}</span>
                <Dialog>
                  <DialogTrigger asChild>
                    <span className="inline-flex h-8 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                      View reservation fares
                    </span>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">Reservation fares for {train.trainName}</DialogTitle>
                      <DialogDescription>
                        Compare first and second class fares. The selected journey segment is highlighted in the fare matrix.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      {["FIRST_CLASS", "SECOND_CLASS"].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setFareDialogClass(value as JourneyClass)}
                          className={cn(
                            "rounded-full px-4 py-2 text-sm font-semibold transition",
                            fareDialogClass === value ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          )}
                        >
                          {CLASS_LABELS[value as JourneyClass]}
                        </button>
                      ))}
                    </div>
                    <div className="grid gap-4 xl:grid-cols-2">
                      {renderFareMatrixTable("Comparison table", "FIRST_CLASS", fareDialogClass, initialFrom, initialTo, train.trainNo)}
                      {renderFareMatrixTable("Comparison table", "SECOND_CLASS", fareDialogClass, initialFrom, initialTo, train.trainNo)}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-700">Travel class</p>
                  <h3 className="text-2xl font-semibold text-slate-900">Choose your class</h3>
                </div>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">Coaches update with class</span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {(["FIRST_CLASS", "SECOND_CLASS"] as JourneyClass[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setTravelClass(value);
                      setFareDialogClass(value);
                      const nextCoaches = getCoachesForClass(value);
                      setActiveCoach(nextCoaches[0]?.id ?? activeCoach);
                    }}
                    className={cn(
                      "rounded-2xl border px-4 py-4 text-left transition-all",
                      travelClass === value
                        ? "border-orange-300 bg-orange-50 shadow-md shadow-orange-200/40"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900">{CLASS_LABELS[value]}</span>
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", travelClass === value ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-600")}>
                        {travelClass === value ? "Selected" : "Switch"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {value === "FIRST_CLASS" ? "Coach 1 only" : "Coaches 2 and 3"}
                    </p>
                  </button>
                ))}
              </div>

              <CoachTabs
                coaches={coaches}
                activeCoach={activeCoach}
                onCoachChange={(coachId) => {
                  setActiveCoach(coachId);
                }}
              />

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                You can select up to 5 seats for this booking session.
              </div>
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
          selectedSeatNumbers={activeSelectedSeats}
          bookedSeatNumbers={activeCoachAvailability}
          onSeatToggle={toggleSeat}
        />

        <Card className="rail-panel border-white/70">
          <CardHeader className="border-b border-white/60 bg-white/30">
            <CardTitle className="text-2xl text-slate-900">Booked seats summary</CardTitle>
            <CardDescription>
              Review the seats selected for this train before continuing.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 lg:grid-cols-[1.2fr_auto] lg:items-center">
            <div className="grid gap-3 text-sm text-slate-700">
              <div className="flex flex-wrap items-center gap-2">
                <Ticket className="size-4 text-orange-600" />
                <span className="font-medium text-slate-900">Selected seats:</span>
                <span>{activeSelectedSeats.length ? activeSelectedSeats.join(", ") : "No seats selected yet"}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <MapPinned className="size-4 text-orange-600" />
                <span className="font-medium text-slate-900">Class:</span>
                <span>{CLASS_LABELS[travelClass]}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <TrainFront className="size-4 text-orange-600" />
                <span className="font-medium text-slate-900">Total fare:</span>
                <span>{formatMoney(totalFare)}</span>
              </div>
            </div>
            <div className="flex justify-start lg:justify-end">
              <Button
                type="button"
                onClick={handleContinue}
                disabled={selectedSeatCount === 0 || isContinuing}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f766e,#14b8a6_58%,#22c55e)] px-6 text-base font-medium text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isContinuing ? "Reserving..." : "Continue"}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
