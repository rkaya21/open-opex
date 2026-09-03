"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { AuthError, authFetch } from "@/lib/auth";
import { t } from "@/lib/i18n";
import type {
  Area,
  Audit,
  ChecklistTemplate,
  Paginated,
  TenantUser,
} from "@/lib/types";

export default function AuditsPage() {
  const router = useRouter();
  const [audits, setAudits] = useState<Audit[] | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [form, setForm] = useState({
    template: "" as number | "",
    area: "" as number | "",
    auditor: "" as number | "",
    scheduled_date: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [auditRes, areaRes, templateRes, userRes] = await Promise.all([
        authFetch("/api/v1/audits/?page_size=100"),
        authFetch("/api/v1/areas/?page_size=200"),
        authFetch("/api/v1/checklists/?page_size=100"),
        authFetch("/api/v1/users/"),
      ]);
      setAudits(((await auditRes.json()) as Paginated<Audit>).results);
      setAreas(((await areaRes.json()) as Paginated<Area>).results);
      setTemplates(((await templateRes.json()) as Paginated<ChecklistTemplate>).results);
      setUsers(await userRes.json());
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.audits.loadFailed);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function schedule(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await authFetch("/api/v1/audits/", {
        method: "POST",
        body: JSON.stringify({
          template: form.template,
          area: form.area,
          auditor: form.auditor === "" ? null : form.auditor,
          scheduled_date: form.scheduled_date,
        }),
      });
      if (!response.ok) {
        setError(t.audits.saveFailed);
        return;
      }
      setForm({ template: "", area: "", auditor: "", scheduled_date: "" });
      await load();
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-slate-400";

  return (
    <>
      <Nav />
      <main className="px-8 py-8">
        <h1 className="text-2xl font-bold">{t.audits.title}</h1>

        <form
          onSubmit={schedule}
          className="mt-5 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4"
        >
          <div className="flex flex-col">
            <label className="text-xs text-slate-500">{t.audits.template}</label>
            <select
              required
              value={form.template}
              onChange={(e) =>
                setForm({ ...form, template: e.target.value === "" ? "" : Number(e.target.value) })
              }
              className={inputClass}
            >
              <option value="">—</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500">{t.audits.area}</label>
            <select
              required
              value={form.area}
              onChange={(e) =>
                setForm({ ...form, area: e.target.value === "" ? "" : Number(e.target.value) })
              }
              className={inputClass}
            >
              <option value="">—</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.code} — {area.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500">{t.audits.auditor}</label>
            <select
              value={form.auditor}
              onChange={(e) =>
                setForm({ ...form, auditor: e.target.value === "" ? "" : Number(e.target.value) })
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
            <label className="text-xs text-slate-500">{t.audits.date}</label>
            <input
              type="date"
              required
              value={form.scheduled_date}
              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {t.audits.schedule}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {audits === null && !error && (
          <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
        )}
        {audits !== null && audits.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">{t.audits.empty}</p>
        )}

        <div className="mt-5 space-y-2">
          {audits?.map((audit) => (
            <Link
              key={audit.id}
              href={`/audits/${audit.id}`}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-slate-300"
            >
              <div className="min-w-0 grow">
                <p className="truncate font-medium">
                  {audit.template_name} · {audit.area_code}
                </p>
                <p className="text-xs text-slate-500">
                  {audit.scheduled_date}
                  {audit.auditor_email && ` · ${audit.auditor_email}`}
                </p>
              </div>
              {audit.status === "completed" ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  %{audit.score_percent}
                </span>
              ) : (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
                  {t.audits.planned}
                </span>
              )}
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
