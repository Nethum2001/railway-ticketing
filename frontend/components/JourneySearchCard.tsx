"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Card } from "@/components/ui/card";

import { DatePicker } from "@/components/DatePicker";
import { StationSelect } from "@/components/StationSelect";
import { formatJourneyDate } from "@/components/railway-data";

const today = new Date();
const defaultDate = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export function JourneySearchCard() {
  const [from, setFrom] = useState("Colombo Fort");
  const [to, setTo] = useState("Badulla");
  const [date, setDate] = useState(defaultDate);
  const searchHref = useMemo(
    () => `/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`,
    [date, from, to]
  );

  return (
    <Card className="overflow-hidden border border-slate-200 bg-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.48)]">

      <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-5 lg:py-5">
        <StationSelect tone="light" label="From" value={from} onValueChange={setFrom} placeholder="Select station" />
        <StationSelect tone="light" label="To" value={to} onValueChange={setTo} placeholder="Select station" />
        <DatePicker tone="light" label="Departure" value={date} onValueChange={setDate} />

        <div className="flex flex-col justify-end">
            <span className="mb-2 text-xs font-semibold uppercase tracking-wider opacity-0 select-none">
            Search
            </span>
            <Link
            href={searchHref}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#4f8df7] px-6 text-sm font-semibold text-white shadow-[0_16px_40px_-24px_rgba(79,141,247,0.95)] transition hover:bg-[#3f7ee9]"
            >
            <Search className="size-4" />
            Find trains
            </Link>
        </div>
      </div>
    </Card>
  );
}