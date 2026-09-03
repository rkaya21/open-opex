"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthError, authFetch } from "@/lib/auth";
import { t } from "@/lib/i18n";
import type { Paginated, Process } from "@/lib/types";

interface Props {
  process?: Process; // absent → create mode
}

const sipocFields = [
  ["suppliers", t.processes.sipoc.suppliers],
  ["inputs", t.processes.sipoc.inputs],
  ["steps", t.processes.sipoc.steps],
  ["outputs", t.processes.sipoc.outputs],
  ["customers", t.processes.sipoc.customers],
] as const;

export default function ProcessForm({ process }: Props) {
  const router = useRouter();
  const [values, setValues] = useState({
    name: process?.name ?? "",
    code: process?.code ?? "",
    parent: process?.parent ?? ("" as number | ""),
    purpose: process?.purpose ?? "",
    suppliers: process?.suppliers ?? "",
    inputs: process?.inputs ?? "",
    steps: process?.steps ?? "",
    outputs: process?.outputs ?? "",
    customers: process?.customers ?? "",
  });
  const [candidates, setCandidates] = useState<Process[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    authFetch("/api/v1/processes/?page_size=200")
      .then((r) => r.json())
      .then((data: Paginated<Process>) =>
        setCandidates(data.results.filter((p) => p.id !== process?.id)),
      )
      .catch((err) => {
        if (err instanceof AuthError) {
          router.push("/login");
          return;
        }
        setError(t.processes.parentsLoadFailed);
      });
  }, [process?.id, router]);

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const payload = { ...values, parent: values.parent === "" ? null : values.parent };
    try {
      const response = await authFetch(
        process ? `/api/v1/processes/${process.id}/` : "/api/v1/processes/",
        {
          method: process ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) {
        const body = await response.json();
        const first = Object.entries(body)[0];
        setError(first ? `${first[0]}: ${first[1]}` : t.processes.saveFailed);
        return;
      }
      const saved: Process = await response.json();
      router.push(`/processes/${saved.id}`);
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.processes.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-slate-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">{t.processes.name}</label>
          <input
            required
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t.processes.code}</label>
          <input
            required
            placeholder="PR-001"
            value={values.code}
            onChange={(e) => set("code", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">{t.processes.parent}</label>
        <select
          value={values.parent}
          onChange={(e) => set("parent", e.target.value === "" ? "" : Number(e.target.value))}
          className={inputClass}
        >
          <option value="">{t.processes.noParent}</option>
          {candidates.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.code} — {candidate.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">{t.processes.purpose}</label>
        <textarea
          rows={2}
          value={values.purpose}
          onChange={(e) => set("purpose", e.target.value)}
          className={inputClass}
        />
      </div>
      <fieldset className="rounded-lg border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold">SIPOC</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {sipocFields.map(([key, label]) => (
            <div key={key} className={key === "steps" ? "sm:col-span-2" : ""}>
              <label className="text-sm font-medium">{label}</label>
              <textarea
                rows={key === "steps" ? 4 : 2}
                value={values[key]}
                onChange={(e) => set(key, e.target.value)}
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
          : process
            ? t.processes.saveSubmit
            : t.processes.createSubmit}
      </button>
    </form>
  );
}
