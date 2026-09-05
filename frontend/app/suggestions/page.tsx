"use client";

import { useState } from "react";
import CategoryChip from "@/components/CategoryChip";
import ListShell from "@/components/ListShell";
import Nav from "@/components/Nav";
import RecordCard from "@/components/RecordCard";
import { ListSkeleton } from "@/components/Skeleton";
import SuggestionStatusBadge from "@/components/SuggestionStatusBadge";
import { locale, suggestionStatusLabels, t } from "@/lib/i18n";
import { usePaginatedList } from "@/lib/usePaginatedList";
import type { Suggestion, SuggestionCategory, SuggestionStatus } from "@/lib/types";

export default function SuggestionsPage() {
  const [filter, setFilter] = useState<SuggestionStatus | "">("");
  const [category, setCategory] = useState<SuggestionCategory>("");
  const filterQuery = new URLSearchParams({
    ...(filter ? { status: filter } : {}),
    ...(category ? { category } : {}),
  }).toString();
  const {
    items: suggestions,
    count,
    failed,
    page,
    setPage,
    pageCount,
    search,
    setSearch,
  } = usePaginatedList<Suggestion>("/api/v1/suggestions/", filterQuery);

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
        search={search}
        onSearchChange={setSearch}
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
      >
        {failed && <p className="text-sm text-red-600">{t.suggestions.loadFailed}</p>}
        {suggestions === null && !failed && <ListSkeleton />}
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
