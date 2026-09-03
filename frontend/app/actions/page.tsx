"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { AuthError, authFetch } from "@/lib/auth";
import { t } from "@/lib/i18n";
import type { Action, ActionStatus, Paginated, TenantUser } from "@/lib/types";

const statusLabels: Record<ActionStatus, string> = {
  open: t.actions.statusOpen,
  in_progress: t.actions.statusInProgress,
  done: t.actions.statusDone,
};

const statusStyles: Record<ActionStatus, string> = {
  open: "bg-sky-100 text-sky-800",
  in_progress: "bg-amber-100 text-amber-800",
  done: "bg-emerald-100 text-emerald-800",
};

export default function ActionsPage() {
  const router = useRouter();
  const [actions, setActions] = useState<Action[] | null>(null);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [filter, setFilter] = useState<ActionStatus | "">("");
  const [form, setForm] = useState({
    title: "",
    assignee: "" as number | "",
    due_date: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const query = filter ? `?status=${filter}` : "";
      const [actionRes, userRes] = await Promise.all([
        authFetch(`/api/v1/actions/${query}`),
        authFetch("/api/v1/users/"),
      ]);
      setActions(((await actionRes.json()) as Paginated<Action>).results);
      setUsers(await userRes.json());
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.actions.loadFailed);
    }
  }, [filter, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function createAction(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await authFetch("/api/v1/actions/", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          assignee: form.assignee === "" ? null : form.assignee,
          due_date: form.due_date === "" ? null : form.due_date,
        }),
      });
      if (!response.ok) {
        setError(t.actions.saveFailed);
        return;
      }
      setForm({ title: "", assignee: "", due_date: "" });
      await load();
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(action: Action, status: ActionStatus) {
    setError("");
    try {
      const response = await authFetch(`/api/v1/actions/${action.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        setError(t.actions.saveFailed);
        return;
      }
      await load();
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    }
  }

  function sourceOf(action: Action): string | null {
    return action.finding_title ?? action.suggestion_title ?? action.project_title;
  }

  const inputClass =
    "rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-slate-400";

  return (
    <>
      <Nav />
      <main className="px-8 py-8">
        <h1 className="text-2xl font-bold">{t.actions.title}</h1>

        <form
          onSubmit={createAction}
          className="mt-5 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4"
        >
          <div className="flex grow flex-col">
            <label className="text-xs text-slate-500">{t.actions.formTitle}</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500">{t.actions.assignee}</label>
            <select
              value={form.assignee}
              onChange={(e) =>
                setForm({
                  ...form,
                  assignee: e.target.value === "" ? "" : Number(e.target.value),
                })
              }
              className={inputClass}
            >
              <option value="">—</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500">{t.actions.dueDate}</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {t.actions.create}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["", "open", "in_progress", "done"] as const).map((status) => (
            <button
              key={status || "all"}
              onClick={() => setFilter(status)}
              className={`rounded-full border px-3 py-1 text-xs ${
                filter === status
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {status === "" ? t.actions.all : statusLabels[status]}
            </button>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {actions === null && !error && (
          <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
        )}
        {actions !== null && actions.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">{t.actions.empty}</p>
        )}

        <div className="mt-4 space-y-2">
          {actions?.map((action) => (
            <div
              key={action.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
            >
              <div className="min-w-0 grow">
                <p className="truncate font-medium">{action.title}</p>
                <p className="text-xs text-slate-500">
                  {action.assignee_email ?? t.actions.unassigned}
                  {action.due_date && ` · ${t.actions.dueDate}: ${action.due_date}`}
                  {sourceOf(action) && ` · ${t.actions.source}: ${sourceOf(action)}`}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[action.status]}`}
              >
                {statusLabels[action.status]}
              </span>
              {action.status === "open" && (
                <button
                  onClick={() => setStatus(action, "in_progress")}
                  className="rounded-md border border-slate-300 px-2.5 py-1 text-xs hover:bg-slate-100"
                >
                  {t.actions.markInProgress}
                </button>
              )}
              {action.status !== "done" && (
                <button
                  onClick={() => setStatus(action, "done")}
                  className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-500"
                >
                  {t.actions.markDone}
                </button>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
