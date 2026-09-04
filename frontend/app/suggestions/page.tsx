"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CategoryChip from "@/components/CategoryChip";
import ListShell from "@/components/ListShell";
import Nav from "@/components/Nav";
import RecordCard from "@/components/RecordCard";
import SuggestionStatusBadge from "@/components/SuggestionStatusBadge";
import { AuthError, authFetch } from "@/lib/auth";
import { locale, suggestionStatusLabels, t } from "@/lib/i18n";
import type {
  Paginated,
  Suggestion,
  SuggestionCategory,
  SuggestionStatus,
} from "@/lib/types";

export default function SuggestionsPage() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [filter, setFilter] = useState<SuggestionStatus | "">("");
  const [category, setCategory] = useState<SuggestionCategory>("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      if (category) params.set("category", category);
      const query = params.size ? `?${params}` : "";
      const response = await authFetch(`/api/v1/suggestions/${query}`);
      const data: Paginated<Suggestion> = await response.json();
      setSuggestions(data.results);
      setCount(data.count);
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.suggestions.loadFailed);
    }
  }, [filter, category, router]);

  useEffect(() => {
    load();
  }, [load]);

  const filters = (
    <>
      <div>
        <label className="text-xs text-slate-500">{t.common.status}</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as SuggestionStatus | "")}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">{t.suggestions.all}</option>
          {(Object.keys(suggestionStatusLabels) as SuggestionStatus[]).map((status) => (
            <option key={status} value={status}>
              {suggestionStatusLabels[status]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs text-slate-500">{t.suggestions.category}</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as SuggestionCategory)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">{t.suggestions.all}</option>
          {(
            Object.keys(t.suggestions.categories) as Exclude<SuggestionCategory, "">[]
          ).map((key) => (
            <option key={key} value={key}>
              {t.suggestions.categories[key]}
            </option>
          ))}
        </select>
      </div>
    </>
  );

  return (
    <>
      <Nav />
      <ListShell
        title={t.suggestions.title}
        count={count}
        filters={filters}
        onFilterReset={() => {
          setFilter("");
          setCategory("");
        }}
        fabHref="/suggestions/new"
      >
        {error && <p className="text-sm text-red-600">{error}</p>}
        {suggestions === null && !error && (
          <p className="text-sm text-slate-500">{t.common.loading}</p>
        )}
        {suggestions !== null && suggestions.length === 0 && (
          <p className="text-center text-sm text-slate-500">{t.suggestions.empty}</p>
        )}
        {suggestions?.map((suggestion, index) => (
          <RecordCard
            key={suggestion.id}
            href={`/suggestions/${suggestion.id}`}
            index={index + 1}
            title={suggestion.title}
            accent="border-l-violet-400"
            leftMeta={[
              `${t.common.recordNo}: ${suggestion.id}`,
              `${t.suggestions.ideaGiver}: ${
                suggestion.submitted_by_detail?.email ?? "—"
              }`,
            ]}
            rightMeta={[
              new Date(suggestion.created_at).toLocaleString(
                locale === "tr" ? "tr-TR" : "en-US",
                { dateStyle: "long", timeStyle: "short" },
              ),
            ]}
            rightExtra={<CategoryChip category={suggestion.category} />}
            footerRight={<SuggestionStatusBadge status={suggestion.status} />}
          />
        ))}
      </ListShell>
    </>
  );
}
