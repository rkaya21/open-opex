"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import StatusBadge from "@/components/StatusBadge";
import { AuthError, authFetch } from "@/lib/auth";
import { t } from "@/lib/i18n";
import type { ProcessNode } from "@/lib/types";

function TreeRow({ node, depth }: { node: ProcessNode; depth: number }) {
  return (
    <>
      <Link
        href={`/processes/${node.id}`}
        className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-slate-100"
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        <span className="font-mono text-xs text-slate-500">{node.code}</span>
        <span className="text-sm">{node.name}</span>
        <span className="text-xs text-slate-400">v{node.version}</span>
        <StatusBadge status={node.status} />
      </Link>
      {node.children.map((child) => (
        <TreeRow key={child.id} node={child} depth={depth + 1} />
      ))}
    </>
  );
}

export default function ProcessesPage() {
  const router = useRouter();
  const [tree, setTree] = useState<ProcessNode[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await authFetch("/api/v1/processes/tree/");
      setTree(await response.json());
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.processes.loadFailed);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t.processes.title}</h1>
          <Link
            href="/processes/new"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            {t.processes.newProcess}
          </Link>
        </div>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {tree === null && !error && (
          <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
        )}
        {tree !== null && tree.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">{t.processes.empty}</p>
        )}
        {tree !== null && tree.length > 0 && (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white py-2">
            {tree.map((node) => (
              <TreeRow key={node.id} node={node} depth={0} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
