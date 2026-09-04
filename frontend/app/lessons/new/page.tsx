"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft } from "lucide-react";
import LessonCategoryChip from "@/components/LessonCategoryChip";
import Nav from "@/components/Nav";
import { AuthError, authFetch, getStoredEmail } from "@/lib/auth";
import { t } from "@/lib/i18n";
import type { LessonCategory, OnePointLesson, TenantUser } from "@/lib/types";

const categoryKeys = Object.keys(t.lessons.categories) as LessonCategory[];

export default function NewLessonPage() {
  const router = useRouter();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [form, setForm] = useState({
    trainer: "" as number | "",
    category: "quality" as LessonCategory,
    topic: "",
    content: "",
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    duration_minutes: 15,
    participants: [] as number[],
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    authFetch("/api/v1/users/")
      .then((r) => r.json())
      .then(setUsers)
      .catch((err) => {
        if (err instanceof AuthError) router.push("/login");
      });
  }, [router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await authFetch("/api/v1/lessons/", {
        method: "POST",
        body: JSON.stringify({
          trainer: form.trainer === "" ? null : form.trainer,
          category: form.category,
          topic: form.topic,
          content: form.content,
          held_at: new Date(`${form.date}T${form.time}`).toISOString(),
          duration_minutes: form.duration_minutes,
          participants: form.participants,
        }),
      });
      if (!response.ok) {
        setError(t.lessons.saveFailed);
        return;
      }
      const saved: OnePointLesson = await response.json();
      router.push(`/lessons/${saved.id}`);
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.lessons.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-slate-400";

  return (
    <>
      <Nav />
      <main className="max-w-3xl px-8 py-8">
        <div className="relative flex items-center justify-center">
          <Link href="/lessons" className="absolute left-0 text-slate-600">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-xl font-bold">{t.lessons.newTitle}</h1>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            form="new-lesson"
            disabled={busy}
            className="flex items-center gap-2 text-sm font-semibold text-blue-800 hover:text-blue-600 disabled:opacity-50"
          >
            <ArrowRight className="h-4 w-4" />
            {busy ? t.common.saving : t.common.send}
          </button>
        </div>

        <form id="new-lesson" onSubmit={handleSubmit} className="mt-4 space-y-5">
          <div>
            <label className="text-sm font-medium">{t.lessons.trainer}</label>
            <select
              value={form.trainer}
              onChange={(e) =>
                setForm({
                  ...form,
                  trainer: e.target.value === "" ? "" : Number(e.target.value),
                })
              }
              className={inputClass}
            >
              <option value="">{getStoredEmail() ?? "—"}</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium">{t.lessons.date}</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t.lessons.time}</label>
              <input
                type="time"
                required
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t.lessons.duration}</label>
              <input
                type="number"
                min={1}
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm({ ...form, duration_minutes: Number(e.target.value) })
                }
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">{t.lessons.participants}</label>
            <select
              multiple
              size={4}
              value={form.participants.map(String)}
              onChange={(e) =>
                setForm({
                  ...form,
                  participants: Array.from(e.target.selectedOptions).map((option) =>
                    Number(option.value),
                  ),
                })
              }
              className={inputClass}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">{t.lessons.participantsHint}</p>
          </div>

          <div>
            <label className="text-sm font-medium">{t.lessons.category}</label>
            <div className="flex items-center gap-3">
              <select
                required
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as LessonCategory })
                }
                className={inputClass}
              >
                {categoryKeys.map((key) => (
                  <option key={key} value={key}>
                    {t.lessons.categories[key]}
                  </option>
                ))}
              </select>
              <LessonCategoryChip category={form.category} label="" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">{t.lessons.topic}</label>
            <input
              required
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-sm font-medium">{t.lessons.content}</label>
            <textarea
              rows={5}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className={inputClass}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </main>
    </>
  );
}
