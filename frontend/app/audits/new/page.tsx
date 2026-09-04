"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save } from "lucide-react";
import Nav from "@/components/Nav";
import { AuthError, authFetch, getStoredEmail } from "@/lib/auth";
import { t } from "@/lib/i18n";
import type { Area, ChecklistTemplate, Paginated, TenantUser } from "@/lib/types";

export default function NewAuditPage() {
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [form, setForm] = useState({
    area: "" as number | "",
    template: "" as number | "",
    participants: [] as number[],
    audit_type: "announced" as "announced" | "unannounced",
    scheduled_date: new Date().toISOString().slice(0, 10),
    notes: "",
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

  // Denetim adı önizlemesi: saha + soru setinden otomatik
  const autoName = useMemo(() => {
    const area = areas.find((candidate) => candidate.id === form.area);
    const template = templates.find((candidate) => candidate.id === form.template);
    return area && template ? `${area.name} — ${template.name}` : "";
  }, [areas, templates, form.area, form.template]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await authFetch("/api/v1/audits/", {
        method: "POST",
        body: JSON.stringify({
          area: form.area,
          template: form.template,
          participants: form.participants,
          audit_type: form.audit_type,
          scheduled_date: form.scheduled_date,
          notes: form.notes,
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
      <main className="max-w-3xl px-8 py-8">
        <div className="relative flex items-center justify-center">
          <Link href="/audits" className="absolute left-0 text-slate-600">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-xl font-bold">{t.audits.newAudit}</h1>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            form="new-audit"
            disabled={busy}
            className="flex items-center gap-2 text-sm font-semibold text-blue-800 hover:text-blue-600 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {busy ? t.common.saving : t.common.save}
          </button>
        </div>

        <form id="new-audit" onSubmit={handleSubmit} className="mt-4 space-y-5">
          <div>
            <label className="text-sm font-medium">{t.audits.auditName}</label>
            <input
              disabled
              value={autoName}
              placeholder={t.audits.autoNameHint}
              className={`${inputClass} bg-slate-50 text-slate-500`}
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t.audits.area}</label>
            <select
              required
              value={form.area}
              onChange={(e) => {
                const areaId = e.target.value === "" ? "" : Number(e.target.value);
                const area = areas.find((candidate) => candidate.id === areaId);
                setForm({
                  ...form,
                  area: areaId,
                  // Sahaya atanmış soru seti varsa otomatik seç
                  template: area?.checklist_template ?? form.template,
                });
              }}
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
            <label className="text-sm font-medium">{t.audits.auditor}</label>
            <input
              disabled
              value={getStoredEmail() ?? ""}
              className={`${inputClass} bg-slate-50 text-slate-500`}
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t.audits.participants}</label>
            <select
              multiple
              size={4}
              value={form.participants.map(String)}
              onChange={(e) =>
                setForm({
                  ...form,
                  participants: Array.from(e.target.selectedOptions).map((option) =>
                    Number(option.value),
                  ),
                })
              }
              className={inputClass}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">{t.audits.participantsHint}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">{t.audits.auditType}</label>
              <select
                value={form.audit_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    audit_type: e.target.value as "announced" | "unannounced",
                  })
                }
                className={inputClass}
              >
                <option value="announced">{t.audits.typeAnnounced}</option>
                <option value="unannounced">{t.audits.typeUnannounced}</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">{t.audits.auditDate}</label>
              <input
                type="date"
                required
                value={form.scheduled_date}
                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">{t.audits.description}</label>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className={inputClass}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </main>
    </>
  );
}
