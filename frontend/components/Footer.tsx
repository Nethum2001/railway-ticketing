export function Footer() {
  return (
    <footer className="mt-auto bg-[#081018] text-white">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 text-sm sm:px-6 lg:grid-cols-[1.2fr_1fr_0.8fr_1fr] lg:px-8">
        <div className="space-y-4 text-slate-300">
          <p className="text-3xl font-semibold tracking-tight text-white">RailVista</p>
          <p className="max-w-sm leading-6">
            A cleaner way to search, reserve, and manage train journeys across Sri Lanka.
          </p>
        </div>

        <div className="space-y-3 text-slate-300">
          <p className="font-semibold text-white">Services</p>
          <p>Train search by route</p>
          <p>Real-time seat selection</p>
          <p>Online reservation management</p>
          <p>Admin analytics dashboard</p>
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
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
        ©2026 RailVista Sri Lanka. All rights reserved.
      </div>
    </footer>
  );
}