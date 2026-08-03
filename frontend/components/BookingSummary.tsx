import { CalendarDays, MapPinned, Ticket } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { formatJourneyDate } from "@/components/railway-data";

type BookingSummaryProps = {
  trainNo: string;
  trainName?: string;
  from: string;
  to: string;
  date: string;
  seats: string[];
  coach: string;
  travelClass: string;
  totalFare?: string;
};

function formatTravelClass(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

export function BookingSummary({ trainNo, trainName, from, to, date, seats, coach, travelClass, totalFare = "Rs. 0" }: BookingSummaryProps) {
  const seatSummary = seats.length > 0 ? seats.map((seat) => `${coach}-${seat}`).join(", ") : "No seats selected";

  return (
    <Card className="rail-panel border-white/70">
      <CardHeader className="border-b border-white/60 bg-white/30">
        <CardTitle className="text-xl text-slate-900">Booking summary</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 p-6 text-sm text-slate-700">
        <div className="flex items-start gap-3">
          <Ticket className="mt-0.5 size-4 text-orange-600" />
          <div>
            <p className="font-medium text-slate-900">Train</p>
            <p>
              {trainName ? `${trainName} (${trainNo})` : `Train ${trainNo}`}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MapPinned className="mt-0.5 size-4 text-orange-600" />
          <div>
            <p className="font-medium text-slate-900">Journey</p>
            <p>
              {from} to {to}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 size-4 text-orange-600" />
          <div>
            <p className="font-medium text-slate-900">Date</p>
            <p>{formatJourneyDate(date)}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Ticket className="mt-0.5 size-4 text-orange-600" />
          <div>
            <p className="font-medium text-slate-900">Seats</p>
            <p>{seatSummary}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Ticket className="mt-0.5 size-4 text-orange-600" />
          <div>
            <p className="font-medium text-slate-900">Class</p>
            <p>{formatTravelClass(travelClass)}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-950 px-4 py-3 text-white">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-300">Fare</p>
          <p className="text-2xl font-semibold">{totalFare}</p>
        </div>
      </CardContent>
    </Card>
  );
}