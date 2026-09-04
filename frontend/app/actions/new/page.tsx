"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft } from "lucide-react";
import Nav from "@/components/Nav";
import { AuthError, authFetch } from "@/lib/auth";
import { t } from "@/lib/i18n";
import type { TenantUser } from "@/lib/types";

export default function NewActionPage() {
  const router = useRouter();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [form, setForm] = useState({
    title: "",
    assignee: "" as number | "",
    due_date: "",
    description: "",
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
      const response = await authFetch("/api/v1/actions/", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          assignee: form.assignee === "" ? null : form.assignee,
          due_date: form.due_date === "" ? null : form.due_date,
        }),
      });
      if (!response.ok) {
        setError(t.actions.saveFailed);
        return;
      }
      router.push("/actions");
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.actions.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-slate-400";

  const sendButton = (
    <button
      type="submit"
      form="new-action"
      disabled={busy}
      className="flex items-center gap-2 text-sm font-semibold text-blue-800 hover:text-blue-600 disabled:opacity-50"
    >
      <ArrowRight className="h-4 w-4" />
      {t.common.send}
    </button>
  );

  return (
    <>
      <Nav />
      <main className="max-w-3xl px-8 py-8">
        <div className="relative flex items-center justify-center">
          <Link href="/actions" className="absolute left-0 text-slate-600">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-xl font-bold">{t.actions.newTitle}</h1>
        </div>
        <div className="mt-6 flex justify-end">{sendButton}</div>
        <form id="new-action" onSubmit={handleSubmit} className="mt-4 space-y-5">
          <div>
            <label className="text-sm font-medium">{t.actions.taskDefinition}</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t.actions.personnel}</label>
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
          <div className="max-w-xs">
            <label className="text-sm font-medium">{t.common.targetDate}</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t.actions.description}</label>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end">{sendButton}</div>
        </form>
      </main>
    </>
  );
}
