"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import KpiStatusDot from "@/components/KpiStatusDot";
import KpiTrendChart from "@/components/KpiTrendChart";
import { AuthError, authFetch } from "@/lib/auth";
import { frequencyLabels, t } from "@/lib/i18n";
import type { Kpi } from "@/lib/types";

export default function KpiDashboardPage() {
  const router = useRouter();
  const [kpis, setKpis] = useState<Kpi[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await authFetch("/api/v1/kpis/dashboard/");
      setKpis(await response.json());
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.kpis.loadFailed);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t.kpis.title}</h1>
          <Link
            href="/kpis/new"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            {t.kpis.newKpi}
          </Link>
        </div>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {kpis === null && !error && (
          <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
        )}
        {kpis !== null && kpis.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">{t.kpis.empty}</p>
        )}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {kpis?.map((kpi) => (
            <Link
              key={kpi.id}
              href={`/kpis/${kpi.id}`}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">{kpi.name}</h2>
                <KpiStatusDot status={kpi.status} />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {kpi.process_code ? `${kpi.process_code} · ` : ""}
                {frequencyLabels[kpi.frequency]}
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {kpi.latest_value ?? "—"}
                </span>
                <span className="text-sm text-slate-500">{kpi.unit}</span>
                {kpi.target !== null && (
                  <span className="ml-auto text-xs text-slate-400">
                    {t.common.target} {kpi.target}
                  </span>
                )}
              </div>
              {kpi.trend.length > 1 && (
                <div className="mt-2">
                  <KpiTrendChart
                    trend={kpi.trend}
                    target={null}
                    unit={kpi.unit}
                    height={64}
                  />
                </div>
              )}
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
