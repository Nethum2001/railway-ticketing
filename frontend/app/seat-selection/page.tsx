import { SeatSelectionClient } from "@/components/SeatSelectionClient";
import type { JourneyClass } from "@/components/railway-data";

type SeatSelectionSearchParams = {
  train?: string | string[];
  from?: string | string[];
  to?: string | string[];
  date?: string | string[];
  coach?: string | string[];
  seats?: string | string[];
  class?: string | string[];
  holdToken?: string | string[];
};

function pickFirst(value: string | string[] | undefined, fallback: string) {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

export default async function SeatSelectionPage({
  searchParams,
}: {
  searchParams: Promise<SeatSelectionSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;

  const trainNo = pickFirst(resolvedSearchParams.train, "1001");
  const from = pickFirst(resolvedSearchParams.from, "Colombo Fort");
  const to = pickFirst(resolvedSearchParams.to, "Kandy");
  const date = pickFirst(resolvedSearchParams.date, new Date().toISOString().slice(0, 10));
  const coach = pickFirst(resolvedSearchParams.coach, "");
  const seats = pickFirst(resolvedSearchParams.seats, "")
    .split(",")
    .map((seat) => seat.trim())
    .filter(Boolean);
  const journeyClass = pickFirst(resolvedSearchParams.class, "SECOND_CLASS");
  const initialClass: JourneyClass = journeyClass === "FIRST_CLASS" ? "FIRST_CLASS" : "SECOND_CLASS";
  const holdToken = pickFirst(resolvedSearchParams.holdToken, "");

  return (
    <SeatSelectionClient
      trainNo={trainNo}
      initialFrom={from}
      initialTo={to}
      initialDate={date}
      initialCoachCode={coach || undefined}
      initialSelectedSeats={seats}
      initialClass={initialClass}
      initialHoldToken={holdToken || undefined}
    />
  );
}
