"use client";

import { useState } from "react";
import ListShell from "@/components/ListShell";
import Nav from "@/components/Nav";
import PhaseBadge from "@/components/PhaseBadge";
import RecordCard from "@/components/RecordCard";
import { ListSkeleton } from "@/components/Skeleton";
import { locale, projectPhaseLabels, t } from "@/lib/i18n";
import { usePaginatedList } from "@/lib/usePaginatedList";
import type { ImprovementProject, ProjectPhase } from "@/lib/types";

export default function ProjectsPage() {
  const [filter, setFilter] = useState<ProjectPhase | "">("");
  const {
    items: projects,
    count,
    failed,
    page,
    setPage,
    pageCount,
    search,
    setSearch,
  } = usePaginatedList<ImprovementProject>(
    "/api/v1/projects/",
    filter ? `phase=${filter}` : "",
  );

  const filters = (
    <div>
      <label className="text-xs text-slate-500">{t.common.status}</label>
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value as ProjectPhase | "")}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="">{t.suggestions.all}</option>
        {(Object.keys(projectPhaseLabels) as ProjectPhase[]).map((phase) => (
          <option key={phase} value={phase}>
            {projectPhaseLabels[phase]}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      <Nav />
      <ListShell
        title={t.projects.title}
        count={count}
        filters={filters}
        onFilterReset={() => setFilter("")}
        fabHref="/projects/new"
        search={search}
        onSearchChange={setSearch}
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
      >
        {failed && <p className="text-sm text-red-600">{t.projects.loadFailed}</p>}
        {projects === null && !failed && <ListSkeleton />}
        {projects !== null && projects.length === 0 && (
          <p className="text-center text-sm text-slate-500">{t.projects.empty}</p>
        )}
        {projects?.map((project, index) => (
          <RecordCard
            key={project.id}
            href={`/projects/${project.id}`}
            index={index + 1}
            title={project.title}
            accent="border-l-emerald-400"
            leftMeta={[
              `${t.common.recordNo}: ${project.id}`,
              ...(project.lead_detail
                ? [`${t.projects.lead}: ${project.lead_detail.email}`]
                : []),
            ]}
            rightMeta={[
              `${t.common.createdAtLabel}: ${new Date(
                project.created_at,
              ).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
                dateStyle: "long",
              })}`,
              ...(project.kpi_name ? [`KPI: ${project.kpi_name}`] : []),
            ]}
            footerRight={<PhaseBadge phase={project.phase} />}
          />
        ))}
      </ListShell>
    </>
  );
}
