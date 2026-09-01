"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import ProcessForm from "@/components/ProcessForm";
import { AuthError, authFetch } from "@/lib/auth";
import type { Process } from "@/lib/types";

export default function EditProcessPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [process, setProcess] = useState<Process | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await authFetch(`/api/v1/processes/${id}/`);
      if (response.ok) setProcess(await response.json());
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
        <h1 className="text-2xl font-bold">Edit process</h1>
        <div className="mt-6">
          {process ? (
            <ProcessForm process={process} />
          ) : (
            <p className="text-sm text-slate-500">Loading…</p>
          )}
        </div>
      </main>
    </>
  );
}
