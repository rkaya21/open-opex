"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import ProjectForm from "@/components/ProjectForm";
import { AuthError, authFetch } from "@/lib/auth";
import { t } from "@/lib/i18n";
import type { ImprovementProject } from "@/lib/types";

export default function EditProjectPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ImprovementProject | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await authFetch(`/api/v1/projects/${id}/`);
      if (response.ok) setProject(await response.json());
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-2xl font-bold">{t.projects.editTitle}</h1>
        <div className="mt-6">
          {project ? (
            <ProjectForm project={project} />
          ) : (
            <p className="text-sm text-slate-500">{t.common.loading}</p>
          )}
        </div>
      </main>
    </>
  );
}
