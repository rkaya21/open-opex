"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import SuggestionStatusBadge from "@/components/SuggestionStatusBadge";
import { AuthError, authFetch } from "@/lib/auth";
import { suggestionStatusLabels, t } from "@/lib/i18n";
import type { Paginated, Suggestion, SuggestionStatus } from "@/lib/types";

const statusFilters: (SuggestionStatus | "")[] = [
  "",
  "submitted",
  "approved",
  "implemented",
  "rejected",
];

export default function SuggestionsPage() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [filter, setFilter] = useState<SuggestionStatus | "">("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const query = filter ? `?status=${filter}` : "";
      const response = await authFetch(`/api/v1/suggestions/${query}`);
      const data: Paginated<Suggestion> = await response.json();
      setSuggestions(data.results);
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.suggestions.loadFailed);
    }
  }, [filter, router]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t.suggestions.title}</h1>
          <Link
            href="/suggestions/new"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            {t.suggestions.newSuggestion}
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {statusFilters.map((status) => (
            <button
              key={status || "all"}
              onClick={() => setFilter(status)}
              className={`rounded-full border px-3 py-1 text-xs ${
                filter === status
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {status === "" ? t.suggestions.all : suggestionStatusLabels[status]}
            </button>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {suggestions === null && !error && (
          <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
        )}
        {suggestions !== null && suggestions.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">{t.suggestions.empty}</p>
        )}

        <div className="mt-4 space-y-2">
          {suggestions?.map((suggestion) => (
            <Link
              key={suggestion.id}
              href={`/suggestions/${suggestion.id}`}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-slate-300"
            >
              <div className="min-w-0 grow">
                <p className="truncate font-medium">{suggestion.title}</p>
                <p className="text-xs text-slate-500">
                  {suggestion.submitted_by_detail?.email}
                  {suggestion.process_code && ` · ${suggestion.process_code}`}
                </p>
              </div>
              <SuggestionStatusBadge status={suggestion.status} />
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
