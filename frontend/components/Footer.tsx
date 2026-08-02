export function Footer() {
  return (
    <footer className="mt-auto bg-[#081018] text-white">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 text-sm sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr_0.9fr] lg:px-8">
        <div className="space-y-4 text-slate-300">
          <p className="text-3xl font-semibold tracking-tight text-white">RailVista</p>
          <p className="max-w-sm leading-6">
            A cleaner way to search, reserve, and manage train journeys across Sri Lanka.
          </p>
          <p className="text-slate-400">Hotline: 1315</p>
        </div>

        <div className="space-y-3 text-slate-300">
          <p className="font-semibold text-white">Services</p>
          <p>Commuter Tickets</p>
          <p>Season Tickets</p>
          <p>Refund Requests</p>
        </div>

        <div className="space-y-3 text-slate-300">
          <p className="font-semibold text-white">Legal</p>
          <p>Terms of Service</p>
          <p>Privacy Policy</p>
        </div>

        <div className="space-y-3 text-slate-300">
          <p className="font-semibold text-white">Support</p>
          <p>FAQs</p>
          <p>Contact Us</p>
          <p>Live assistance</p>
        </div>

        <div className="space-y-3 text-slate-300 sm:text-right">
          <p className="font-semibold text-white">Available on</p>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <span className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white/80">App Store</span>
            <span className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white/80">Google Play</span>
          </div>
          <p className="pt-2 text-xs text-slate-400">
            Sri Lanka Transport Board
            <br />
            No. 200, Kirula Road, Colombo 05
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
        ©2026 RailVista Sri Lanka. All rights reserved.
      </div>
    </footer>
  );
}