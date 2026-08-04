"use client";

import { cn } from "@/lib/utils";

import {
  buildFareMatrix,
  getTrainByNumber,
  type JourneyClass,
  trainServices,
} from "@/components/railway-data";


const CLASS_LABELS: Record<JourneyClass, string> = {
  FIRST_CLASS: "First Class",
  SECOND_CLASS: "Second Class",
};


type ReservationFareMatrixProps = {
  travelClass: JourneyClass;
  trainNo: string;
};


export function ReservationFareMatrix({
  travelClass,
  trainNo,
}: ReservationFareMatrixProps) {

  const train =
    getTrainByNumber(trainNo) ?? trainServices[0];


  if (!train) {
    return null;
  }


  const matrix = buildFareMatrix(
    train,
    travelClass
  );


  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
      <h4 className="mb-4 text-lg font-semibold text-slate-900">{CLASS_LABELS[travelClass]}</h4>
      <div className="max-h-[420px] overflow-auto rounded-2xl border border-slate-200">
        <table className="min-w-[720px] border-collapse text-xs">
          <thead className="sticky top-0 bg-slate-50 text-slate-500">
            <tr>
              <th className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold">
                From / To
              </th>
              {train.routeStops.map(
                (destinationStop) => (
                  <th
                    key={destinationStop.station}
                    className="border-b border-slate-200 px-3 py-2 text-center font-semibold">
                    {destinationStop.station}
                  </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map(
              ({ originStop, cells }, rowIndex) => (
              <tr
                key={originStop.station}
                className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
              >
                <th className="sticky left-0 z-10 border-r border-slate-200 bg-inherit px-3 py-2 text-left font-semibold text-slate-700">
                  {originStop.station}
                </th>
                {cells.map(
                  (cell, columnIndex) => {
                    if (!cell) {
                      return (
                        <td
                          key={`${originStop.station}-${columnIndex}`}
                          className="border-b border-slate-100 px-3 py-2 text-center text-slate-300"
                        >
                          -
                        </td>
                      );
                    }

                    return (
                      <td
                        key={`${originStop.station}-${cell.destinationStop.station}`}
                        className={cn("border-b border-slate-100 px-3 py-2 text-center font-semibold text-slate-700")}
                      >
                        {cell.fare}
                      </td>
                    );
                  }
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}