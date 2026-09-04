"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ListShell from "@/components/ListShell";
import Nav from "@/components/Nav";
import { ListSkeleton } from "@/components/Skeleton";
import RecordCard from "@/components/RecordCard";
import { AuthError, authFetch } from "@/lib/auth";
import { locale, t } from "@/lib/i18n";
import type { Area, Audit, Paginated } from "@/lib/types";

const emptyFilters = { area: "" as number | "", status: "" };

export default function AuditsPage() {
  const router = useRouter();
  const [audits, setAudits] = useState<Audit[] | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page_size: "100" });
      if (filters.area !== "") params.set("area", String(filters.area));
      if (filters.status) params.set("status", filters.status);
      const [auditRes, areaRes] = await Promise.all([
        authFetch(`/api/v1/audits/?${params}`),
        authFetch("/api/v1/areas/?page_size=200"),
      ]);
      const data: Paginated<Audit> = await auditRes.json();
      setAudits(data.results);
      setCount(data.count);
      setAreas(((await areaRes.json()) as Paginated<Area>).results);
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.audits.loadFailed);
    }
  }, [filters, router]);

  useEffect(() => {
    load();
  }, [load]);

  const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

  const filterPanel = (
    <>
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
        <label className="text-xs text-slate-500">{t.common.status}</label>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className={inputClass}
        >
          <option value="">—</option>
          <option value="planned">{t.audits.planned}</option>
          <option value="completed">{t.audits.completed}</option>
        </select>
      </div>
    </>
  );

  return (
    <>
      <Nav />
      <ListShell
        title={t.audits.title}
        count={count}
        filters={filterPanel}
        onFilterReset={() => setFilters(emptyFilters)}
        fabHref="/audits/new"
      >
        {error && <p className="text-sm text-red-600">{error}</p>}
        {audits === null && !error && (
          <ListSkeleton />
        )}
        {audits !== null && audits.length === 0 && (
          <p className="text-center text-sm text-slate-500">{t.audits.empty}</p>
        )}
        {audits?.map((audit, index) => (
          <RecordCard
            key={audit.id}
            href={`/audits/${audit.id}`}
            index={index + 1}
            title={audit.name || `${audit.template_name} · ${audit.area_code}`}
            chip={
              audit.audit_type === "unannounced"
                ? t.audits.typeUnannounced
                : undefined
            }
            accent="border-l-teal-400"
            leftMeta={[
              `${t.common.recordNo}: ${audit.id}`,
              ...(audit.auditor_email
                ? [`${t.audits.auditor}: ${audit.auditor_email}`]
                : []),
            ]}
            rightMeta={[
              `${t.audits.date}: ${new Date(audit.scheduled_date).toLocaleDateString(
                locale === "tr" ? "tr-TR" : "en-US",
                { dateStyle: "long" },
              )}`,
              audit.area_name,
            ]}
            footerRight={
              audit.status === "completed" ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  %{audit.score_percent}
                </span>
              ) : (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
                  {t.audits.planned}
                </span>
              )
            }
          />
        ))}
      </ListShell>
    </>
  );
}
