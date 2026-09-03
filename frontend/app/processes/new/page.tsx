"use client";

import Nav from "@/components/Nav";
import ProcessForm from "@/components/ProcessForm";
import { t } from "@/lib/i18n";

export default function NewProcessPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-2xl font-bold">{t.processes.newTitle}</h1>
        <div className="mt-6">
          <ProcessForm />
        </div>
      </main>
    </>
  );
}
