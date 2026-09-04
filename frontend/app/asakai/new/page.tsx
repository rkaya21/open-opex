"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { AuthError, authFetch } from "@/lib/auth";
import { t } from "@/lib/i18n";
import type { Area, AsakaiMeeting, Paginated } from "@/lib/types";

export default function NewAsakaiPage() {
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>([]);
  const [form, setForm] = useState({
    title: "",
    area: "" as number | "",
    held_at: "",
    participant_count: 0,
    notes: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    authFetch("/api/v1/areas/?page_size=200")
      .then((r) => r.json())
      .then((data: Paginated<Area>) => setAreas(data.results))
      .catch((err) => {
        if (err instanceof AuthError) router.push("/login");
      });
  }, [router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await authFetch("/api/v1/asakai/", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          area: form.area === "" ? null : form.area,
        }),
      });
      if (!response.ok) {
        setError(t.asakai.saveFailed);
        return;
      }
      const saved: AsakaiMeeting = await response.json();
      router.push(`/asakai/${saved.id}`);
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.asakai.saveFailed);
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
        <h1 className="text-2xl font-bold">{t.asakai.newTitle}</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="text-sm font-medium">{t.asakai.formTitle}</label>
            <input
              required
              placeholder={t.asakai.formTitlePlaceholder}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">{t.audits.area}</label>
              <select
                value={form.area}
                onChange={(e) =>
                  setForm({
                    ...form,
                    area: e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                className={inputClass}
              >
                <option value="">{t.projects.none}</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.code} — {area.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">{t.asakai.heldAt}</label>
              <input
                type="datetime-local"
                required
                value={form.held_at}
                onChange={(e) => setForm({ ...form, held_at: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t.asakai.participants}</label>
              <input
                type="number"
                min={0}
                value={form.participant_count}
                onChange={(e) =>
                  setForm({ ...form, participant_count: Number(e.target.value) })
                }
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">{t.asakai.notes}</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className={inputClass}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {busy ? t.common.saving : t.asakai.save}
          </button>
        </form>
      </main>
    </>
  );
}
