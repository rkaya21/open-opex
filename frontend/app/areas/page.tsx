"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { AuthError, authFetch } from "@/lib/auth";
import { t } from "@/lib/i18n";
import type { Area, Paginated, TenantUser } from "@/lib/types";

export default function AreasPage() {
  const router = useRouter();
  const [areas, setAreas] = useState<Area[] | null>(null);
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [form, setForm] = useState({ name: "", code: "", responsible: "" as number | "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [areaRes, userRes] = await Promise.all([
        authFetch("/api/v1/areas/?page_size=200"),
        authFetch("/api/v1/users/"),
      ]);
      const areaData: Paginated<Area> = await areaRes.json();
      setAreas(areaData.results);
      setUsers(await userRes.json());
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.areas.loadFailed);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function createArea(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await authFetch("/api/v1/areas/", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          code: form.code,
          responsible: form.responsible === "" ? null : form.responsible,
        }),
      });
      if (!response.ok) {
        setError(t.areas.saveFailed);
        return;
      }
      setForm({ name: "", code: "", responsible: "" });
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
        <h1 className="text-2xl font-bold">{t.areas.title}</h1>

        <form
          onSubmit={createArea}
          className="mt-5 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4"
        >
          <div className="flex flex-col">
            <label className="text-xs text-slate-500">{t.areas.name}</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500">{t.areas.code}</label>
            <input
              required
              placeholder={t.areas.codePlaceholder}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500">{t.areas.responsible}</label>
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
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {t.areas.create}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {areas === null && !error && (
          <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
        )}
        {areas !== null && areas.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">{t.areas.empty}</p>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas?.map((area) => (
            <div
              key={area.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-500">{area.code}</span>
                {area.last_score !== null ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      Number(area.last_score) >= 80
                        ? "bg-emerald-100 text-emerald-800"
                        : Number(area.last_score) >= 60
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {t.areas.lastScore}: %{area.last_score}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">{t.areas.noScore}</span>
                )}
              </div>
              <h2 className="mt-1 font-semibold">{area.name}</h2>
              {area.responsible_email && (
                <p className="mt-1 text-xs text-slate-500">
                  {t.areas.responsible}: {area.responsible_email}
                </p>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
