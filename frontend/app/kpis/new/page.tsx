"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { AuthError, authFetch } from "@/lib/auth";
import { t } from "@/lib/i18n";
import type { Kpi, KpiTemplate, Paginated, Process } from "@/lib/types";

export default function NewKpiPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<KpiTemplate[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [values, setValues] = useState({
    name: "",
    description: "",
    unit: "",
    direction: "higher" as "higher" | "lower",
    frequency: "monthly" as "daily" | "weekly" | "monthly",
    process: "" as number | "",
    target: "",
    tolerance_percent: 5,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      authFetch("/api/v1/kpis/templates/").then((r) => r.json()),
      authFetch("/api/v1/processes/?page_size=200").then((r) => r.json()),
    ])
      .then(([templateList, processData]: [KpiTemplate[], Paginated<Process>]) => {
        setTemplates(templateList);
        setProcesses(processData.results);
      })
      .catch((err) => {
        if (err instanceof AuthError) {
          router.push("/login");
          return;
        }
        setError(t.kpis.templatesLoadFailed);
      });
  }, [router]);

  function applyTemplate(key: string) {
    const template = templates.find((t) => t.key === key);
    if (!template) return;
    setValues((prev) => ({
      ...prev,
      name: template.name,
      description: template.description,
      unit: template.unit,
      direction: template.direction,
      frequency: template.frequency,
    }));
  }

  function set<K extends keyof typeof values>(key: K, val: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await authFetch("/api/v1/kpis/", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          process: values.process === "" ? null : values.process,
          target: values.target === "" ? null : values.target,
        }),
      });
      if (!response.ok) {
        const body = await response.json();
        const first = Object.entries(body)[0];
        setError(first ? `${first[0]}: ${first[1]}` : t.kpis.saveFailed);
        return;
      }
      const saved: Kpi = await response.json();
      router.push(`/kpis/${saved.id}`);
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.kpis.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-slate-400";

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-2xl font-bold">{t.kpis.newTitle}</h1>

        {templates.length > 0 && (
          <div className="mt-4">
            <label className="text-sm font-medium">{t.kpis.fromTemplate}</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {templates.map((template) => (
                <button
                  key={template.key}
                  type="button"
                  onClick={() => applyTemplate(template.key)}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs hover:bg-slate-100"
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">{t.kpis.name}</label>
              <input
                required
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t.kpis.unit}</label>
              <input
                required
                placeholder={t.kpis.unitPlaceholder}
                value={values.unit}
                onChange={(e) => set("unit", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t.kpis.direction}</label>
              <select
                value={values.direction}
                onChange={(e) => set("direction", e.target.value as "higher" | "lower")}
                className={inputClass}
              >
                <option value="higher">{t.kpis.directionHigher}</option>
                <option value="lower">{t.kpis.directionLower}</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">{t.kpis.frequency}</label>
              <select
                value={values.frequency}
                onChange={(e) =>
                  set("frequency", e.target.value as "daily" | "weekly" | "monthly")
                }
                className={inputClass}
              >
                <option value="daily">Günlük</option>
                <option value="weekly">Haftalık</option>
                <option value="monthly">Aylık</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">{t.kpis.targetLabel}</label>
              <input
                type="number"
                step="0.01"
                value={values.target}
                onChange={(e) => set("target", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t.kpis.tolerance}</label>
              <input
                type="number"
                min={0}
                max={100}
                value={values.tolerance_percent}
                onChange={(e) => set("tolerance_percent", Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">{t.kpis.linkedProcess}</label>
            <select
              value={values.process}
              onChange={(e) =>
                set("process", e.target.value === "" ? "" : Number(e.target.value))
              }
              className={inputClass}
            >
              <option value="">{t.kpis.noProcess}</option>
              {processes.map((process) => (
                <option key={process.id} value={process.id}>
                  {process.code} — {process.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">{t.kpis.description}</label>
            <textarea
              rows={2}
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              className={inputClass}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {busy ? t.common.saving : t.kpis.createSubmit}
          </button>
        </form>
      </main>
    </>
  );
}
