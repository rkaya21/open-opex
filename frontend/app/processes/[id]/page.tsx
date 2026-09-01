"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import StatusBadge from "@/components/StatusBadge";
import { AuthError, authFetch } from "@/lib/auth";
import type { Process } from "@/lib/types";

const sipocSections = [
  ["suppliers", "Suppliers"],
  ["inputs", "Inputs"],
  ["steps", "Process steps"],
  ["outputs", "Outputs"],
  ["customers", "Customers"],
] as const;

export default function ProcessDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [process, setProcess] = useState<Process | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await authFetch(`/api/v1/processes/${id}/`);
      if (!response.ok) {
        setError("Process not found");
        return;
      }
      setProcess(await response.json());
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(name: "publish" | "archive") {
    setError("");
    try {
      const response = await authFetch(`/api/v1/processes/${id}/${name}/`, {
        method: "POST",
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.detail ?? `${name} failed`);
        return;
      }
      setProcess(body);
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    }
  }

  if (!process) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-3xl px-6 py-8">
          <p className="text-sm text-slate-500">{error || "Loading…"}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-slate-500">
              {process.code} · v{process.version}
            </p>
            <h1 className="text-2xl font-bold">{process.name}</h1>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={process.status} />
              {process.owner_detail && (
                <span className="text-xs text-slate-500">
                  Owner: {process.owner_detail.email}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/processes/${process.id}/edit`}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
            >
              Edit
            </Link>
            {process.status !== "archived" && (
              <button
                onClick={() => act("publish")}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
              >
                {process.status === "published" ? "Republish" : "Publish"}
              </button>
            )}
            {process.status !== "archived" && (
              <button
                onClick={() => act("archive")}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
              >
                Archive
              </button>
            )}
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {process.purpose && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-slate-700">Purpose</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
              {process.purpose}
            </p>
          </section>
        )}

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">SIPOC</h2>
          <dl className="mt-3 grid gap-4 sm:grid-cols-2">
            {sipocSections.map(([key, label]) => (
              <div key={key} className={key === "steps" ? "sm:col-span-2" : ""}>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {label}
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                  {process[key] || <span className="text-slate-400">—</span>}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </>
  );
}
