"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { DatePicker } from "@/components/DatePicker";
import { StationSelect } from "@/components/StationSelect";
import { formatJourneyDate } from "@/components/railway-data";

const today = new Date();
const defaultDate = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export function JourneySearchCard() {
  const [from, setFrom] = useState("Colombo Fort");
  const [to, setTo] = useState("Badulla");
  const [date, setDate] = useState(defaultDate);
  const [passengerClass, setPassengerClass] = useState("Second Class");

  const searchHref = useMemo(
    () =>
      `/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}&class=${encodeURIComponent(passengerClass)}`,
    [date, from, passengerClass, to]
  );

  return (
    <Card className="overflow-hidden border border-slate-200 bg-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.48)]">
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-[#4f8df7]/20 bg-[#eef5ff] px-4 py-2 text-sm font-medium text-[#4f8df7]">Commuter</span>
          <p className="text-sm text-slate-500">Plan a journey in a cleaner, faster booking flow.</p>
        </div>
      </div>

      <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 xl:grid-cols-[1.15fr_1.15fr_0.95fr_1fr_auto] xl:items-end xl:px-5 xl:py-5">
        <StationSelect tone="light" label="From" value={from} onValueChange={setFrom} placeholder="Select station" />
        <StationSelect tone="light" label="To" value={to} onValueChange={setTo} placeholder="Select station" />
        <DatePicker tone="light" label="Departure" value={date} onValueChange={setDate} />
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Passengers &amp; Class</span>
          <Select
            value={passengerClass}
            onValueChange={(nextValue) => {
              if (nextValue) {
                setPassengerClass(nextValue);
              }
            }}
          >
            <SelectTrigger className="h-12 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 text-sm text-slate-900 shadow-sm shadow-slate-900/5">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Second Class">Second Class</SelectItem>
              <SelectItem value="Third Class">Third Class</SelectItem>
              <SelectItem value="First Class">First Class</SelectItem>
            </SelectContent>
          </Select>
        </label>

        <div className="flex h-full flex-col justify-end gap-3 xl:pl-2">
          <Link
            href={searchHref}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#4f8df7] px-6 text-sm font-semibold text-white shadow-[0_16px_40px_-24px_rgba(79,141,247,0.95)] transition hover:bg-[#3f7ee9]"
          >
            <Search className="size-4" />
            Search
          </Link>
          <div className="text-xs text-slate-500">
            {from} to {to} on {formatJourneyDate(date)} · {passengerClass}
          </div>
        </div>
      </div>
    </Card>
  );
}