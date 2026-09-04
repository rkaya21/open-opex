"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ListShell from "@/components/ListShell";
import Nav from "@/components/Nav";
import { ListSkeleton } from "@/components/Skeleton";
import RecordCard from "@/components/RecordCard";
import { AuthError, authFetch } from "@/lib/auth";
import { locale, t } from "@/lib/i18n";
import type { Area, Paginated } from "@/lib/types";

function scoreBadge(area: Area) {
  if (area.last_score === null) {
    return <span className="text-xs text-slate-400">{t.areas.noScore}</span>;
  }
  const score = Number(area.last_score);
  const tone =
    score >= 80
      ? "bg-emerald-100 text-emerald-800"
      : score >= 60
        ? "bg-amber-100 text-amber-800"
        : "bg-red-100 text-red-700";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>
      {t.areas.lastScore}: %{area.last_score}
    </span>
  );
}

export default function AreasPage() {
  const router = useRouter();
  const [areas, setAreas] = useState<Area[] | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await authFetch("/api/v1/areas/?page_size=200");
      const data: Paginated<Area> = await response.json();
      setAreas(data.results);
      setCount(data.count);
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

  return (
    <>
      <Nav />
      <ListShell title={t.areas.title} count={count} fabHref="/areas/new">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {areas === null && !error && (
          <ListSkeleton />
        )}
        {areas !== null && areas.length === 0 && (
          <p className="text-center text-sm text-slate-500">{t.areas.empty}</p>
        )}
        {areas?.map((area, index) => (
          <RecordCard
            key={area.id}
            index={index + 1}
            title={area.name}
            accent="border-l-orange-400"
            leftMeta={[
              `${t.areas.code}: ${area.code}`,
              ...(area.responsible_email
                ? [`${t.areas.responsible}: ${area.responsible_email}`]
                : []),
            ]}
            rightMeta={[
              ...(area.checklist_template_name
                ? [`${t.areas.questionSet}: ${area.checklist_template_name}`]
                : []),
              ...(area.last_audit_date
                ? [
                    `${t.areas.lastAuditDate}: ${new Date(
                      area.last_audit_date,
                    ).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
                      dateStyle: "long",
                    })}`,
                  ]
                : []),
            ]}
            footerRight={scoreBadge(area)}
          />
        ))}
      </ListShell>
    </>
  );
}
