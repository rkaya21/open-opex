"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import KpiStatusDot from "@/components/KpiStatusDot";
import KpiTrendChart from "@/components/KpiTrendChart";
import { AuthError, authFetch } from "@/lib/auth";
import { frequencyLabels, t } from "@/lib/i18n";
import type { Kpi, KpiMeasurement } from "@/lib/types";

export default function KpiDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [kpi, setKpi] = useState<Kpi | null>(null);
  const [measurements, setMeasurements] = useState<KpiMeasurement[]>([]);
  const [period, setPeriod] = useState("");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [kpiRes, measurementsRes] = await Promise.all([
        authFetch(`/api/v1/kpis/${id}/`),
        authFetch(`/api/v1/kpis/${id}/measurements/`),
      ]);
      if (!kpiRes.ok) {
        setError(t.kpis.notFound);
        return;
      }
      setKpi(await kpiRes.json());
      setMeasurements(await measurementsRes.json());
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function addMeasurement(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await authFetch(`/api/v1/kpis/${id}/measurements/`, {
        method: "PUT",
        body: JSON.stringify([{ period, value, note }]),
      });
      if (!response.ok) {
        setError(t.kpis.invalidMeasurement);
        return;
      }
      setPeriod("");
      setValue("");
      setNote("");
      await load();
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    } finally {
      setBusy(false);
    }
  }

  if (!kpi) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-4xl px-6 py-8">
          <p className="text-sm text-slate-500">{error || t.common.loading}</p>
        </main>
      </>
    );
  }

  const inputClass =
    "rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-slate-400";

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{kpi.name}</h1>
          <KpiStatusDot status={kpi.status} />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {kpi.process_code ? `${kpi.process_code} · ` : ""}
          {frequencyLabels[kpi.frequency]} ·{" "}
          {kpi.direction === "higher" ? t.kpis.higherIsBetter : t.kpis.lowerIsBetter}
          {kpi.target !== null && ` · ${t.common.target} ${kpi.target} ${kpi.unit}`}
        </p>
        {kpi.description && (
          <p className="mt-2 text-sm text-slate-600">{kpi.description}</p>
        )}

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
          {kpi.trend.length > 0 ? (
            <KpiTrendChart trend={kpi.trend} target={kpi.target} unit={kpi.unit} />
          ) : (
            <p className="text-sm text-slate-500">{t.kpis.noMeasurements}</p>
          )}
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            {t.kpis.addMeasurement}
          </h2>
          <form onSubmit={addMeasurement} className="mt-3 flex flex-wrap items-end gap-3">
            <div className="flex flex-col">
              <label className="text-xs text-slate-500">{t.kpis.period}</label>
              <input
                type="date"
                required
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-500">
                {t.kpis.value} ({kpi.unit})
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex grow flex-col">
              <label className="text-xs text-slate-500">
                {t.kpis.note} ({t.common.optional})
              </label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {busy ? t.common.saving : t.common.save}
            </button>
          </form>
          <p className="mt-2 text-xs text-slate-400">{t.kpis.overwriteHint}</p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </section>

        {measurements.length > 0 && (
          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-700">{t.kpis.history}</h2>
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-1">{t.kpis.period}</th>
                  <th className="py-1">{t.kpis.value}</th>
                  <th className="py-1">{t.kpis.note}</th>
                </tr>
              </thead>
              <tbody>
                {[...measurements].reverse().map((m) => (
                  <tr key={m.id} className="border-t border-slate-100">
                    <td className="py-1.5">{m.period}</td>
                    <td className="py-1.5 font-medium">
                      {m.value} {kpi.unit}
                    </td>
                    <td className="py-1.5 text-slate-500">{m.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </>
  );
}
