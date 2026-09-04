"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ListShell from "@/components/ListShell";
import Nav from "@/components/Nav";
import { ListSkeleton } from "@/components/Skeleton";
import RecordCard from "@/components/RecordCard";
import { AuthError, authFetch } from "@/lib/auth";
import { locale, t } from "@/lib/i18n";
import type { BeforeAfterForm, GainCategory, Paginated } from "@/lib/types";

export default function BeforeAfterPage() {
  const router = useRouter();
  const [forms, setForms] = useState<BeforeAfterForm[] | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [category, setCategory] = useState<GainCategory>("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const query = category ? `?category=${category}` : "";
      const response = await authFetch(`/api/v1/beforeafter/${query}`);
      const data: Paginated<BeforeAfterForm> = await response.json();
      setForms(data.results);
      setCount(data.count);
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.beforeAfter.loadFailed);
    }
  }, [category, router]);

  useEffect(() => {
    load();
  }, [load]);

  const filters = (
    <div>
      <label className="text-xs text-slate-500">{t.beforeAfter.category}</label>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as GainCategory)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="">{t.beforeAfter.all}</option>
        {(Object.keys(t.beforeAfter.categories) as Exclude<GainCategory, "">[]).map(
          (key) => (
            <option key={key} value={key}>
              {t.beforeAfter.categories[key]}
            </option>
          ),
        )}
      </select>
    </div>
  );

  return (
    <>
      <Nav />
      <ListShell
        title={t.beforeAfter.title}
        count={count}
        filters={filters}
        onFilterReset={() => setCategory("")}
        fabHref="/beforeafter/new"
      >
        {error && <p className="text-sm text-red-600">{error}</p>}
        {forms === null && !error && (
          <ListSkeleton />
        )}
        {forms !== null && forms.length === 0 && (
          <p className="text-center text-sm text-slate-500">{t.beforeAfter.empty}</p>
        )}
        {forms?.map((form, index) => (
          <RecordCard
            key={form.id}
            href={`/beforeafter/${form.id}`}
            index={index + 1}
            title={form.problem || `#${form.id}`}
            accent="border-l-indigo-400"
            leftMeta={[
              `${t.common.recordNo}: ${form.id}`,
              `${t.common.createdBy}: ${form.created_by_email ?? "—"}`,
            ]}
            rightMeta={[
              new Date(form.start_date).toLocaleDateString(
                locale === "tr" ? "tr-TR" : "en-US",
                { dateStyle: "long" },
              ),
              `${form.photos.length} görsel`,
            ]}
            footerRight={
              form.category_label ? (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                  {form.category_label}
                </span>
              ) : undefined
            }
          />
        ))}
      </ListShell>
    </>
  );
}
