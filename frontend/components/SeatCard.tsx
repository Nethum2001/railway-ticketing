import { cn } from "@/lib/utils";

type SeatCardProps = {
  seatId: string;
  label?: string;
  state: "available" | "booked" | "selected";
  seatType?: "window" | "aisle";
  onClick?: () => void;
};

export function SeatCard({ seatId, label, state, seatType, onClick }: SeatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === "booked"}
      className={cn(
        "relative flex h-full w-full items-center justify-center rounded-md md:rounded-lg border p-0.5 sm:p-1 md:p-2 text-xs sm:text-sm md:text-base lg:text-lg font-extrabold transition-all",
        state === "selected" &&
          "scale-[1.03] border-amber-300 bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/30",
        state === "available" &&
          "border-blue-500 bg-blue-600 text-white hover:border-blue-300 hover:bg-blue-500",
        state === "booked" &&
          "cursor-not-allowed border-slate-700 bg-slate-800 text-slate-500 line-through opacity-70"
      )}
    >
      {seatType && (
        <span
          className={cn(
            "pointer-events-none absolute top-0.5 sm:top-1 text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wide",
            seatType === "window" ? "left-1 sm:left-1.5" : "right-1 sm:right-1.5",
            state === "selected" ? "text-slate-900/70" : "text-white/70"
          )}
        >
          {seatType === "window" ? "W" : "A"}
        </span>
      )}
      {label ?? seatId}
    </button>
  );
}