"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { AuthError, authFetch } from "@/lib/auth";
import { t } from "@/lib/i18n";
import type { AsakaiItem, Paginated } from "@/lib/types";

export default function AsakaiItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AsakaiItem[] | null>(null);
  const [filter, setFilter] = useState<"" | "open" | "done">("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const query = filter ? `?status=${filter}` : "";
      const response = await authFetch(`/api/v1/asakai-items/${query}`);
      setItems(((await response.json()) as Paginated<AsakaiItem>).results);
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.asakai.loadFailed);
    }
  }, [filter, router]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Nav />
      <main className="max-w-4xl px-8 py-8">
        <h1 className="text-2xl font-bold">{t.asakai.itemsTitle}</h1>

        <div className="mt-4 flex gap-2">
          {([
            ["", t.suggestions.all],
            ["open", t.asakai.itemOpen],
            ["done", t.asakai.itemDone],
          ] as const).map(([value, label]) => (
            <button
              key={value || "all"}
              onClick={() => setFilter(value)}
              className={`rounded-full border px-3 py-1 text-xs ${
                filter === value
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {items === null && !error && (
          <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
        )}
        {items !== null && items.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">{t.asakai.allItemsEmpty}</p>
        )}

        <div className="mt-4 space-y-2">
          {items?.map((item) => (
            <Link
              key={item.id}
              href={`/asakai/${item.meeting}`}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-slate-300"
            >
              <div className="min-w-0 grow">
                <p
                  className={`truncate text-sm ${
                    item.status === "done" ? "text-slate-400 line-through" : "font-medium"
                  }`}
                >
                  {item.description}
                </p>
                <p className="text-xs text-slate-500">{item.meeting_title}</p>
              </div>
              {item.action_ids.length > 0 && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  {t.asakai.hasAction}
                </span>
              )}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  item.status === "open"
                    ? "bg-sky-100 text-sky-800"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {item.status === "open" ? t.asakai.itemOpen : t.asakai.itemDone}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
