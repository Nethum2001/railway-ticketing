"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { createBooking, getStoredAuthSession, getStoredToken } from "@/lib/api";

type PassengerFormProps = {
  seats: string[];
  coach: string;
  from: string;
  to: string;
  date: string;
  travelClass: string;
  trainNo?: string;
  totalFare?: string;
  holdToken?: string;
};

export function PassengerForm({ seats, coach, from, to, date, travelClass, trainNo, totalFare, holdToken }: PassengerFormProps) {
  const router = useRouter();
  const [name, setName] = useState(() => getStoredAuthSession()?.user.fullName ?? "");
  const [nic, setNic] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirmBooking() {
    const token = getStoredToken();

    if (seats.length > 5) {
      setError("You can book a maximum of 5 seats in one session.");
      return;
    }

    if (!name.trim() || !nic.trim() || !phone.trim()) {
      setError("Please provide passenger name, NIC/passport, and phone number.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const bookingResults = [] as Array<Awaited<ReturnType<typeof createBooking>>>;

      for (const seatNumber of seats) {
        const booking = await createBooking(
          {
            coachCode: coach,
            seatNumber,
            originStation: from,
            destinationStation: to,
            journeyDate: date,
            passengerName: name || "Passenger",
            passengerNic: nic,
            passengerPhone: phone,
            travelClass: travelClass.replace(/\s+/g, "_").toUpperCase() as "FIRST_CLASS" | "SECOND_CLASS" | "THIRD_CLASS",
            holdToken,
          },
          token ?? undefined,
          `${nic.trim().toLowerCase()}-${coach}-${seatNumber}-${date}`,
        );

        bookingResults.push(booking);
      }

      const firstBooking = bookingResults[0];
      const query = new URLSearchParams({
        bookingCode: firstBooking.bookingCode,
        bookingCodes: bookingResults.map((booking) => booking.bookingCode).join(","),
        seats: bookingResults.map((booking) => booking.seatNumber).join(","),
        coach: firstBooking.coachCode,
        from: firstBooking.originStation,
        to: firstBooking.destinationStation,
        date: firstBooking.journeyDate,
        name: firstBooking.passengerName,
        travelClass: firstBooking.travelClass,
        fare: String(bookingResults.reduce((accumulator, booking) => accumulator + booking.fare, 0)),
      });

      router.push(`/success?${query.toString()}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit booking");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="rail-panel border-white/70">
      <CardHeader className="border-b border-white/60 bg-white/30">
        <CardTitle className="text-2xl text-slate-900">Passenger details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 p-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          {trainNo ? `Train ${trainNo} | ` : ""}
          {from} to {to} | {coach}-{seats.join(", ")} | {travelClass.replace(/_/g, " ")}
          {totalFare ? ` | Estimated total ${totalFare}` : ""}
        </div>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Name
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter passenger name"
            className="h-12 rounded-2xl bg-white/90"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          NIC / Passport
          <Input
            value={nic}
            onChange={(event) => setNic(event.target.value)}
            placeholder="National identity card or passport number"
            className="h-12 rounded-2xl bg-white/90"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Phone
          <Input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="07X XXX XXXX"
            className="h-12 rounded-2xl bg-white/90"
          />
        </label>
        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <Button
          type="button"
          onClick={handleConfirmBooking}
          disabled={isSubmitting}
          className="h-12 rounded-2xl bg-[linear-gradient(135deg,#0f766e,#14b8a6_58%,#22c55e)] text-base shadow-lg shadow-emerald-500/25 hover:brightness-105"
        >
          {isSubmitting ? "Confirming..." : "Confirm Booking"}
        </Button>
      </CardContent>
    </Card>
  );
}