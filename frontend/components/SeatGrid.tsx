"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { SeatCard } from "@/components/SeatCard";
import { seatColumns, seatRows } from "@/components/railway-data";

type SeatGridProps = {
  coachId: string;
  selectedSeat?: string;
  onSeatChange: (seatId: string) => void;
  bookedSeatNumbers?: string[];
  hasBagRack?: boolean;
  hasToilet?: boolean;
};

const SEAT_SIZE = "clamp(2.75rem, 8vw, 4.5rem)";
const DESKTOP_SEAT_SIZE = "clamp(3rem, 3.2vw, 4rem)";

export function SeatGrid({
  coachId,
  selectedSeat,
  onSeatChange,
  bookedSeatNumbers = [],
  hasBagRack = true,
  hasToilet = true,
}: SeatGridProps) {
  const bookedSeatSet = useMemo(() => new Set(bookedSeatNumbers), [bookedSeatNumbers]);
  const availableSeats = useMemo(
    () => Array.from({ length: 52 }, (_, index) => String(index + 1)).filter((seatNumber) => !bookedSeatSet.has(seatNumber)),
    [bookedSeatSet]
  );
  const activeSeat = selectedSeat && !bookedSeatSet.has(selectedSeat) ? selectedSeat : availableSeats[0] ?? "1";

  const colCount = seatColumns.length;
  const rowCount = seatRows.length;

  const aisleSplit = Math.floor(colCount / 2);
  const aisleLine = aisleSplit + 1;
  const totalTracks = colCount + 1;

  const seatCells = useMemo(
    () =>
      seatRows.flatMap((_, rowIndex) =>
        seatColumns.map((_, colIndex) => {
          const seatId = String((rowIndex * colCount) + colIndex + 1);
          const state = bookedSeatSet.has(seatId) ? "booked" : "available";
          const visualState = seatId === activeSeat ? "selected" : state;
          const seatType: "window" | "aisle" = colIndex === 0 || colIndex === colCount - 1 ? "window" : "aisle";
          const trackIndex = colIndex < aisleSplit ? colIndex + 1 : colIndex + 2;

          return { seatId, rowIndex, colIndex, trackIndex, state, visualState, seatType };
        })
      ),
    [bookedSeatSet, activeSeat, colCount, aisleSplit]
  );

  const renderSeats = (axis: "vertical" | "horizontal") =>
    seatCells.map(({ seatId, rowIndex, trackIndex, state, visualState, seatType }) => (
      <div
        key={seatId}
        style={
          axis === "vertical"
            ? { gridColumn: trackIndex, gridRow: rowIndex + 1 }
            : { gridColumn: rowIndex + 1, gridRow: trackIndex }
        }
      >
        <SeatCard
          seatId={seatId}
          state={visualState as "available" | "booked" | "selected"}
          seatType={seatType}
          onClick={() => {
            if (state === "booked") return;
            onSeatChange(seatId);
          }}
        />
      </div>
    ));

  const amenityRow = (hasBagRack || hasToilet) && (
    <div className="mb-2 grid grid-cols-2 px-1 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-300">
      <span>{hasBagRack ? "Bag Rack" : ""}</span>
      <span className="text-right">{hasToilet ? "Toilet" : ""}</span>
    </div>
  );

  const smallDoorBadge = (rotate?: boolean) => (
    <div className="flex h-full items-center justify-center rounded-lg bg-white px-1 py-3 shadow">
      <span
        className={cn(
          "text-[10px] font-bold uppercase sm:tracking-[0.25em] text-slate-950 [writing-mode:vertical-rl]",
          rotate && "rotate-180"
        )}
      >
        DOOR
      </span>
    </div>
  );

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4 text-white shadow-2xl shadow-slate-900/40 sm:p-6 max-w-full overflow-hidden">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-orange-300/80">Coach {coachId}</p>
          <h3 className="text-xl font-semibold">Seat layout</h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-300">
          <span className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-blue-500" /> Available
          </span>
          <span className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-slate-600" /> Booked
          </span>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-center gap-4 md:gap-8 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
        <span className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-700 text-[11px]">W</span>
          Window seat
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-700 text-[11px]">A</span>
          Aisle seat
        </span>
      </div>

      <div className="lg:hidden">
        <div className="relative rounded-lg border border-slate-800 bg-black/40 p-4 md:rounded-2xl">
          {amenityRow}

          <div className="sm:mb-4 mb-2 flex items-end justify-between sm:gap-[35%] gap-[30%]">
            {smallDoorBadge(true)}
            <div className="flex-1 rounded-lg bg-white py-1 px-1 text-center text-xs sm:text-md font-bold uppercase sm:tracking-[0.3em] text-slate-900 shadow">
              Door
            </div>
            {smallDoorBadge()}
          </div>

          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${totalTracks}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${rowCount}, ${SEAT_SIZE})`,
            }}
          >
            {renderSeats("vertical")}
            <div
              className="flex items-center justify-center rounded-lg border-x border-dashed border-slate-700/70 bg-slate-900/40 text-[10px] font-bold tracking-widest text-slate-600"
              style={{ gridColumn: aisleLine, gridRow: `1 / span ${rowCount}` }}
            >
              <span className="[writing-mode:vertical-rl]">AISLE</span>
            </div>
          </div>

          <div className="sm:mt-4 mt-2 flex items-start justify-between sm:gap-[35%] gap-[30%]">
            {smallDoorBadge(true)}
            <div className="flex-1 rounded-lg bg-white py-1 px-1 text-center text-xs sm:text-md font-bold uppercase sm:tracking-[0.3em] text-slate-900 shadow">
              Door
            </div>
            {smallDoorBadge()}
          </div>
        </div>
      </div>

      <div className="hidden lg:flex lg:justify-center overflow-x-auto max-w-full py-2">
        <div className="relative flex items-stretch gap-4 xl:gap-6 rounded-3xl border border-slate-800/80 bg-black/60 p-4 xl:p-6 shadow-2xl shrink-0">
          <div className="flex flex-col justify-between items-end py-1">
            <div className="flex items-center gap-2 xl:gap-3">
              {hasBagRack && (
                <span className="text-[11px] xl:text-xs font-bold uppercase tracking-widest text-slate-300">
                  Bag Rack
                </span>
              )}
              <span className="rounded-full bg-white px-3 py-1 text-[9px] xl:text-[10px] font-black tracking-wider text-slate-950 shadow">
                DOOR
              </span>
            </div>

            <div className="my-auto flex h-28 xl:h-32 w-7 xl:w-8 items-center justify-center rounded-full bg-white shadow-md">
              <span className="text-[9px] xl:text-[10px] font-black uppercase tracking-[0.25em] text-slate-950 [writing-mode:vertical-rl] rotate-180">
                DOOR
              </span>
            </div>

            <div className="flex items-center gap-2 xl:gap-3">
              {hasToilet && (
                <span className="text-[11px] xl:text-xs font-bold uppercase tracking-widest text-slate-300">
                  Toilet
                </span>
              )}
              <span className="rounded-full bg-white px-3 py-1 text-[9px] xl:text-[10px] font-black tracking-wider text-slate-950 shadow">
                DOOR
              </span>
            </div>
          </div>

          <div
            className="my-auto grid gap-1.5 xl:gap-2"
            style={{
              gridTemplateColumns: `repeat(${rowCount}, ${DESKTOP_SEAT_SIZE})`,
              gridTemplateRows: `repeat(${totalTracks}, ${DESKTOP_SEAT_SIZE})`,
            }}
          >
            {renderSeats("horizontal")}
            <div
              className="flex items-center justify-center rounded-xl border-y border-dashed border-slate-800 bg-slate-900/60 text-[9px] xl:text-[10px] font-bold tracking-[0.3em] text-slate-500"
              style={{ gridRow: aisleLine, gridColumn: `1 / span ${rowCount}` }}
            >
              AISLE
            </div>
          </div>

          <div className="flex flex-col justify-between items-start py-1">
            <span className="rounded-full bg-white px-3 py-1 text-[9px] xl:text-[10px] font-black tracking-wider text-slate-950 shadow">
              DOOR
            </span>

            <div className="my-auto flex h-28 xl:h-32 w-7 xl:w-8 items-center justify-center rounded-full bg-white shadow-md">
              <span className="text-[9px] xl:text-[10px] font-black uppercase tracking-[0.25em] text-slate-950 [writing-mode:vertical-rl]">
                DOOR
              </span>
            </div>

            <span className="rounded-full bg-white px-3 py-1 text-[9px] xl:text-[10px] font-black tracking-wider text-slate-950 shadow">
              DOOR
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}