"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ClipboardCheck,
  Lightbulb,
  ListChecks,
  TrendingUp,
} from "lucide-react";
import Nav from "@/components/Nav";
import { AuthError, authFetch } from "@/lib/auth";
import { t } from "@/lib/i18n";
import type { MyWork } from "@/lib/types";

interface BucketRow {
  key: keyof typeof t.myWork.buckets;
  icon: React.ElementType;
  items: { id: number; label: string; href: string; meta?: string }[];
}

function Bucket({ row }: { row: BucketRow }) {
  return (
    <details className="group rounded-xl border border-slate-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4">
        <row.icon className="h-5 w-5 text-slate-500" />
        <span className="grow font-medium">{t.myWork.buckets[row.key]}</span>
        <span className="flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white shadow-sm">
          {row.items.length}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400 transition group-open:rotate-180" />
      </summary>
      <div className="border-t border-slate-100 px-5 py-2">
        {row.items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm hover:bg-slate-50"
          >
            <span className="truncate">{item.label}</span>
            {item.meta && (
              <span className="shrink-0 text-xs text-slate-400">{item.meta}</span>
            )}
          </Link>
        ))}
      </div>
    </details>
  );
}

export default function MyWorkPage() {
  const router = useRouter();
  const [work, setWork] = useState<MyWork | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await authFetch("/api/v1/my-work/");
      setWork(await response.json());
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.myWork.loadFailed);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const buckets: BucketRow[] = work
    ? [
        {
          key: "actions" as const,
          icon: ListChecks,
          items: work.actions.map((action) => ({
            id: action.id,
            label: action.title,
            href: "/actions",
            meta: action.due_date ?? undefined,
          })),
        },
        {
          key: "audits" as const,
          icon: ClipboardCheck,
          items: work.audits.map((audit) => ({
            id: audit.id,
            label: `${audit.template_name} · ${audit.area_code}`,
            href: `/audits/${audit.id}`,
            meta: audit.scheduled_date,
          })),
        },
        {
          key: "suggestions" as const,
          icon: Lightbulb,
          items: work.suggestions.map((suggestion) => ({
            id: suggestion.id,
            label: suggestion.title,
            href: `/suggestions/${suggestion.id}`,
          })),
        },
        {
          key: "projects" as const,
          icon: TrendingUp,
          items: work.projects.map((project) => ({
            id: project.id,
            label: project.title,
            href: `/projects/${project.id}`,
          })),
        },
        ...(work.suggestions_to_evaluate
          ? [
              {
                key: "suggestions_to_evaluate" as const,
                icon: Lightbulb,
                items: work.suggestions_to_evaluate.map((suggestion) => ({
                  id: suggestion.id,
                  label: suggestion.title,
                  href: `/suggestions/${suggestion.id}`,
                })),
              },
            ]
          : []),
      ].filter((bucket) => bucket.items.length > 0)
    : [];

  return (
    <>
      <Nav />
      <main className="max-w-4xl px-8 py-8">
        <h1 className="text-2xl font-bold">{t.myWork.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{t.myWork.subtitle}</p>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {work === null && !error && (
          <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
        )}
        {work !== null && buckets.length === 0 && (
          <p className="mt-6 text-sm text-slate-500">{t.myWork.emptyAll}</p>
        )}

        <div className="mt-6 space-y-3">
          {buckets.map((bucket) => (
            <Bucket key={bucket.key} row={bucket} />
          ))}
        </div>
      </main>
    </>
  );
}
