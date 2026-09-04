"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, Tag, User, Users } from "lucide-react";
import Nav from "@/components/Nav";
import { AuthError, authFetch } from "@/lib/auth";
import { locale, t } from "@/lib/i18n";
import type { OnePointLesson } from "@/lib/types";

export default function LessonDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<OnePointLesson | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await authFetch(`/api/v1/lessons/${id}/`);
      if (!response.ok) {
        setError(t.lessons.notFound);
        return;
      }
      setLesson(await response.json());
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  if (!lesson) {
    return (
      <>
        <Nav />
        <main className="px-8 py-8">
          <p className="text-sm text-slate-500">{error || t.common.loading}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="max-w-3xl px-8 py-8">
        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          {lesson.category_label}
        </span>
        <h1 className="mt-2 text-2xl font-bold">{lesson.topic}</h1>

        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
          <span className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            {lesson.trainer_email ?? "—"}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {new Date(lesson.held_at).toLocaleString(
              locale === "tr" ? "tr-TR" : "en-US",
              { dateStyle: "long", timeStyle: "short" },
            )}{" "}
            · {lesson.duration_minutes} dk
          </span>
          {lesson.process_code && (
            <span className="flex items-center gap-1.5">
              <Tag className="h-4 w-4" />
              {lesson.process_code}
            </span>
          )}
        </div>

        {lesson.content && (
          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-700">
              {t.lessons.content}
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
              {lesson.content}
            </p>
          </section>
        )}

        <section className="mt-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Users className="h-4 w-4" />
            {t.lessons.participants} ({lesson.participant_emails.length})
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {lesson.participant_emails.map((email) => (
              <li
                key={email}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
              >
                {email}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
