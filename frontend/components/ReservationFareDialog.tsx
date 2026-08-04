"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { type JourneyClass } from "@/components/railway-data";
import { ReservationFareMatrix } from "./ReservationFareMatrix";
import { ReservationFareCards } from "./ReservationFareCards";

const CLASS_LABELS: Record<JourneyClass, string> = {
  FIRST_CLASS: "First Class",
  SECOND_CLASS: "Second Class",
};

export function ReservationFareDialog({
  trainNo,
  trainName,
}: {
  trainNo: string;
  trainName: string;
}) {
  const [selectedClass, setSelectedClass] = useState<JourneyClass>("FIRST_CLASS");

  return (
    <Dialog>
      <DialogTrigger className="rounded-2xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700">
        View Reservation Fares
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">
            Reservation fares for {trainName}
          </DialogTitle>
          <DialogDescription>
            Browse reservation fares for all stations.
          </DialogDescription>
        </DialogHeader>

        <div className="hidden sm:flex gap-2">
          {(["FIRST_CLASS", "SECOND_CLASS"] as JourneyClass[]).map((value) => (
            <button
              key={value}
              onClick={() => setSelectedClass(value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                selectedClass === value
                  ? "bg-orange-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {CLASS_LABELS[value]}
            </button>
          ))}
        </div>

        <div className="hidden sm:block">
          <ReservationFareMatrix
            trainNo={trainNo}
            travelClass={selectedClass}
          />
        </div>

        <div className="block sm:hidden">
          <ReservationFareCards trainNo={trainNo} />
        </div>
      </DialogContent>
    </Dialog>
  );
}