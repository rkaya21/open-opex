"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import Nav from "@/components/Nav";
import { AuthError, authFetch } from "@/lib/auth";
import { locale, t } from "@/lib/i18n";
import type { Area, AsakaiMeeting, Paginated } from "@/lib/types";

const emptyFilters = { area: "" as number | "", from: "", to: "" };

export default function AsakaiPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<AsakaiMeeting[] | null>(null);
  const [count, setCount] = useState(0);
  const [areas, setAreas] = useState<Area[]>([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page_size: "100" });
      if (filters.area !== "") params.set("area", String(filters.area));
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      const [meetingRes, areaRes] = await Promise.all([
        authFetch(`/api/v1/asakai/?${params}`),
        authFetch("/api/v1/areas/?page_size=200"),
      ]);
      const data: Paginated<AsakaiMeeting> = await meetingRes.json();
      setMeetings(data.results);
      setCount(data.count);
      setAreas(((await areaRes.json()) as Paginated<Area>).results);
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.asakai.loadFailed);
    }
  }, [filters, router]);

  useEffect(() => {
    load();
  }, [load]);

  const inputClass =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-slate-400";

  return (
    <>
      <Nav />
      <main className="px-8 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Records */}
          <div className="min-w-0 grow">
            <h1 className="text-center text-2xl font-bold">{t.asakai.title}</h1>
            <p className="mt-1 text-center text-sm text-slate-500">
              {count} {t.asakai.recordsFound}
            </p>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            {meetings === null && !error && (
              <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
            )}
            {meetings !== null && meetings.length === 0 && (
              <p className="mt-6 text-center text-sm text-slate-500">
                {t.asakai.empty}
              </p>
            )}

            <div className="mt-6 space-y-3">
              {meetings?.map((meeting, index) => (
                <Link
                  key={meeting.id}
                  href={`/asakai/${meeting.id}`}
                  className="flex flex-wrap justify-between gap-x-6 gap-y-1 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm hover:border-slate-300"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {index + 1}. {meeting.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {t.asakai.recordNo}: {meeting.id}
                    </p>
                    <p className="text-sm text-slate-600">
                      {t.asakai.createdBy}: {meeting.created_by_email ?? "—"}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-slate-700">
                      {new Date(meeting.held_at).toLocaleString(
                        locale === "tr" ? "tr-TR" : "en-US",
                        { dateStyle: "long", timeStyle: "short" },
                      )}
                    </p>
                    {meeting.area_name && (
                      <p className="mt-1 text-slate-600">
                        {meeting.area_code} — {meeting.area_name}
                      </p>
                    )}
                    <p className="text-slate-600">
                      {t.asakai.participants}: {meeting.participant_count}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Filter panel */}
          <aside className="w-full shrink-0 lg:w-64">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{t.asakai.filter}</h2>
                <button
                  onClick={() => setFilters(emptyFilters)}
                  className="text-xs text-slate-500 hover:text-slate-900"
                >
                  {t.asakai.filterReset}
                </button>
              </div>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-xs text-slate-500">{t.audits.area}</label>
                  <select
                    value={filters.area}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
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
                <div>
                  <label className="text-xs text-slate-500">{t.asakai.from}</label>
                  <input
                    type="date"
                    value={filters.from}
                    onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">{t.asakai.to}</label>
                  <input
                    type="date"
                    value={filters.to}
                    onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Floating add button */}
        <Link
          href="/asakai/new"
          className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg transition hover:bg-slate-700"
        >
          <Plus className="h-7 w-7" />
        </Link>
      </main>
    </>
  );
}
