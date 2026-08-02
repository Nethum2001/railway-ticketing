"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { createBooking, getStoredToken } from "@/lib/api";

type PassengerFormProps = {
  seat: string;
  coach: string;
  from: string;
  to: string;
  date: string;
  travelClass: string;
};

export function PassengerForm({ seat, coach, from, to, date, travelClass }: PassengerFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nic, setNic] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirmBooking() {
    const token = getStoredToken();

    if (!token) {
      const currentBookingUrl = `/booking?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}&class=${encodeURIComponent(travelClass)}&coach=${encodeURIComponent(coach)}&seat=${encodeURIComponent(seat)}`;
      router.push(`/auth?mode=login&redirectTo=${encodeURIComponent(currentBookingUrl)}`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const booking = await createBooking(
        {
          coachCode: coach,
          seatNumber: seat,
          originStation: from,
          destinationStation: to,
          journeyDate: date,
          passengerName: name || "Passenger",
          passengerNic: nic,
          passengerPhone: phone,
          travelClass: travelClass.replace(/\s+/g, "_").toUpperCase() as "FIRST_CLASS" | "SECOND_CLASS" | "THIRD_CLASS",
        },
        token,
        crypto.randomUUID(),
      );

      const query = new URLSearchParams({
        bookingCode: booking.bookingCode,
        seat: booking.seatNumber,
        coach: booking.coachCode,
        from: booking.originStation,
        to: booking.destinationStation,
        date: booking.journeyDate,
        name: booking.passengerName,
        travelClass: booking.travelClass,
        fare: String(booking.fare),
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
          NIC
          <Input
            value={nic}
            onChange={(event) => setNic(event.target.value)}
            placeholder="National identity card number"
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
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Seat {coach}-{seat} will be reserved for {name || "the passenger"} in {travelClass.replace(/_/g, " ").toLowerCase()}.
        </div>
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