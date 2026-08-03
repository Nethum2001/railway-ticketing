import Link from "next/link";
import { Ticket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { BookingSummary } from "@/components/BookingSummary";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { PassengerForm } from "@/components/PassengerForm";
import { formatJourneyDate, getTrainByNumber } from "@/components/railway-data";

type BookingSearchParams = {
  from?: string | string[];
  to?: string | string[];
  date?: string | string[];
  coach?: string | string[];
  seats?: string | string[];
  class?: string | string[];
  train?: string | string[];
  fare?: string | string[];
  holdToken?: string | string[];
};

function pickFirst(value: string | string[] | undefined, fallback: string) {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

function formatMoney(value: number) {
  return `Rs. ${value.toLocaleString("en-LK")}`;
}

function formatTravelClass(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function BookingPageView({ searchParams }: { searchParams: BookingSearchParams }) {
  const from = pickFirst(searchParams.from, "Colombo Fort");
  const to = pickFirst(searchParams.to, "Kandy");
  const date = pickFirst(searchParams.date, new Date().toISOString().slice(0, 10));
  const coach = pickFirst(searchParams.coach, "R1");
  const seats = pickFirst(searchParams.seats, "1")
    .split(",")
    .map((seat) => seat.trim())
    .filter(Boolean);
  const travelClass = pickFirst(searchParams.class, "SECOND_CLASS");
  const trainNo = pickFirst(searchParams.train, "1001");
  const holdToken = pickFirst(searchParams.holdToken, "");
  const train = getTrainByNumber(trainNo);
  const fareValue = Number(pickFirst(searchParams.fare, "0"));
  const totalFare = Number.isFinite(fareValue) ? formatMoney(Math.max(0, fareValue)) : "Rs. 0";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <Card className="rail-panel border-white/70">
          <CardHeader className="border-b border-white/60 bg-white/30">
            <CardTitle className="text-xl text-slate-900">Booking Progress</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 p-5 sm:grid-cols-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="text-xs font-semibold uppercase tracking-[0.22em]">Step 1</p>
              <p className="mt-1 font-semibold">Seat Selection Completed</p>
              <p className="mt-1 text-emerald-700">Train, class, coach, and seats were selected.</p>
            </div>
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
              <p className="text-xs font-semibold uppercase tracking-[0.22em]">Step 2</p>
              <p className="mt-1 font-semibold">Passenger Details and Review</p>
              <p className="mt-1 text-orange-800">Verify summary details and confirm booking for selected seats.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <p className="text-xs font-semibold uppercase tracking-[0.22em]">Step 3</p>
              <p className="mt-1 font-semibold">Confirmation</p>
              <p className="mt-1 text-slate-600">Success page with generated booking codes remains unchanged.</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-700">Booking page</p>
            <h1 className="text-3xl font-semibold text-slate-950">Confirm passenger details</h1>
            <p className="mt-2 text-sm text-slate-600">
              {train ? `${train.trainName} (${train.trainNo})` : `Train ${trainNo}`} | {from} to {to} | {formatJourneyDate(date)} | {formatTravelClass(travelClass)}
            </p>
          </div>
          <Link
            href={`/seat-selection?train=${encodeURIComponent(trainNo)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}&coach=${encodeURIComponent(coach)}&class=${encodeURIComponent(travelClass)}&seats=${encodeURIComponent(seats.join(","))}&holdToken=${encodeURIComponent(holdToken)}`}
            className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Ticket className="size-4" />
            Back to seats
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <PassengerForm seats={seats} coach={coach} from={from} to={to} date={date} travelClass={travelClass} trainNo={trainNo} totalFare={totalFare} holdToken={holdToken || undefined} />
          <BookingSummary trainNo={trainNo} trainName={train?.trainName} seats={seats} coach={coach} from={from} to={to} date={date} travelClass={travelClass} totalFare={totalFare} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<BookingSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  return <BookingPageView searchParams={resolvedSearchParams} />;
}