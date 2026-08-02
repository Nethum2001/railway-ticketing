"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, LockKeyhole, UserPlus } from "lucide-react";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { login, register, saveAuthSession } from "@/lib/api";

type AuthMode = "login" | "register";

export function AuthPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";
  const initialMode = (searchParams.get("mode") as AuthMode | null) ?? "login";
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const actionLabel = useMemo(() => (mode === "login" ? "Sign in" : "Create account"), [mode]);

  async function handleSubmit() {
    try {
      setPending(true);
      setError(null);

      const session =
        mode === "login"
          ? await login({ email, password })
          : await register({ email, password, fullName });

      saveAuthSession(session);
      router.push(redirectTo);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to complete authentication");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f3f6fb] text-slate-900">
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[32px] bg-slate-950 p-8 text-white shadow-[0_28px_80px_-44px_rgba(15,23,42,0.75)]">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-orange-200">
              <LockKeyhole className="size-4" />
              Secure booking access
            </p>
            <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Sign in once, then book seats with JWT-protected requests.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
              This flow stores the access token locally so the booking form can call the backend directly and keep the reservation flow fast.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-orange-200">Login</p>
                <p className="mt-2 text-sm text-slate-300">Access your saved bookings and continue a reservation.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-orange-200">Register</p>
                <p className="mt-2 text-sm text-slate-300">Create a customer account in one request.</p>
              </div>
            </div>
          </section>

          <Card className="rail-panel border-white/70">
            <CardHeader className="border-b border-white/60 bg-white/30">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-orange-700">
                <UserPlus className="size-4" />
                Account access
              </div>
              <CardTitle className="text-3xl text-slate-950">{actionLabel}</CardTitle>
              <div className="flex items-center gap-3 pt-2 text-sm">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={mode === "login" ? "rounded-full bg-slate-950 px-4 py-2 text-white" : "rounded-full border border-slate-200 px-4 py-2 text-slate-600"}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={mode === "register" ? "rounded-full bg-slate-950 px-4 py-2 text-white" : "rounded-full border border-slate-200 px-4 py-2 text-slate-600"}
                >
                  Register
                </button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 p-6">
              {mode === "register" && (
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Full name
                  <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" className="h-12 rounded-2xl bg-white/90" />
                </label>
              )}
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Email
                <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="h-12 rounded-2xl bg-white/90" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Password
                <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="At least 6 characters" className="h-12 rounded-2xl bg-white/90" />
              </label>

              {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={pending}
                className="h-12 rounded-2xl bg-[linear-gradient(135deg,#0f766e,#14b8a6_58%,#22c55e)] text-base shadow-lg shadow-emerald-500/25 hover:brightness-105"
              >
                {actionLabel}
                <ArrowRight className="size-4" />
              </Button>

              <div className="text-sm text-slate-500">
                <Link href="/" className="font-medium text-slate-700 underline-offset-4 hover:underline">
                  Back to the home page
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}