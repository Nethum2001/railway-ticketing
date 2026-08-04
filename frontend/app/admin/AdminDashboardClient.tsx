"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, ShieldCheck, TrainFront, UsersRound } from "lucide-react";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import {
  createAdminTrain,
  getAdminCoachStatus,
  getAdminOverview,
  getAdminUsers,
  getStoredAuthSession,
  getTrains,
  promoteAdmin,
  removeAdmin,
  removeAdminTrain,
  updateAdminTrain,
  updateCoachAmenities,
  type AdminAnalyticsPoint,
  type AdminOverview,
  type AuthSession,
} from "@/lib/api";

type Period = "daily" | "weekly" | "monthly";

function Lkr({ value }: { value: number }) {
  return <span>LKR {value.toLocaleString("en-LK")}</span>;
}

function MetricLineChart({
  title,
  color,
  points,
  metric,
  suffix,
}: {
  title: string;
  color: string;
  points: AdminAnalyticsPoint[];
  metric: "revenue" | "occupancy";
  suffix?: string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const width = 720;
  const height = 250;
  const padding = 28;
  const values = points.map((point) => point[metric]);
  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  const span = Math.max(1, max - min);

  const path = points
    .map((point, index) => {
      const x = padding + (index / Math.max(1, points.length - 1)) * (width - padding * 2);
      const normalized = (point[metric] - min) / span;
      const y = height - padding - normalized * (height - padding * 2);
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  const hoverPoint = hoverIndex !== null ? points[hoverIndex] : null;
  const hoverX =
    hoverIndex !== null
      ? padding + (hoverIndex / Math.max(1, points.length - 1)) * (width - padding * 2)
      : null;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[250px] w-full min-w-[60%]">
          <rect x="0" y="0" width={width} height={height} fill="#f8fafc" rx="20" />
          {[0, 1, 2, 3, 4].map((step) => {
            const y = padding + step * ((height - padding * 2) / 4);
            return <line key={step} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeDasharray="4 6" />;
          })}
          <path d={path} stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
          {points.map((point, index) => {
            const x = padding + (index / Math.max(1, points.length - 1)) * (width - padding * 2);
            const normalized = (point[metric] - min) / span;
            const y = height - padding - normalized * (height - padding * 2);

            return (
              <g key={point.key}>
                <circle
                  cx={x}
                  cy={y}
                  r={hoverIndex === index ? 7 : 4}
                  fill={color}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoverIndex(index)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
              </g>
            );
          })}
          {hoverPoint && hoverX !== null && (
            <g>
              <line x1={hoverX} y1={padding} x2={hoverX} y2={height - padding} stroke="#94a3b8" strokeDasharray="5 4" />
              <rect x={Math.max(14, hoverX - 68)} y={16} width="136" height="54" rx="10" fill="#0f172a" />
              <text x={hoverX} y={38} textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="600">
                {hoverPoint.label}
              </text>
              <text x={hoverX} y={56} textAnchor="middle" fill="#f8fafc" fontSize="14" fontWeight="700">
                {hoverPoint[metric].toLocaleString("en-LK")}{suffix ?? ""}
              </text>
            </g>
          )}
        </svg>
      </div>
    </section>
  );
}

export function AdminDashboardClient() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [period, setPeriod] = useState<Period>("weekly");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [admins, setAdmins] = useState<Array<{ id: string; email: string; fullName: string; createdAt: string }>>([]);
  const [coachStatus, setCoachStatus] = useState<
    Array<{
      coachCode: string;
      coachName: string;
      travelClass: "FIRST_CLASS" | "SECOND_CLASS";
      bookedSeatCount: number;
      totalSeatCount: number;
      occupancyRate: number;
      hasBagRack: boolean;
      hasToilet: boolean;
    }>
  >([]);
  const [trains, setTrains] = useState<Array<{ trainNo: string; trainName: string; departureTime: string; arrivalTime: string }>>([]);
  const [selectedCoachTrainNo, setSelectedCoachTrainNo] = useState("");
  const [selectedCoachDate, setSelectedCoachDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [adminEmail, setAdminEmail] = useState("");
  const [newTrain, setNewTrain] = useState({
    trainNo: "",
    trainName: "",
    startingCity: "",
    endingCity: "",
    departureTime: "",
    arrivalTime: "",
    travelTime: "",
    description: "",
    firstClassFare: "",
    secondClassFare: "",
    routeStopsText: "",
  });
  const [trainPatch, setTrainPatch] = useState({
    trainNo: "",
    departureTime: "",
    arrivalTime: "",
    travelTime: "",
    firstClassFare: "",
    secondClassFare: "",
  });

  useEffect(() => {
    const currentSession = getStoredAuthSession();
    if (!currentSession) {
      router.replace("/auth?mode=login&redirectTo=/admin");
      return;
    }

    if (currentSession.user.role !== "ADMIN") {
      router.replace("/");
      return;
    }

    setSession(currentSession);
  }, [router]);

  useEffect(() => {
    const activeSession = session;
    if (!activeSession) {
      return;
    }
    const token = activeSession.accessToken;

    let active = true;

    async function loadDashboard() {
      try {
        setError(null);
        const [overviewResult, adminResult, trainResult] = await Promise.all([
          getAdminOverview(period, token),
          getAdminUsers(token),
          getTrains(),
        ]);

        const nextCoachTrainNo = selectedCoachTrainNo || trainResult[0]?.trainNo || "";
        const coachDate = selectedCoachDate || new Date().toISOString().slice(0, 10);
        const coachResult = nextCoachTrainNo
          ? await getAdminCoachStatus(nextCoachTrainNo, coachDate, token)
          : [];

        if (!active) {
          return;
        }

        setSelectedCoachTrainNo(nextCoachTrainNo);
        setOverview(overviewResult);
        setCoachStatus(coachResult);
        setAdmins(adminResult);
        setTrains(
          trainResult.map((train) => ({
            trainNo: train.trainNo,
            trainName: train.trainName,
            departureTime: train.departureTime,
            arrivalTime: train.arrivalTime,
          })),
        );
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Failed to load admin dashboard");
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [period, selectedCoachDate, selectedCoachTrainNo, session]);

  useEffect(() => {
    if (selectedCoachTrainNo || trains.length === 0) {
      return;
    }

    setSelectedCoachTrainNo(trains[0].trainNo);
  }, [selectedCoachTrainNo, trains]);

  async function refreshAll() {
    const activeSession = session;
    if (!activeSession) {
      return;
    }

    const token = activeSession.accessToken;
    const [overviewResult, adminResult, trainResult] = await Promise.all([
      getAdminOverview(period, token),
      getAdminUsers(token),
      getTrains(),
    ]);

    const nextCoachTrainNo = selectedCoachTrainNo || trainResult[0]?.trainNo || '';
    const coachDate = selectedCoachDate || new Date().toISOString().slice(0, 10);
    const coachResult = nextCoachTrainNo
      ? await getAdminCoachStatus(nextCoachTrainNo, coachDate, token)
      : [];

    setOverview(overviewResult);
    setCoachStatus(coachResult);
    setAdmins(adminResult);
    setTrains(
      trainResult.map((train) => ({
        trainNo: train.trainNo,
        trainName: train.trainName,
        departureTime: train.departureTime,
        arrivalTime: train.arrivalTime,
      })),
    );
  }

  async function runAction(action: () => Promise<void>, successText: string) {
    try {
      setPending(true);
      setError(null);
      setMessage(null);
      await action();
      await refreshAll();
      setMessage(successText);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action failed");
    } finally {
      setPending(false);
    }
  }

  function parseRouteStops(input: string) {
    return input
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [station, time] = item.split("@").map((part) => part.trim());
        return { station, time };
      });
  }

  if (!session) {
    return <div className="min-h-screen bg-[#f3f6fb]" />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f3f6fb] text-slate-900">
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_42%,#0f766e_100%)] p-7 text-white shadow-[0_28px_80px_-44px_rgba(2,6,23,0.85)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">Admin Console</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">RailVista Operations Dashboard</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-200">
                Monitor occupancy and revenue, manage train schedules and fares, and control coach setup in one place.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm">
              <div className="font-medium">{session.user.fullName}</div>
              <div className="text-cyan-100">{session.user.email}</div>
            </div>
          </div>
        </section>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="inline-flex rounded-full bg-slate-100 p-2 text-slate-700"><BarChart3 className="size-4" /></div>
            <p className="mt-3 text-xs uppercase tracking-[0.25em] text-slate-500">Revenue</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{overview ? <Lkr value={overview.totals.revenue} /> : "-"}</p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="inline-flex rounded-full bg-slate-100 p-2 text-slate-700"><UsersRound className="size-4" /></div>
            <p className="mt-3 text-xs uppercase tracking-[0.25em] text-slate-500">Bookings</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{overview?.totals.bookings.toLocaleString("en-LK") ?? "-"}</p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="inline-flex rounded-full bg-slate-100 p-2 text-slate-700"><ShieldCheck className="size-4" /></div>
            <p className="mt-3 text-xs uppercase tracking-[0.25em] text-slate-500">Occupancy</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{overview ? `${overview.totals.occupancyRate}%` : "-"}</p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="inline-flex rounded-full bg-slate-100 p-2 text-slate-700"><TrainFront className="size-4" /></div>
            <p className="mt-3 text-xs uppercase tracking-[0.25em] text-slate-500">Active Trains / Coaches</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{overview ? `${overview.totals.activeTrains} / ${overview.totals.activeCoaches}` : "-"}</p>
          </article>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {(["daily", "weekly", "monthly"] as Period[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPeriod(item)}
                className={item === period ? "rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white" : "rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"}
              >
                {item.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <MetricLineChart title="Revenue Trend" color="#0f766e" points={overview?.points ?? []} metric="revenue" />
            <MetricLineChart title="Occupancy Trend" color="#1d4ed8" points={overview?.points ?? []} metric="occupancy" suffix="%" />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Admin Access Management</h2>
            <div className="mt-4 flex gap-2">
              <input
                value={adminEmail}
                onChange={(event) => setAdminEmail(event.target.value)}
                placeholder="user@example.com"
                className="h-11 flex-1 rounded-xl border border-slate-200 px-3 text-sm"
              />
              <button
                type="button"
                disabled={pending || !adminEmail}
                onClick={() =>
                  runAction(
                    async () => {
                      await promoteAdmin(adminEmail, session.accessToken);
                      setAdminEmail("");
                    },
                    "Admin role granted",
                  )
                }
                className="rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                Add Admin
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {admins.map((admin) => (
                <div key={admin.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{admin.fullName}</p>
                    <p className="text-slate-500">{admin.email}</p>
                  </div>
                  <button
                    type="button"
                    disabled={pending || admin.id === session.user.id}
                    onClick={() => runAction(() => removeAdmin(admin.id, session.accessToken).then(() => undefined), "Admin role removed")}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Coach Booking Status</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <select
                value={selectedCoachTrainNo}
                onChange={(event) => setSelectedCoachTrainNo(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
              >
                <option value="">Select Train</option>
                {trains.map((train) => (
                  <option key={train.trainNo} value={train.trainNo}>
                    {train.trainNo} - {train.trainName}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={selectedCoachDate}
                onChange={(event) => setSelectedCoachDate(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            </div>
            <div key={selectedCoachTrainNo || "no-train"} className="mt-4 space-y-2">
              {selectedCoachTrainNo && coachStatus.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  No coach bookings found for {selectedCoachDate}.
                </div>
              )}
              {!selectedCoachTrainNo && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Select a train to view coach bookings.
                </div>
              )}
              {coachStatus.map((coach) => (
                <div key={coach.coachCode} className="rounded-2xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{coach.coachCode} · {coach.coachName}</p>
                      <p className="text-xs text-slate-500">{coach.travelClass.replaceAll("_", " ")}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{coach.bookedSeatCount}/{coach.totalSeatCount} ({coach.occupancyRate}%)</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={pending || !selectedCoachTrainNo}
                      onClick={() => runAction(() => updateCoachAmenities(selectedCoachTrainNo, coach.coachCode, { hasBagRack: !coach.hasBagRack }, session.accessToken).then(() => undefined), "Coach bag rack updated")}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      {coach.hasBagRack ? "Remove" : "Add"} Bag Rack
                    </button>
                    <button
                      type="button"
                      disabled={pending || !selectedCoachTrainNo}
                      onClick={() => runAction(() => updateCoachAmenities(selectedCoachTrainNo, coach.coachCode, { hasToilet: !coach.hasToilet }, session.accessToken).then(() => undefined), "Coach toilet updated")}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      {coach.hasToilet ? "Remove" : "Add"} Toilet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section>
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Train Management</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:items-start">
              <div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input value={newTrain.trainNo} onChange={(event) => setNewTrain((current) => ({ ...current, trainNo: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" placeholder="Train No" />
                  <input value={newTrain.trainName} onChange={(event) => setNewTrain((current) => ({ ...current, trainName: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" placeholder="Train Name" />
                  <input value={newTrain.startingCity} onChange={(event) => setNewTrain((current) => ({ ...current, startingCity: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" placeholder="Starting City" />
                  <input value={newTrain.endingCity} onChange={(event) => setNewTrain((current) => ({ ...current, endingCity: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" placeholder="Ending City" />
                  <input value={newTrain.departureTime} onChange={(event) => setNewTrain((current) => ({ ...current, departureTime: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" placeholder="Departure (HH:mm)" />
                  <input value={newTrain.arrivalTime} onChange={(event) => setNewTrain((current) => ({ ...current, arrivalTime: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" placeholder="Arrival (HH:mm)" />
                  <input value={newTrain.travelTime} onChange={(event) => setNewTrain((current) => ({ ...current, travelTime: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" placeholder="Travel Time" />
                  <input value={newTrain.description} onChange={(event) => setNewTrain((current) => ({ ...current, description: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" placeholder="Description" />
                  <input value={newTrain.firstClassFare} onChange={(event) => setNewTrain((current) => ({ ...current, firstClassFare: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" placeholder="First class fare per hop" />
                  <input value={newTrain.secondClassFare} onChange={(event) => setNewTrain((current) => ({ ...current, secondClassFare: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" placeholder="Second class fare per hop" />
                </div>
                <textarea
                  value={newTrain.routeStopsText}
                  onChange={(event) => setNewTrain((current) => ({ ...current, routeStopsText: event.target.value }))}
                  className="mt-2 h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Route stops format: Station@HH:mm, Station@HH:mm"
                />
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    runAction(
                      async () => {
                        await createAdminTrain(
                          {
                            trainNo: newTrain.trainNo,
                            trainName: newTrain.trainName,
                            startingCity: newTrain.startingCity,
                            endingCity: newTrain.endingCity,
                            departureTime: newTrain.departureTime,
                            arrivalTime: newTrain.arrivalTime,
                            travelTime: newTrain.travelTime,
                            description: newTrain.description,
                            farePerHop: {
                              FIRST_CLASS: Number.parseInt(newTrain.firstClassFare, 10),
                              SECOND_CLASS: Number.parseInt(newTrain.secondClassFare, 10),
                            },
                            routeStops: parseRouteStops(newTrain.routeStopsText),
                          },
                          session.accessToken,
                        );
                      },
                      "Train created",
                    )
                  }
                  className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Add Train
                </button>

                <div className="mt-5 rounded-2xl border border-slate-200 p-3">
                  <h3 className="text-sm font-semibold text-slate-900">Update Schedule / Fares</h3>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <select value={trainPatch.trainNo} onChange={(event) => setTrainPatch((current) => ({ ...current, trainNo: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
                      <option value="">Select Train</option>
                      {trains.map((train) => (
                        <option key={train.trainNo} value={train.trainNo}>{train.trainNo} - {train.trainName}</option>
                      ))}
                    </select>
                    <input value={trainPatch.travelTime} onChange={(event) => setTrainPatch((current) => ({ ...current, travelTime: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" placeholder="Travel Time" />
                    <input value={trainPatch.departureTime} onChange={(event) => setTrainPatch((current) => ({ ...current, departureTime: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" placeholder="Departure HH:mm" />
                    <input value={trainPatch.arrivalTime} onChange={(event) => setTrainPatch((current) => ({ ...current, arrivalTime: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" placeholder="Arrival HH:mm" />
                    <input value={trainPatch.firstClassFare} onChange={(event) => setTrainPatch((current) => ({ ...current, firstClassFare: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" placeholder="First class fare per hop" />
                    <input value={trainPatch.secondClassFare} onChange={(event) => setTrainPatch((current) => ({ ...current, secondClassFare: event.target.value }))} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" placeholder="Second class fare per hop" />
                  </div>
                  <button
                    type="button"
                    disabled={pending || !trainPatch.trainNo}
                    onClick={() =>
                      runAction(
                        () =>
                          updateAdminTrain(
                            trainPatch.trainNo,
                            {
                              departureTime: trainPatch.departureTime || undefined,
                              arrivalTime: trainPatch.arrivalTime || undefined,
                              travelTime: trainPatch.travelTime || undefined,
                              farePerHop:
                                trainPatch.firstClassFare && trainPatch.secondClassFare
                                  ? {
                                      FIRST_CLASS: Number.parseInt(trainPatch.firstClassFare, 10),
                                      SECOND_CLASS: Number.parseInt(trainPatch.secondClassFare, 10),
                                    }
                                  : undefined,
                            },
                            session.accessToken,
                          ).then(() => undefined),
                        "Train updated",
                      )
                    }
                    className="mt-3 rounded-xl border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
                  >
                    Update Train
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {trains.map((train) => (
                  <div key={train.trainNo} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{train.trainNo} - {train.trainName}</p>
                      <p className="text-slate-500">{train.departureTime} to {train.arrivalTime}</p>
                    </div>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => runAction(() => removeAdminTrain(train.trainNo, session.accessToken).then(() => undefined), "Train removed")}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
}
