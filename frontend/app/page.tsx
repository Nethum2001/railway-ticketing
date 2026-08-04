import Link from "next/link";
import { ReservationFareDialog } from "@/components/ReservationFareDialog";

import {
  ChevronRight,
  MapPinned,
  PhoneCall,
  TrainFront,
} from "lucide-react";

import { JourneySearchCard } from "@/components/JourneySearchCard";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import trainbackground from "../public/images/train-background.jpg";
import colombo from "../public/images/colombo.webp";
import demodara from "../public/images/Demodara.webp";
import idalgashinna from "../public/images/idalgashinna.jpg";
import kadugannawa from "../public/images/Kadugannawa.jpeg";

const destinations = [
  {
    title: "Colombo",
    image:
      colombo.src,
  },
  {
    title: "Kadugannawa",
    image:
      kadugannawa.src,
  },
  {
    title: "Idalgashinna",
    image:
      idalgashinna.src,
  },
  {
    title: "Demodara",
    image:
      demodara.src,
  },
];

const faqs = [
  "What is a Sri Lanka Railway commuter ticket?",
  "How can I purchase a commuter ticket on the website?",
  "Can I buy a commuter ticket in advance?",
  "What is the maximum number of commuter tickets I can buy?",
  "What are the available classes for commuter tickets?",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f3f6fb] text-slate-900">
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: `url(${trainbackground.src ?? trainbackground})` }} 
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.58)_0%,rgba(2,6,23,0.42)_42%,rgba(243,246,251,0.94)_100%)]" />
        <div className="absolute inset-x-0 top-0">
          <Navbar variant="overlay" />
        </div>

        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center gap-8 px-4 pb-20 pt-28 sm:px-6 lg:px-8 lg:pb-24 lg:pt-32">
          <div className="max-w-4xl text-center text-white">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-white/80 backdrop-blur">
              <TrainFront className="size-3.5" />
              RailVista Sri Lanka
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Your Gateway to Exploring Sri Lanka by Train
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-6 text-white/85 sm:text-base">
              Book seats, compare routes, and plan railway journeys with a cleaner interface designed for speed and clarity.
            </p>
          </div>

          <div className="w-full max-w-6xl space-y-5">
            <JourneySearchCard />
              <div className="flex justify-center">
              <ReservationFareDialog
                trainNo="1005"
                trainName="Scenic Valley Limited"
              />
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <section id="services" className="scroll-mt-24 py-12 lg:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">What we offer</h2>
          </div>

          
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="overflow-hidden rounded-[32px] border border-[#d8e5ff] bg-white p-6 shadow-[0_24px_60px_-36px_rgba(79,141,247,0.35)]">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#4f8df7]">
                  <MapPinned className="size-6" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#4f8df7]">Segment booking</p>
                  <h3 className="text-2xl font-semibold text-slate-900">Book intermediate stations in one journey</h3>
                </div>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Choose any origin and destination on the route, then reserve only the segment you need. The next step shows all matching trains, the seat grid, and fare comparison for the selected class.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Intermediate stations stay available for partial-route bookings.</div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Signed-in customers can auto-fill passenger details.</div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Guests can book by keeping their NIC or passport as the session key.</div>
              </div>
            </article>

            <article className="rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.7)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300">How it works</p>
              <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                <li className="rounded-2xl border border-white/10 bg-white/5 p-4">1. Search from, to, and travel date.</li>
                <li className="rounded-2xl border border-white/10 bg-white/5 p-4">2. Pick the best train from the filtered cards.</li>
                <li className="rounded-2xl border border-white/10 bg-white/5 p-4">3. Choose class, coach, and up to 5 seats.</li>
                <li className="rounded-2xl border border-white/10 bg-white/5 p-4">4. Confirm passenger details and complete the booking.</li>
              </ol>
            </article>
          </div>
        </section>
        <section id="destinations" className="scroll-mt-24 py-12 lg:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Featured Destinations</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
              Experience Sri Lanka's breathtaking landscapes and timeless charm as the rails guide your journey.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {destinations.map((destination) => (
              <article
                key={destination.title}
                className="group relative overflow-hidden rounded-[28px] bg-slate-900 shadow-[0_18px_40px_-26px_rgba(15,23,42,0.45)]"
              >
                <div
                  className="h-[520px] bg-cover bg-center transition duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url('${destination.image}')` }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.08)_0%,rgba(15,23,42,0.18)_40%,rgba(15,23,42,0.72)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <h3 className="text-2xl font-semibold tracking-tight drop-shadow-sm">{destination.title}</h3>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 py-12 lg:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Frequently Asked Questions</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
              Have any questions? We are here to assist you.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-4xl space-y-3">
            {faqs.map((question) => (
              <details key={question} className="group rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_-24px_rgba(15,23,42,0.28)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-slate-800 [&::-webkit-details-marker]:hidden">
                  <span>{question}</span>
                  <ChevronRight className="size-4 shrink-0 text-slate-400 transition group-open:rotate-90" />
                </summary>
                <div className="border-t border-slate-100 px-5 pb-5 pt-3 text-sm leading-6 text-slate-500">
                  Support is available through the contact section below and through the hotline listed in the footer.
                </div>
              </details>
            ))}

            <div className="pt-4 text-center">
              <Link
                href="#contact"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                View all FAQs
              </Link>
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-24 py-12 lg:py-16">
          <div className="mx-auto max-w-5xl rounded-[32px] border border-[#d8e5ff] bg-[#eff5ff] px-6 py-12 text-center shadow-[0_24px_60px_-36px_rgba(79,141,247,0.45)] sm:px-10">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Contact Us</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Get in touch with our support team for any questions, to report issues, or to request help with your reservation.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="tel:+94112271271"
                className="inline-flex items-center gap-2 rounded-full bg-[#4f8df7] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_-24px_rgba(79,141,247,0.95)] transition hover:bg-[#3f7ee9]"
              >
                <PhoneCall className="size-4" />
                Call 011-2271271
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
