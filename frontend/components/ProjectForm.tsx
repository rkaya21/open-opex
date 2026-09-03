"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthError, authFetch } from "@/lib/auth";
import { t } from "@/lib/i18n";
import type { ImprovementProject, Kpi, Paginated, Process } from "@/lib/types";

interface Props {
  project?: ImprovementProject; // absent → create mode
  initialSuggestionId?: number;
}

const a3Fields = [
  "a3_background",
  "a3_current_state",
  "a3_goal",
  "a3_root_cause",
  "a3_countermeasures",
  "a3_follow_up",
] as const;

export default function ProjectForm({ project, initialSuggestionId }: Props) {
  const router = useRouter();
  const [values, setValues] = useState({
    title: project?.title ?? "",
    description: project?.description ?? "",
    process: project?.process ?? ("" as number | ""),
    kpi: project?.kpi ?? ("" as number | ""),
    expected_benefit: project?.expected_benefit ?? "",
    realized_benefit: project?.realized_benefit ?? "",
    a3_background: project?.a3_background ?? "",
    a3_current_state: project?.a3_current_state ?? "",
    a3_goal: project?.a3_goal ?? "",
    a3_root_cause: project?.a3_root_cause ?? "",
    a3_countermeasures: project?.a3_countermeasures ?? "",
    a3_follow_up: project?.a3_follow_up ?? "",
  });
  const [processes, setProcesses] = useState<Process[]>([]);
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      authFetch("/api/v1/processes/?page_size=200").then((r) => r.json()),
      authFetch("/api/v1/kpis/?page_size=200").then((r) => r.json()),
    ])
      .then(([processData, kpiData]: [Paginated<Process>, Paginated<Kpi>]) => {
        setProcesses(processData.results);
        setKpis(kpiData.results);
      })
      .catch((err) => {
        if (err instanceof AuthError) router.push("/login");
      });
  }, [router]);

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const payload = {
      ...values,
      process: values.process === "" ? null : values.process,
      kpi: values.kpi === "" ? null : values.kpi,
      expected_benefit: values.expected_benefit === "" ? null : values.expected_benefit,
      realized_benefit: values.realized_benefit === "" ? null : values.realized_benefit,
      ...(project ? {} : { suggestion: initialSuggestionId ?? null }),
    };
    try {
      const response = await authFetch(
        project ? `/api/v1/projects/${project.id}/` : "/api/v1/projects/",
        { method: project ? "PATCH" : "POST", body: JSON.stringify(payload) },
      );
      if (!response.ok) {
        setError(t.projects.saveFailed);
        return;
      }
      const saved: ImprovementProject = await response.json();
      router.push(`/projects/${saved.id}`);
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.projects.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-slate-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-sm font-medium">{t.projects.formTitle}</label>
        <input
          required
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="text-sm font-medium">{t.projects.formDescription}</label>
        <textarea
          rows={2}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">{t.projects.relatedProcess}</label>
          <select
            value={values.process}
            onChange={(e) =>
              set("process", e.target.value === "" ? "" : Number(e.target.value))
            }
            className={inputClass}
          >
            <option value="">{t.projects.none}</option>
            {processes.map((process) => (
              <option key={process.id} value={process.id}>
                {process.code} — {process.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">{t.projects.targetKpi}</label>
          <select
            value={values.kpi}
            onChange={(e) =>
              set("kpi", e.target.value === "" ? "" : Number(e.target.value))
            }
            className={inputClass}
          >
            <option value="">{t.projects.none}</option>
            {kpis.map((kpi) => (
              <option key={kpi.id} value={kpi.id}>
                {kpi.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">{t.projects.expectedBenefit}</label>
          <input
            type="number"
            step="0.01"
            value={values.expected_benefit ?? ""}
            onChange={(e) => set("expected_benefit", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t.projects.realizedBenefit}</label>
          <input
            type="number"
            step="0.01"
            value={values.realized_benefit ?? ""}
            onChange={(e) => set("realized_benefit", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <fieldset className="rounded-lg border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold">{t.projects.a3.title}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {a3Fields.map((field) => (
            <div key={field}>
              <label className="text-sm font-medium">
                {t.projects.a3[field.replace("a3_", "") as keyof typeof t.projects.a3]}
              </label>
              <textarea
                rows={3}
                value={values[field]}
                onChange={(e) => set(field, e.target.value)}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </fieldset>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {busy
          ? t.common.saving
          : project
            ? t.projects.saveSubmit
            : t.projects.createSubmit}
      </button>
    </form>
  );
}
