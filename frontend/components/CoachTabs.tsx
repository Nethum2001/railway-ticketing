"use client";

import { cn } from "@/lib/utils";

type Coach = {
  id: string;
  description: string;
  occupancy: string;
};

type CoachTabsProps = {
  coaches: Coach[];
  activeCoach: string;
  onCoachChange: (coachId: string) => void;
};

export function CoachTabs({ coaches, activeCoach, onCoachChange }: CoachTabsProps) {
  return (
    <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(240px,1fr))] max-w-2xl">
      {coaches.map((coach) => {
        const isActive = coach.id === activeCoach;

        return (
          <button
            key={coach.id}
            type="button"
            onClick={() => onCoachChange(coach.id)}
            className={cn(
              "rounded-2xl border p-4 text-left transition-all",
              isActive
                ? "border-orange-300 bg-orange-50 shadow-md shadow-orange-200/40"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-900">Coach {coach.id}</span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  isActive ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-600"
                )}
              >
                {coach.occupancy}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{coach.description}</p>
          </button>
        );
      })}
    </div>
  );
}