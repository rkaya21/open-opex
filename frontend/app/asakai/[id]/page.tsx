"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { AuthError, authFetch, getStoredRole } from "@/lib/auth";
import { locale, t } from "@/lib/i18n";
import type { AsakaiItem, AsakaiMeeting, Paginated } from "@/lib/types";

export default function AsakaiDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [meeting, setMeeting] = useState<AsakaiMeeting | null>(null);
  const [items, setItems] = useState<AsakaiItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isManager = ["admin", "manager"].includes(getStoredRole() ?? "");

  const load = useCallback(async () => {
    try {
      const meetingRes = await authFetch(`/api/v1/asakai/${id}/`);
      if (!meetingRes.ok) {
        setError(t.asakai.notFound);
        return;
      }
      setMeeting(await meetingRes.json());
      const itemsRes = await authFetch(`/api/v1/asakai-items/?meeting=${id}`);
      setItems(((await itemsRes.json()) as Paginated<AsakaiItem>).results);
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function addItem(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await authFetch("/api/v1/asakai-items/", {
        method: "POST",
        body: JSON.stringify({ meeting: Number(id), description: newItem }),
      });
      if (response.ok) {
        setNewItem("");
        await load();
      }
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    } finally {
      setBusy(false);
    }
  }

  async function toggleItem(item: AsakaiItem) {
    try {
      await authFetch(`/api/v1/asakai-items/${item.id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          status: item.status === "open" ? "done" : "open",
        }),
      });
      await load();
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    }
  }

  async function toAction(item: AsakaiItem) {
    setError("");
    try {
      const response = await authFetch(`/api/v1/asakai-items/${item.id}/to_action/`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        setError(t.projects.actionFailed);
        return;
      }
      await load();
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    }
  }

  if (!meeting) {
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
        <h1 className="text-2xl font-bold">{meeting.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {t.asakai.recordNo}: {meeting.id} ·{" "}
          {new Date(meeting.held_at).toLocaleString(
            locale === "tr" ? "tr-TR" : "en-US",
            { dateStyle: "long", timeStyle: "short" },
          )}
          {meeting.area_name && ` · ${meeting.area_code} — ${meeting.area_name}`}
        </p>
        <p className="text-sm text-slate-500">
          {t.asakai.createdBy}: {meeting.created_by_email ?? "—"} ·{" "}
          {t.asakai.participants}: {meeting.participant_count}
        </p>
        {meeting.notes && (
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
            {meeting.notes}
          </p>
        )}

        <section className="mt-8">
          <h2 className="text-lg font-bold">{t.asakai.items}</h2>
          <form onSubmit={addItem} className="mt-3 flex gap-2">
            <input
              required
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder={t.asakai.itemPlaceholder}
              className="grow rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-slate-400"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {t.asakai.newItem}
            </button>
          </form>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {items.length === 0 && (
            <p className="mt-4 text-sm text-slate-500">{t.asakai.itemsEmpty}</p>
          )}

          <div className="mt-4 space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
              >
                <div className="min-w-0 grow">
                  <p
                    className={`text-sm ${
                      item.status === "done"
                        ? "text-slate-400 line-through"
                        : "font-medium"
                    }`}
                  >
                    {item.description}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.created_by_email}
                    {item.action_ids.length > 0 && (
                      <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        {t.asakai.hasAction}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => toggleItem(item)}
                  className="rounded-md border border-slate-300 px-2.5 py-1 text-xs hover:bg-slate-100"
                >
                  {item.status === "open" ? t.asakai.markDone : t.asakai.reopen}
                </button>
                {isManager && item.action_ids.length === 0 && item.status === "open" && (
                  <button
                    onClick={() => toAction(item)}
                    className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-700"
                  >
                    {t.asakai.toAction}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
