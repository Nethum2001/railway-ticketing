"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, UserCircle2 } from "lucide-react";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getStoredAuthSession, saveAuthSession, type AuthSession } from "@/lib/api";

export function ProfilePageClient() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const currentSession = getStoredAuthSession();

    if (!currentSession) {
      router.replace("/auth?mode=login&redirectTo=/profile");
      return;
    }

    setSession(currentSession);
    setFullName(currentSession.user.fullName);
    setEmail(currentSession.user.email);
  }, [router]);

  function handleSave() {
    if (!session) {
      return;
    }

    const nextSession: AuthSession = {
      ...session,
      user: {
        ...session.user,
        fullName: fullName.trim() || session.user.fullName,
        email: email.trim() || session.user.email,
      },
    };

    saveAuthSession(nextSession);
    setSession(nextSession);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  if (!session) {
    return <div className="min-h-screen bg-[#f3f6fb]" />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f3f6fb] text-slate-900">
      <Navbar />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-700">Profile</p>
            <h1 className="text-3xl font-semibold text-slate-950">Manage your account</h1>
          </div>
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>
        </div>

        <Card className="rail-panel border-white/70">
          <CardHeader className="border-b border-white/60 bg-white/30">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-[#4f8df7] text-white">
                <UserCircle2 className="size-6" />
              </div>
              <div>
                <CardTitle className="text-2xl text-slate-950">Profile details</CardTitle>
                <p className="text-sm text-slate-500">Update the account details stored for this signed-in session.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5 p-6">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Full name
              <Input value={fullName} onChange={(event) => setFullName(event.target.value)} className="h-12 rounded-2xl bg-white/90" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Email
              <Input value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 rounded-2xl bg-white/90" />
            </label>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Role: {session.user.role} | Account created: {new Date(session.user.createdAt).toLocaleDateString("en-GB")}
            </div>
            {saved && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Profile details updated for the current session.</div>}
            <Button
              type="button"
              onClick={handleSave}
              className="h-12 rounded-2xl bg-[linear-gradient(135deg,#0f766e,#14b8a6_58%,#22c55e)] text-base shadow-lg shadow-emerald-500/25 hover:brightness-105"
            >
              <Save className="size-4" />
              Save changes
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}