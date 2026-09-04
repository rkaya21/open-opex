"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LessonCategoryChip from "@/components/LessonCategoryChip";
import ListShell from "@/components/ListShell";
import Nav from "@/components/Nav";
import { ListSkeleton } from "@/components/Skeleton";
import RecordCard from "@/components/RecordCard";
import { AuthError, authFetch } from "@/lib/auth";
import { locale, t } from "@/lib/i18n";
import type { LessonCategory, OnePointLesson, Paginated } from "@/lib/types";

export default function LessonsPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<OnePointLesson[] | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [category, setCategory] = useState<LessonCategory | "">("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const query = category ? `?category=${category}` : "";
      const response = await authFetch(`/api/v1/lessons/${query}`);
      const data: Paginated<OnePointLesson> = await response.json();
      setLessons(data.results);
      setCount(data.count);
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.lessons.loadFailed);
    }
  }, [category, router]);

  useEffect(() => {
    load();
  }, [load]);

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
      >
        {error && <p className="text-sm text-red-600">{error}</p>}
        {lessons === null && !error && (
          <ListSkeleton />
        )}
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
