"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { AuthError, authFetch } from "@/lib/auth";
import { t } from "@/lib/i18n";
import type { Paginated, Process, Suggestion } from "@/lib/types";

export default function NewSuggestionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [processId, setProcessId] = useState<number | "">("");
  const [processes, setProcesses] = useState<Process[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    authFetch("/api/v1/processes/?page_size=200")
      .then((r) => r.json())
      .then((data: Paginated<Process>) => setProcesses(data.results))
      .catch((err) => {
        if (err instanceof AuthError) router.push("/login");
      });
  }, [router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await authFetch("/api/v1/suggestions/", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          process: processId === "" ? null : processId,
        }),
      });
      if (!response.ok) {
        setError(t.suggestions.saveFailed);
        return;
      }
      const saved: Suggestion = await response.json();
      router.push(`/suggestions/${saved.id}`);
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.suggestions.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-slate-400";

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="text-2xl font-bold">{t.suggestions.newSuggestion}</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="text-sm font-medium">{t.suggestions.formTitle}</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              {t.suggestions.formDescription}
            </label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              {t.suggestions.relatedProcess}
            </label>
            <select
              value={processId}
              onChange={(e) =>
                setProcessId(e.target.value === "" ? "" : Number(e.target.value))
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {busy ? t.common.saving : t.suggestions.submit}
          </button>
        </form>
      </main>
    </>
  );
}
