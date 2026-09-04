"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CategoryChip from "@/components/CategoryChip";
import Nav from "@/components/Nav";
import { useToast } from "@/components/Toast";
import SuggestionStatusBadge from "@/components/SuggestionStatusBadge";
import { AuthError, authFetch } from "@/lib/auth";
import { t } from "@/lib/i18n";
import type { Suggestion } from "@/lib/types";

export default function SuggestionDetailPage() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await authFetch(`/api/v1/suggestions/${id}/`);
      if (!response.ok) {
        setError(t.suggestions.notFound);
        return;
      }
      setSuggestion(await response.json());
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(name: "approve" | "reject" | "implement") {
    setBusy(true);
    setError("");
    try {
      const response = await authFetch(`/api/v1/suggestions/${id}/${name}/`, {
        method: "POST",
        body: JSON.stringify(name === "implement" ? {} : { note }),
      });
      const body = await response.json();
      if (!response.ok) {
        toast.error(body.detail ?? t.suggestions.actionFailed);
        return;
      }
      setSuggestion(body);
      setNote("");
      toast.success(t.common.updated);
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    } finally {
      setBusy(false);
    }
  }

  if (!suggestion) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-3xl px-6 py-8">
          <p className="text-sm text-slate-500">{error || t.common.loading}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{suggestion.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {t.suggestions.ideaGiver}: {suggestion.submitted_by_detail?.email}
              {suggestion.process_code && ` · ${suggestion.process_code}`}
            </p>
            <div className="mt-2">
              <CategoryChip category={suggestion.category} />
            </div>
          </div>
          <SuggestionStatusBadge status={suggestion.status} />
        </div>

        {suggestion.description && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">
            {suggestion.description}
          </p>
        )}

        {(suggestion.problem || suggestion.solution) && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {suggestion.problem && (
              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-slate-700">
                  {t.suggestions.problem}
                </h2>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                  {suggestion.problem}
                </p>
              </section>
            )}
            {suggestion.solution && (
              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-slate-700">
                  {t.suggestions.solution}
                </h2>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                  {suggestion.solution}
                </p>
              </section>
            )}
          </div>
        )}

        {(suggestion.estimated_cost || suggestion.estimated_benefit) && (
          <div className="mt-4 flex flex-wrap gap-6 text-sm">
            {suggestion.estimated_cost && (
              <p>
                <span className="text-slate-500">{t.suggestions.estimatedCost}:</span>{" "}
                <span className="font-semibold">${suggestion.estimated_cost}</span>
                {suggestion.cost_note && (
                  <span className="text-slate-500"> — {suggestion.cost_note}</span>
                )}
              </p>
            )}
            {suggestion.estimated_benefit && (
              <p>
                <span className="text-slate-500">
                  {t.suggestions.estimatedBenefit}:
                </span>{" "}
                <span className="font-semibold">${suggestion.estimated_benefit}</span>
                {suggestion.benefit_note && (
                  <span className="text-slate-500"> — {suggestion.benefit_note}</span>
                )}
              </p>
            )}
          </div>
        )}

        {suggestion.evaluation_note && (
          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-700">
              {t.suggestions.evaluationNote}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{suggestion.evaluation_note}</p>
            {suggestion.evaluated_by_detail && (
              <p className="mt-2 text-xs text-slate-400">
                {t.suggestions.evaluatedBy}: {suggestion.evaluated_by_detail.email}
              </p>
            )}
          </section>
        )}

        {suggestion.status === "submitted" && (
          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.suggestions.notePlaceholder}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => act("approve")}
                disabled={busy}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {t.suggestions.approve}
              </button>
              <button
                onClick={() => act("reject")}
                disabled={busy}
                className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {t.suggestions.reject}
              </button>
            </div>
          </section>
        )}

        {suggestion.status === "approved" && (
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => act("implement")}
              disabled={busy}
              className="rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {t.suggestions.implement}
            </button>
            <Link
              href={`/projects/new?suggestion=${suggestion.id}`}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
            >
              {t.suggestions.toProject}
            </Link>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </main>
    </>
  );
}
