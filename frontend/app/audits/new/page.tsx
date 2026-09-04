"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft } from "lucide-react";
import Nav from "@/components/Nav";
import { AuthError, authFetch } from "@/lib/auth";
import { t } from "@/lib/i18n";
import type { Area, ChecklistTemplate, Paginated, TenantUser } from "@/lib/types";

export default function NewAuditPage() {
  const router = useRouter();
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

  useEffect(() => {
    Promise.all([
      authFetch("/api/v1/areas/?page_size=200").then((r) => r.json()),
      authFetch("/api/v1/checklists/?page_size=100").then((r) => r.json()),
      authFetch("/api/v1/users/").then((r) => r.json()),
    ])
      .then(
        ([areaData, templateData, userData]: [
          Paginated<Area>,
          Paginated<ChecklistTemplate>,
          TenantUser[],
        ]) => {
          setAreas(areaData.results);
          setTemplates(templateData.results);
          setUsers(userData);
        },
      )
      .catch((err) => {
        if (err instanceof AuthError) router.push("/login");
      });
  }, [router]);

  async function handleSubmit(event: React.FormEvent) {
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
      const saved = await response.json();
      router.push(`/audits/${saved.id}`);
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.audits.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-slate-400";

  return (
    <>
      <Nav />
      <main className="max-w-2xl px-8 py-8">
        <div className="relative flex items-center justify-center">
          <Link href="/audits" className="absolute left-0 text-slate-600">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-xl font-bold">{t.audits.newAudit}</h1>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-medium">{t.audits.template}</label>
            <select
              required
              value={form.template}
              onChange={(e) =>
                setForm({
                  ...form,
                  template: e.target.value === "" ? "" : Number(e.target.value),
                })
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
          <div>
            <label className="text-sm font-medium">{t.audits.area}</label>
            <select
              required
              value={form.area}
              onChange={(e) =>
                setForm({
                  ...form,
                  area: e.target.value === "" ? "" : Number(e.target.value),
                })
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">{t.audits.auditor}</label>
              <select
                value={form.auditor}
                onChange={(e) =>
                  setForm({
                    ...form,
                    auditor: e.target.value === "" ? "" : Number(e.target.value),
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
            <div>
              <label className="text-sm font-medium">{t.audits.date}</label>
              <input
                type="date"
                required
                value={form.scheduled_date}
                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="flex items-center gap-2 text-sm font-semibold text-blue-800 hover:text-blue-600 disabled:opacity-50"
            >
              <ArrowRight className="h-4 w-4" />
              {t.common.send}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
