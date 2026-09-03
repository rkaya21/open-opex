"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import ProjectForm from "@/components/ProjectForm";
import { t } from "@/lib/i18n";

function NewProjectContent() {
  const params = useSearchParams();
  const suggestionParam = params.get("suggestion");
  const suggestionId = suggestionParam ? Number(suggestionParam) : undefined;

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold">{t.projects.newProject}</h1>
      <div className="mt-6">
        <ProjectForm initialSuggestionId={suggestionId} />
      </div>
    </main>
  );
}

export default function NewProjectPage() {
  return (
    <>
      <Nav />
      <Suspense>
        <NewProjectContent />
      </Suspense>
    </>
  );
}
