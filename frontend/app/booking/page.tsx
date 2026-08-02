import Link from "next/link";
import { Ticket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { BookingSummary } from "@/components/BookingSummary";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { PassengerForm } from "@/components/PassengerForm";

type BookingSearchParams = {
  from?: string | string[];
  to?: string | string[];
  date?: string | string[];
  coach?: string | string[];
  seat?: string | string[];
  class?: string | string[];
};

function pickFirst(value: string | string[] | undefined, fallback: string) {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

function BookingPageView({ searchParams }: { searchParams: BookingSearchParams }) {
  const from = pickFirst(searchParams.from, "Colombo Fort");
  const to = pickFirst(searchParams.to, "Kandy");
  const date = pickFirst(searchParams.date, new Date().toISOString().slice(0, 10));
  const coach = pickFirst(searchParams.coach, "R1");
  const seat = pickFirst(searchParams.seat, "A1");
  const travelClass = pickFirst(searchParams.class, "SECOND_CLASS");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-700">Booking page</p>
            <h1 className="text-3xl font-semibold text-slate-950">Confirm passenger details</h1>
          </div>
          <Link
            href="/search"
            className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Ticket className="size-4" />
            Back to seats
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <PassengerForm seat={seat} coach={coach} from={from} to={to} date={date} travelClass={travelClass} />
          <BookingSummary seat={seat} coach={coach} from={from} to={to} date={date} travelClass={travelClass} />
        </div>

        <Card className="rail-panel border-white/70">
          <CardHeader className="border-b border-white/60 bg-white/30">
            <CardTitle className="text-xl text-slate-900">What happens next</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 p-6 text-sm text-slate-600 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">1. Review passenger details and seat assignment.</div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">2. Confirm the booking to generate a ticket ID.</div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">3. Download the confirmation from the success screen.</div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

export default function BookingPage({ searchParams }: { searchParams: BookingSearchParams }) {
  return <BookingPageView searchParams={searchParams} />;
}