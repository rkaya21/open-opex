"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save } from "lucide-react";
import Nav from "@/components/Nav";
import { AuthError, authFetch } from "@/lib/auth";
import { t } from "@/lib/i18n";
import type { ChecklistTemplate, Paginated, TenantUser } from "@/lib/types";

export default function NewAreaPage() {
  const router = useRouter();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    responsible: "" as number | "",
    checklist_template: "" as number | "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      authFetch("/api/v1/users/").then((r) => r.json()),
      authFetch("/api/v1/checklists/?page_size=100").then((r) => r.json()),
    ])
      .then(([userData, templateData]: [TenantUser[], Paginated<ChecklistTemplate>]) => {
        setUsers(userData);
        setTemplates(templateData.results);
      })
      .catch((err) => {
        if (err instanceof AuthError) router.push("/login");
      });
  }, [router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await authFetch("/api/v1/areas/", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          responsible: form.responsible === "" ? null : form.responsible,
          checklist_template:
            form.checklist_template === "" ? null : form.checklist_template,
        }),
      });
      if (!response.ok) {
        setError(t.areas.saveFailed);
        return;
      }
      router.push("/areas");
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.areas.saveFailed);
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
          <Link href="/areas" className="absolute left-0 text-slate-600">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-xl font-bold">{t.areas.newArea}</h1>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            form="new-area"
            disabled={busy}
            className="flex items-center gap-2 text-sm font-semibold text-blue-800 hover:text-blue-600 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {busy ? t.common.saving : t.common.save}
          </button>
        </div>

        <form id="new-area" onSubmit={handleSubmit} className="mt-4 space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">{t.areas.name}</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t.areas.code}</label>
              <input
                required
                placeholder={t.areas.codePlaceholder}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">{t.areas.description}</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t.areas.responsible}</label>
            <select
              value={form.responsible}
              onChange={(e) =>
                setForm({
                  ...form,
                  responsible: e.target.value === "" ? "" : Number(e.target.value),
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
            <label className="text-sm font-medium">{t.areas.questionSet}</label>
            <select
              value={form.checklist_template}
              onChange={(e) =>
                setForm({
                  ...form,
                  checklist_template:
                    e.target.value === "" ? "" : Number(e.target.value),
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

          <hr className="border-slate-200" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-400">
                {t.areas.lastAuditDate}
              </label>
              <input disabled value="" className={`${inputClass} bg-slate-50`} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-400">
                {t.areas.currentLevel}
              </label>
              <input disabled value="" className={`${inputClass} bg-slate-50`} />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </main>
    </>
  );
}
