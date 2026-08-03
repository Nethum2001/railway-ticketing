"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { stations } from "@/components/railway-data";

type StationSelectProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  tone?: "light" | "dark";
};

export function StationSelect({ label, value, onValueChange, placeholder, tone = "light" }: StationSelectProps) {
  return (
    <label className="grid gap-2">
      <span className={tone === "dark" ? "px-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-200" : "px-2 text-md font-medium text-slate-700"}>
        {label}
      </span>
      <Select
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue) {
            onValueChange(nextValue);
          }
        }}
      >
        <SelectTrigger
          className={tone === "dark"
            ? "!h-12 w-full rounded-md border border-white/15 bg-white px-4 text-slate-900 shadow-sm shadow-slate-900/20"
            : "!h-12 w-full rounded-2xl border-slate-200 bg-white/90 px-4 text-slate-900 shadow-sm shadow-slate-900/5"
          }
        >
          <SelectValue placeholder={placeholder} className={"text-md"} />
        </SelectTrigger>
        <SelectContent>
          {stations.map((station) => (
            <SelectItem key={station} value={station}>
              {station}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}