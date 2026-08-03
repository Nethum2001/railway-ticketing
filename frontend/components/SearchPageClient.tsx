"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPinned, TrainFront } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Footer } from "@/components/Footer";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Navbar } from "@/components/Navbar";
import { formatJourneyDate, getJourneyPreview, getTrainsForJourney, type TrainService } from "@/components/railway-data";
import { getTrains as getTrainsFromApi } from "@/lib/api";

type SearchPageClientProps = {
  initialFrom: string;
  initialTo: string;
  initialDate: string;
};

export function SearchPageClient({ initialFrom, initialTo, initialDate }: SearchPageClientProps) {
  const [trains, setTrains] = useState<TrainService[]>(() => getTrainsForJourney(initialFrom, initialTo));
  const [isLoading, setIsLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadTrains = async () => {
      setIsLoading(true);

      try {
        const liveTrains = await getTrainsFromApi({ from: initialFrom, to: initialTo });

        if (!isActive) {
          return;
        }

        setTrains(liveTrains);
        setUsingFallback(false);
      } catch {
        if (!isActive) {
          return;
        }

        setTrains(getTrainsForJourney(initialFrom, initialTo));
        setUsingFallback(true);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadTrains();

    return () => {
      isActive = false;
    };
  }, [initialFrom, initialTo]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <Card className="rail-panel border-white/70">
          <CardHeader className="border-b border-white/60 bg-white/30">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-orange-700">
              <MapPinned className="size-4" />
              Select a train
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
                Filtered trains for the selected segment
              </span>
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 p-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              Segment-based booking is available here. Choose the train that matches your route, then reserve seats and intermediate stations in the next step.
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              {usingFallback ? "Using local fallback data because the live backend is unavailable." : "Using live backend train data."}
            </div>

            {isLoading && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <LoadingSpinner />
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              {trains.map((train) => {
                const preview = getJourneyPreview(train, initialFrom, initialTo);

                if (!preview) {
                  return null;
                }

                return (
                  <article key={train.trainNo} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)]">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-12 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#4f8df7]">
                          <TrainFront className="size-6" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Train No. {train.trainNo}</p>
                          <h3 className="text-lg font-semibold text-slate-900">{train.trainName}</h3>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Segment ready</span>
                    </div>

                    <div className="grid gap-4 px-5 py-5 text-sm text-slate-600 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Starting city</p>
                        <p className="mt-1 text-base font-semibold text-slate-900">{train.startingCity}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Ending city</p>
                        <p className="mt-1 text-base font-semibold text-slate-900">{train.endingCity}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Departure time</p>
                        <p className="mt-1 text-base font-semibold text-slate-900">{train.departureTime}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Arrival time</p>
                        <p className="mt-1 text-base font-semibold text-slate-900">{train.arrivalTime}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Travel time</p>
                        <p className="mt-1 text-base font-semibold text-slate-900">{train.travelTime}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Selected segment</p>
                        <p className="mt-1 text-base font-semibold text-slate-900">
                          {preview.originStop.station} → {preview.destinationStop.station}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 px-5 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-slate-500">Book now and choose class + seats in the next step.</p>
                        <Link
                          href={`/seat-selection?train=${encodeURIComponent(train.trainNo)}&from=${encodeURIComponent(initialFrom)}&to=${encodeURIComponent(initialTo)}&date=${encodeURIComponent(initialDate)}`}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f766e,#14b8a6_58%,#22c55e)] px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:brightness-105"
                        >
                          Book a seat
                          <ArrowRight className="size-4" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {trains.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-500">
                No trains matched this segment. Try a different origin or destination.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
