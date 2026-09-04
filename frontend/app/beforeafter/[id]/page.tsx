"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { AuthError, authFetch } from "@/lib/auth";
import { locale, t } from "@/lib/i18n";
import type { BeforeAfterForm } from "@/lib/types";

function Gallery({
  label,
  headerClass,
  photos,
  note,
}: {
  label: string;
  headerClass: string;
  photos: { id: number; image: string }[];
  note: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className={`px-5 py-2.5 text-sm font-bold text-white ${headerClass}`}>
        {label}
      </div>
      <div className="p-4">
        {photos.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {photos.map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                src={photo.image}
                alt=""
                className="h-28 w-28 rounded-md object-cover"
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">—</p>
        )}
        {note && (
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{note}</p>
        )}
      </div>
    </div>
  );
}

export default function BeforeAfterDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<BeforeAfterForm | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await authFetch(`/api/v1/beforeafter/${id}/`);
      if (!response.ok) {
        setError(t.beforeAfter.notFound);
        return;
      }
      setForm(await response.json());
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  if (!form) {
    return (
      <>
        <Nav />
        <main className="px-8 py-8">
          <p className="text-sm text-slate-500">{error || t.common.loading}</p>
        </main>
      </>
    );
  }

  const before = form.photos.filter((p) => p.kind === "before");
  const after = form.photos.filter((p) => p.kind === "after");
  const fmt = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
          dateStyle: "long",
        })
      : "—";

  return (
    <>
      <Nav />
      <main className="max-w-3xl px-8 py-8">
        {form.category_label && (
          <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
            {form.category_label}
          </span>
        )}
        <h1 className="mt-2 text-xl font-bold">{form.problem || `#${form.id}`}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {fmt(form.start_date)} — {fmt(form.end_date)} · {form.created_by_email}
        </p>

        <div className="mt-6 space-y-4">
          <Gallery
            label={t.beforeAfter.before}
            headerClass="bg-slate-600"
            photos={before}
            note={form.before_note}
          />
          <Gallery
            label={t.beforeAfter.after}
            headerClass="bg-blue-800"
            photos={after}
            note={form.after_note}
          />
        </div>

        {(form.cost || form.one_time_gain || form.gain_category_label) && (
          <section className="mt-6 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 sm:grid-cols-2">
            {form.cost && (
              <p className="text-sm">
                <span className="text-slate-500">{t.beforeAfter.cost}:</span>{" "}
                <span className="font-semibold">${form.cost}</span>
              </p>
            )}
            {form.one_time_gain && (
              <p className="text-sm">
                <span className="text-slate-500">{t.beforeAfter.oneTimeGain}:</span>{" "}
                <span className="font-semibold">${form.one_time_gain}</span>
              </p>
            )}
            {form.gain_continuity && (
              <p className="text-sm">
                <span className="text-slate-500">{t.beforeAfter.gainContinuity}:</span>{" "}
                {form.gain_continuity === "continuous"
                  ? t.beforeAfter.continuous
                  : t.beforeAfter.oneTime}
              </p>
            )}
            {form.gain_category_label && (
              <p className="text-sm">
                <span className="text-slate-500">{t.beforeAfter.gainCategory}:</span>{" "}
                {form.gain_category_label}
              </p>
            )}
            {form.budget_code && (
              <p className="text-sm sm:col-span-2">
                <span className="text-slate-500">{t.beforeAfter.budgetCode}:</span>{" "}
                {form.budget_code}
              </p>
            )}
          </section>
        )}
      </main>
    </>
  );
}
