"use client";

import { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";

import {
  buildFareMatrix,
  getTrainByNumber,
  trainServices,
} from "@/components/railway-data";

type ReservationFareCardsProps = {
  trainNo: string;
};

export function ReservationFareCards({ trainNo }: ReservationFareCardsProps) {
  const [expandedStation, setExpandedStation] = useState<string | null>(null);

  const train = getTrainByNumber(trainNo) ?? trainServices[0];

  if (!train) {
    return null;
  }

  const firstClassMatrix = buildFareMatrix(train, "FIRST_CLASS");
  const secondClassMatrix = buildFareMatrix(train, "SECOND_CLASS");

  const toggleStation = (stationName: string) => {
    setExpandedStation((prev) => (prev === stationName ? null : stationName));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white py-3 px-2">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-800">
          All Station Fares
        </h4>
        <span className="text-[11px] font-medium text-slate-600">
          1st vs 2nd Class
        </span>
      </div>

      <div className="flex flex-col gap-2.5 overflow-y-auto pr-1">
        {firstClassMatrix.map((firstRow, rowIndex) => {
          const secondRow = secondClassMatrix[rowIndex];
          const originStation = firstRow.originStop.station;

          const mergedRoutes = firstRow.cells
            .map((firstCell, colIndex) => {
              const secondCell = secondRow?.cells[colIndex];
              const destination =
                firstCell?.destinationStop.station ??
                secondCell?.destinationStop.station;

              return {
                destination,
                firstClassFare: firstCell?.fare ?? null,
                secondClassFare: secondCell?.fare ?? null,
              };
            })
            .filter(
              (route) =>
                route.destination &&
                (route.firstClassFare !== null || route.secondClassFare !== null)
            );

          if (mergedRoutes.length === 0) return null;

          const isExpanded = expandedStation === originStation;

          return (
            <div
              key={originStation}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white transition-all shadow-xs"
            >
            <button
                type="button"
                onClick={() => toggleStation(originStation)}
                className="flex w-full items-center justify-between p-2 text-left transition-colors hover:bg-slate-50"
            >
            <div className="flex items-center gap-2 min-w-0 pr-2 h-full w-full">
                <MapPin className="h-4 w-4 shrink-0 text-orange-600" />
                <span className="font-semibold text-slate-800 text-sm truncate">{originStation}</span>
                <span className="text-xs font-normal text-slate-700 shrink-0 whitespace-nowrap">({mergedRoutes.length} dest.)</span>
            </div>

            <ChevronDown
                className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
                }`}
            />
            </button>

              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/60 p-2">
                  <div className="grid grid-cols-1 gap-2">
                    {mergedRoutes.map((route) => (
                      <div
                        key={`${originStation}-${route.destination}`}
                        className="flex items-center justify-between gap-2 rounded-md border border-slate-200/80 bg-white p-1 text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800 min-w-0">
                          <span className="text-blue-900 font-semibold text-[11px] truncate">{route.destination}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="flex flex-col items-end rounded-lg bg-orange-50/80 px-1 py-1 border border-orange-100 text-right">
                            <span className="text-[9px] uppercase font-bold text-orange-600 leading-none">
                              1st
                            </span>
                            <span className="font-semibold text-slate-800 text-xs mt-0.5">
                              {route.firstClassFare ? `Rs. ${route.firstClassFare}` : "N/A"}
                            </span>
                          </div>

                          <div className="flex flex-col items-end rounded-lg bg-slate-100/80 px-1 py-1 border border-slate-200/60 text-right">
                            <span className="text-[9px] uppercase font-bold text-slate-500 leading-none">
                              2nd
                            </span>
                            <span className="font-semibold text-slate-800 text-xs mt-0.5">
                              {route.secondClassFare ? `Rs. ${route.secondClassFare}` : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}