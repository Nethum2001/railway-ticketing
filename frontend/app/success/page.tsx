import Link from "next/link";
import { CheckCircle2, Download, MapPin, MoveDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { buildBookingId, formatJourneyDate } from "@/components/railway-data";

type SuccessSearchParams = {
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

function pickFirst(value: string | string[] | undefined, fallback: string) {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

function SuccessPageView({ searchParams }: { searchParams: SuccessSearchParams }) {
  const bookingCode = pickFirst(searchParams.bookingCode, buildBookingId("fallback"));
  const bookingCodes = pickFirst(searchParams.bookingCodes, bookingCode).split(",").filter(Boolean);
  const seats = pickFirst(searchParams.seats, pickFirst(searchParams.seat, "A1")).split(",").filter(Boolean);
  const coach = pickFirst(searchParams.coach, "R1");
  const from = pickFirst(searchParams.from, "Colombo Fort");
  const to = pickFirst(searchParams.to, "Kandy");
  const date = pickFirst(searchParams.date, new Date().toISOString().slice(0, 10));
  const passenger = pickFirst(searchParams.name, "Passenger");
  const travelClass = pickFirst(searchParams.travelClass, "SECOND_CLASS");
  const fare = pickFirst(searchParams.fare, "Rs. 750");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <Card className="rail-panel border-white/70 overflow-hidden">
          <CardHeader className="border-b border-white/60 bg-white/30 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="size-9" />
            </div>
            <CardTitle className="text-3xl text-slate-950">Booking Successful</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-stretch">
            <div className="sm:h-full grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Booking ID</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{bookingCode}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Passenger</p>
                  <p className="text-lg font-semibold text-slate-900">{passenger}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Seat</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {coach}-{seats.join(", ")}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                  <p className="text-sm text-slate-500">Booking codes</p>
                  <p className="text-lg font-semibold text-slate-900">{bookingCodes.join(", ")}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Class</p>
                  <p className="text-lg font-semibold text-slate-900">{travelClass.replace(/_/g, " ")}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <MapPin className="size-4 text-orange-600" />
                  Journey
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-center">
                  <span className="flex-1 text-lg font-semibold text-slate-900">{from}</span>
                  <MoveDown className="size-5 text-orange-500" />
                  <span className="flex-1 text-lg font-semibold text-slate-900">{to}</span>
                </div>
                <p className="mt-4 text-sm text-slate-500">Travel date: {formatJourneyDate(date)}</p>
              </div>
            </div>

            <div className="flex min-w-[240px] flex-col justify-between gap-4 rounded-3xl bg-slate-950 p-6 text-white">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-300">Ticket summary</p>
                <h2 className="mt-2 text-2xl font-semibold">Download your ticket</h2>
                <p className="mt-3 text-sm text-slate-300">Keep this confirmation for boarding and future reference.</p>
                <p className="mt-4 text-sm text-slate-300">Fare paid: {fare}</p>
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

export default function SuccessPage({ searchParams }: { searchParams: SuccessSearchParams }) {
  return <SuccessPageView searchParams={searchParams} />;
}