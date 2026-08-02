import Link from "next/link";

import { TrainFront } from "lucide-react";

type NavbarProps = {
  variant?: "solid" | "overlay";
};

export function Navbar({ variant = "solid" }: NavbarProps) {
  const isOverlay = variant === "overlay";

  return (
    <header
      className={isOverlay ? "absolute inset-x-0 top-0 z-30" : "sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl"}
    >
      <div
        className={isOverlay
          ? "mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 text-white sm:px-6 lg:px-8"
          : "mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8"
        }
      >
        <Link href="/" className="flex items-center gap-3">
          <span
            className={isOverlay
              ? "flex size-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white shadow-[0_12px_30px_-18px_rgba(15,23,42,0.85)] backdrop-blur"
              : "flex size-11 items-center justify-center rounded-full bg-[#0f2748] text-white shadow-sm"
            }
          >
            <TrainFront className="size-5" />
          </span>
          <span className="leading-tight">
            <span className={isOverlay ? "block text-[11px] font-semibold uppercase tracking-[0.34em] text-white/75" : "block text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-500"}>
              RailVista Sri Lanka
            </span>
            <span className={isOverlay ? "block text-sm font-medium text-white" : "block text-sm font-medium text-slate-900"}>
              Train seat reservation
            </span>
          </span>
        </Link>

        <nav className={isOverlay ? "hidden items-center gap-8 text-sm font-medium text-white/85 lg:flex" : "hidden items-center gap-8 text-sm font-medium text-slate-600 lg:flex"}>
          {isOverlay ? (
            <>
              <Link href="/" className="transition hover:text-white">Home</Link>
              <Link href="#services" className="transition hover:text-white">Destinations</Link>
              <Link href="#faq" className="transition hover:text-white">FAQs</Link>
              <Link href="#contact" className="transition hover:text-white">Contact Us</Link>
            </>
          ) : (
            <>
              <Link href="/search" className="transition hover:text-slate-900">Search</Link>
              <Link href="/booking" className="transition hover:text-slate-900">Booking</Link>
              <Link href="#faq" className="transition hover:text-slate-900">FAQs</Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/auth?mode=register"
            className={isOverlay
              ? "hidden rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20 sm:inline-flex"
              : "hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900 sm:inline-flex"
            }
          >
            Sign up
          </Link>
          <Link
            href="/auth?mode=login"
            className="inline-flex rounded-full bg-[#4f8df7] px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_40px_-24px_rgba(79,141,247,0.95)] transition hover:bg-[#3f7ee9]"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}