"use client";

type DatePickerProps = {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  tone?: "light" | "dark";
};

export function DatePicker({ value, onValueChange, label, tone = "light" }: DatePickerProps) {
  return (
    <label className="grid gap-2">
      <span className={tone === "dark" ? "px-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-200" : "px-2 text-md font-medium text-slate-700"}>
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className={tone === "dark"
          ? "h-12 w-full rounded-md border border-white/15 bg-white px-4 text-md text-slate-900 shadow-sm shadow-slate-900/20 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          : "h-12 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 text-md text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
        }
      />
    </label>
  );
}