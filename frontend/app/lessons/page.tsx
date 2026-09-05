"use client";

import { useState } from "react";
import LessonCategoryChip from "@/components/LessonCategoryChip";
import ListShell from "@/components/ListShell";
import Nav from "@/components/Nav";
import RecordCard from "@/components/RecordCard";
import { ListSkeleton } from "@/components/Skeleton";
import { locale, t } from "@/lib/i18n";
import { usePaginatedList } from "@/lib/usePaginatedList";
import type { LessonCategory, OnePointLesson } from "@/lib/types";

export default function LessonsPage() {
  const [category, setCategory] = useState<LessonCategory | "">("");
  const {
    items: lessons,
    count,
    failed,
    page,
    setPage,
    pageCount,
    search,
    setSearch,
  } = usePaginatedList<OnePointLesson>(
    "/api/v1/lessons/",
    category ? `category=${category}` : "",
  );

  const filters = (
    <div>
      <label className="text-xs text-slate-500">{t.lessons.category}</label>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as LessonCategory | "")}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="">{t.lessons.all}</option>
        {(Object.keys(t.lessons.categories) as LessonCategory[]).map((key) => (
          <option key={key} value={key}>
            {t.lessons.categories[key]}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      <Nav />
      <ListShell
        title={t.lessons.title}
        count={count}
        filters={filters}
        onFilterReset={() => setCategory("")}
        fabHref="/lessons/new"
        search={search}
        onSearchChange={setSearch}
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
      >
        {failed && <p className="text-sm text-red-600">{t.lessons.loadFailed}</p>}
        {lessons === null && !failed && <ListSkeleton />}
        {lessons !== null && lessons.length === 0 && (
          <p className="text-center text-sm text-slate-500">{t.lessons.empty}</p>
        )}
        {lessons?.map((lesson, index) => (
          <RecordCard
            key={lesson.id}
            href={`/lessons/${lesson.id}`}
            index={index + 1}
            title={lesson.topic}
            accent="border-l-green-500"
            leftMeta={[
              `${t.common.recordNo}: ${lesson.id}`,
              `${t.lessons.trainer}: ${lesson.trainer_email ?? "—"}`,
            ]}
            rightMeta={[
              new Date(lesson.held_at).toLocaleString(
                locale === "tr" ? "tr-TR" : "en-US",
                { dateStyle: "long", timeStyle: "short" },
              ),
              `${lesson.duration_minutes} dk · ${lesson.participant_emails.length} katılımcı`,
            ]}
            footerRight={
              <LessonCategoryChip
                category={lesson.category}
                label={lesson.category_label}
              />
            }
          />
        ))}
      </ListShell>
    </>
  );
}
