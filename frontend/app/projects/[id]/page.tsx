"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { AuthError, authFetch } from "@/lib/auth";
import { projectPhaseLabels, t } from "@/lib/i18n";
import type { ImprovementProject, ProjectPhase } from "@/lib/types";

const phaseOrder: ProjectPhase[] = ["plan", "do", "check", "act", "done"];

const a3Sections = [
  ["a3_background", t.projects.a3.background],
  ["a3_current_state", t.projects.a3.current_state],
  ["a3_goal", t.projects.a3.goal],
  ["a3_root_cause", t.projects.a3.root_cause],
  ["a3_countermeasures", t.projects.a3.countermeasures],
  ["a3_follow_up", t.projects.a3.follow_up],
] as const;

export default function ProjectDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ImprovementProject | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await authFetch(`/api/v1/projects/${id}/`);
      if (!response.ok) {
        setError(t.projects.notFound);
        return;
      }
      setProject(await response.json());
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function advance() {
    setBusy(true);
    setError("");
    try {
      const response = await authFetch(`/api/v1/projects/${id}/advance/`, {
        method: "POST",
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.detail ?? t.projects.actionFailed);
        return;
      }
      setProject(body);
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    } finally {
      setBusy(false);
    }
  }

  if (!project) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-4xl px-6 py-8">
          <p className="text-sm text-slate-500">{error || t.common.loading}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {[
                project.process_code,
                project.kpi_name,
                project.lead_detail?.email,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {project.suggestion_title && (
              <p className="mt-1 text-xs text-slate-400">
                {t.projects.fromSuggestion}:{" "}
                <Link
                  href={`/suggestions/${project.suggestion}`}
                  className="underline hover:text-slate-600"
                >
                  {project.suggestion_title}
                </Link>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href={`/projects/${project.id}/edit`}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
            >
              {t.common.edit}
            </Link>
            {project.phase !== "done" && (
              <button
                onClick={advance}
                disabled={busy}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {t.projects.advance}
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-1">
          {phaseOrder.map((phase, index) => {
            const currentIndex = phaseOrder.indexOf(project.phase);
            const reached = index <= currentIndex;
            return (
              <div key={phase} className="flex items-center gap-1">
                {index > 0 && (
                  <div
                    className={`h-0.5 w-6 ${reached ? "bg-slate-900" : "bg-slate-200"}`}
                  />
                )}
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    phase === project.phase
                      ? "bg-slate-900 text-white"
                      : reached
                        ? "bg-slate-200 text-slate-700"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {projectPhaseLabels[phase]}
                </span>
              </div>
            );
          })}
        </div>

        {(project.expected_benefit || project.realized_benefit) && (
          <div className="mt-5 flex gap-6 text-sm">
            {project.expected_benefit && (
              <p>
                <span className="text-slate-500">{t.projects.expectedBenefit}:</span>{" "}
                <span className="font-semibold">{project.expected_benefit}</span>
              </p>
            )}
            {project.realized_benefit && (
              <p>
                <span className="text-slate-500">{t.projects.realizedBenefit}:</span>{" "}
                <span className="font-semibold">{project.realized_benefit}</span>
              </p>
            )}
          </div>
        )}

        {project.description && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">
            {project.description}
          </p>
        )}

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">
            {t.projects.a3.title}
          </h2>
          <dl className="mt-3 grid gap-4 sm:grid-cols-2">
            {a3Sections.map(([key, label]) => (
              <div key={key}>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {label}
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                  {project[key] || <span className="text-slate-400">—</span>}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </main>
    </>
  );
}
