"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { AuthError, authFetch } from "@/lib/auth";
import { t } from "@/lib/i18n";
import type {
  Audit,
  ChecklistTemplate,
  Finding,
  Paginated,
} from "@/lib/types";

const SCORES = [0, 1, 2, 3, 4, 5];

export default function AuditDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [template, setTemplate] = useState<ChecklistTemplate | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [findingForm, setFindingForm] = useState({ title: "", description: "" });
  const [photo, setPhoto] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const auditRes = await authFetch(`/api/v1/audits/${id}/`);
      if (!auditRes.ok) {
        setError(t.audits.notFound);
        return;
      }
      const auditData: Audit = await auditRes.json();
      setAudit(auditData);
      const [templateRes, findingsRes] = await Promise.all([
        authFetch(`/api/v1/checklists/${auditData.template}/`),
        authFetch(`/api/v1/findings/?audit=${auditData.id}`),
      ]);
      setTemplate(await templateRes.json());
      setFindings(((await findingsRes.json()) as Paginated<Finding>).results);
      setScores(
        Object.fromEntries(auditData.answers.map((a) => [a.item, a.score])),
      );
      setNotes(Object.fromEntries(auditData.answers.map((a) => [a.item, a.note])));
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveAnswers(): Promise<boolean> {
    if (!template) return false;
    const payload = Object.entries(scores).map(([item, score]) => ({
      item: Number(item),
      score,
      note: notes[Number(item)] ?? "",
    }));
    const response = await authFetch(`/api/v1/audits/${id}/answers/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return response.ok;
  }

  async function handleSave() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (await saveAnswers()) {
        setMessage(t.audits.answersSaved);
      } else {
        setError(t.audits.actionFailed);
      }
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await saveAnswers();
      const response = await authFetch(`/api/v1/audits/${id}/complete/`, {
        method: "POST",
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.detail ?? t.audits.actionFailed);
        return;
      }
      setAudit(body);
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    } finally {
      setBusy(false);
    }
  }

  async function addFinding(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("title", findingForm.title);
      formData.append("description", findingForm.description);
      formData.append("audit", String(audit!.id));
      formData.append("area", String(audit!.area));
      if (photo) formData.append("photo", photo);
      const response = await authFetch("/api/v1/findings/", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        setError(t.audits.actionFailed);
        return;
      }
      setFindingForm({ title: "", description: "" });
      setPhoto(null);
      await load();
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    } finally {
      setBusy(false);
    }
  }

  if (!audit || !template) {
    return (
      <>
        <Nav />
        <main className="px-8 py-8">
          <p className="text-sm text-slate-500">{error || t.common.loading}</p>
        </main>
      </>
    );
  }

  const completed = audit.status === "completed";
  const answeredCount = Object.keys(scores).length;

  return (
    <>
      <Nav />
      <main className="max-w-4xl px-8 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {audit.template_name} · {audit.area_code}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {audit.area_name} · {audit.scheduled_date}
              {audit.auditor_email && ` · ${audit.auditor_email}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {completed && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">
                %{audit.score_percent}
              </span>
            )}
            <button
              onClick={() => window.print()}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
            >
              {t.common.print}
            </button>
          </div>
        </div>

        {completed && (
          <p className="mt-3 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
            {t.audits.completedNote}
          </p>
        )}

        <section className="mt-6 space-y-3">
          {template.items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              {item.category && (
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {item.category}
                </p>
              )}
              <p className="mt-0.5 text-sm font-medium">{item.text}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {SCORES.map((score) => (
                  <button
                    key={score}
                    type="button"
                    disabled={completed}
                    onClick={() => setScores({ ...scores, [item.id]: score })}
                    className={`h-9 w-9 rounded-full text-sm font-semibold transition ${
                      scores[item.id] === score
                        ? score >= 4
                          ? "bg-emerald-600 text-white"
                          : score >= 2
                            ? "bg-amber-500 text-white"
                            : "bg-red-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    } disabled:cursor-not-allowed`}
                  >
                    {score}
                  </button>
                ))}
                <input
                  disabled={completed}
                  placeholder={t.kpis.note}
                  value={notes[item.id] ?? ""}
                  onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })}
                  className="ml-2 grow rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                />
              </div>
            </div>
          ))}
        </section>

        {!completed && (
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={busy}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-50"
            >
              {t.audits.saveAnswers}
            </button>
            <button
              onClick={handleComplete}
              disabled={busy || answeredCount < template.items.length}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {t.audits.completeAudit} ({answeredCount}/{template.items.length})
            </button>
            {message && <span className="text-sm text-emerald-700">{message}</span>}
          </div>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <section className="mt-8">
          <h2 className="text-lg font-bold">{t.audits.findings}</h2>
          <form
            onSubmit={addFinding}
            className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex grow flex-col">
              <label className="text-xs text-slate-500">{t.audits.findingTitle}</label>
              <input
                required
                value={findingForm.title}
                onChange={(e) =>
                  setFindingForm({ ...findingForm, title: e.target.value })
                }
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-slate-500">{t.audits.photo}</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {t.audits.newFinding}
            </button>
          </form>

          <div className="mt-3 space-y-2">
            {findings.map((finding) => (
              <div
                key={finding.id}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
              >
                {finding.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={finding.photo}
                    alt={finding.title}
                    className="h-12 w-12 rounded-md object-cover"
                  />
                )}
                <div className="min-w-0 grow">
                  <p className="truncate text-sm font-medium">{finding.title}</p>
                  <p className="text-xs text-slate-500">{finding.created_by_email}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    finding.status === "open"
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {finding.status === "open" ? t.audits.open : t.audits.closed}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
