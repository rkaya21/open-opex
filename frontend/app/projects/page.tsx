"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import PhaseBadge from "@/components/PhaseBadge";
import { AuthError, authFetch } from "@/lib/auth";
import { t } from "@/lib/i18n";
import type { ImprovementProject, Paginated } from "@/lib/types";

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ImprovementProject[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await authFetch("/api/v1/projects/");
      const data: Paginated<ImprovementProject> = await response.json();
      setProjects(data.results);
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.projects.loadFailed);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t.projects.title}</h1>
          <Link
            href="/projects/new"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            {t.projects.newProject}
          </Link>
        </div>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {projects === null && !error && (
          <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
        )}
        {projects !== null && projects.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">{t.projects.empty}</p>
        )}
        <div className="mt-4 space-y-2">
          {projects?.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-slate-300"
            >
              <div className="min-w-0 grow">
                <p className="truncate font-medium">{project.title}</p>
                <p className="text-xs text-slate-500">
                  {[project.process_code, project.kpi_name, project.lead_detail?.email]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <PhaseBadge phase={project.phase} />
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
