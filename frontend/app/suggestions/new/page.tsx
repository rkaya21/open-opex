"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, Info } from "lucide-react";
import Nav from "@/components/Nav";
import SuggestionInfoModal from "@/components/SuggestionInfoModal";
import { AuthError, authFetch, getStoredEmail } from "@/lib/auth";
import { locale, t } from "@/lib/i18n";
import type {
  Paginated,
  Process,
  Suggestion,
  SuggestionCategory,
} from "@/lib/types";

const categoryKeys = Object.keys(t.suggestions.categories) as Exclude<
  SuggestionCategory,
  ""
>[];

export default function NewSuggestionPage() {
  const router = useRouter();
  const [showInfo, setShowInfo] = useState(true); // bilgilendirme kartı açılışta
  const [processes, setProcesses] = useState<Process[]>([]);
  const [form, setForm] = useState({
    title: "",
    category: "" as SuggestionCategory,
    problem: "",
    solution: "",
    estimated_cost: "",
    cost_note: "",
    estimated_benefit: "",
    benefit_note: "",
    process: "" as number | "",
  });
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
          ...form,
          process: form.process === "" ? null : form.process,
          estimated_cost: form.estimated_cost === "" ? null : form.estimated_cost,
          estimated_benefit:
            form.estimated_benefit === "" ? null : form.estimated_benefit,
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
    "w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-slate-400";
  const labelClass = "text-xs font-medium text-slate-600";

  return (
    <>
      <Nav />
      {showInfo && <SuggestionInfoModal onClose={() => setShowInfo(false)} />}
      <main className="max-w-5xl px-8 py-6">
        <div className="relative flex items-center justify-center">
          <Link href="/suggestions" className="absolute left-0 text-slate-600">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-xl font-bold">{t.suggestions.newIdeaTitle}</h1>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowInfo(true)}
            className="text-blue-800 hover:text-blue-600"
          >
            <Info className="h-5 w-5" />
          </button>
          <button
            type="submit"
            form="new-suggestion"
            disabled={busy}
            className="flex items-center gap-2 text-sm font-semibold text-blue-800 hover:text-blue-600 disabled:opacity-50"
          >
            <ArrowRight className="h-4 w-4" />
            {busy ? t.common.saving : t.common.send}
          </button>
        </div>

        <form id="new-suggestion" onSubmit={handleSubmit} className="mt-3 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>{t.suggestions.ideaGiver}</label>
              <input
                disabled
                value={getStoredEmail() ?? ""}
                className={`${inputClass} bg-slate-50 text-slate-500`}
              />
            </div>
            <div>
              <label className={labelClass}>{t.suggestions.ideaDate}</label>
              <input
                disabled
                value={new Date().toLocaleString(
                  locale === "tr" ? "tr-TR" : "en-US",
                  { dateStyle: "long", timeStyle: "short" },
                )}
                className={`${inputClass} bg-slate-50 text-slate-500`}
              />
            </div>
            <div>
              <label className={labelClass}>{t.suggestions.category}</label>
              <select
                required
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as SuggestionCategory })
                }
                className={inputClass}
              >
                <option value="">—</option>
                {categoryKeys.map((key) => (
                  <option key={key} value={key}>
                    {t.suggestions.categories[key]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className={labelClass}>{t.suggestions.topic}</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t.suggestions.relatedProcess}</label>
              <select
                value={form.process}
                onChange={(e) =>
                  setForm({
                    ...form,
                    process: e.target.value === "" ? "" : Number(e.target.value),
                  })
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>{t.suggestions.problem}</label>
              <textarea
                required
                rows={5}
                value={form.problem}
                onChange={(e) => setForm({ ...form, problem: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t.suggestions.solution}</label>
              <textarea
                required
                rows={5}
                value={form.solution}
                onChange={(e) => setForm({ ...form, solution: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className={labelClass}>{t.suggestions.estimatedCost} (USD)</label>
              <input
                type="number"
                step="0.01"
                value={form.estimated_cost}
                onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t.suggestions.costNote}</label>
              <input
                value={form.cost_note}
                onChange={(e) => setForm({ ...form, cost_note: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                {t.suggestions.estimatedBenefit} (USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.estimated_benefit}
                onChange={(e) =>
                  setForm({ ...form, estimated_benefit: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t.suggestions.benefitNote}</label>
              <input
                value={form.benefit_note}
                onChange={(e) => setForm({ ...form, benefit_note: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </main>
    </>
  );
}
