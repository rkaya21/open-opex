"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { t } from "@/lib/i18n";

interface ListShellProps {
  title: string;
  count: number | null;
  filters?: React.ReactNode;
  onFilterReset?: () => void;
  fabHref?: string;
  children: React.ReactNode;
}

/** Op-Ex style list page: centered title + record count, cards in the middle,
 * filter panel on the right, floating + button bottom-right. */
export default function ListShell({
  title,
  count,
  filters,
  onFilterReset,
  fabHref,
  children,
}: ListShellProps) {
  return (
    <main className="px-8 py-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="min-w-0 grow">
          <h1 className="text-center text-2xl font-bold">{title}</h1>
          {count !== null && (
            <p className="mt-1 text-center text-sm text-slate-500">
              {count} {t.common.recordsFound}
            </p>
          )}
          <div className="mt-6 space-y-3">{children}</div>
        </div>

        {filters && (
          <aside className="w-full shrink-0 lg:w-64">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{t.common.filter}</h2>
                {onFilterReset && (
                  <button
                    onClick={onFilterReset}
                    className="text-xs text-slate-500 hover:text-slate-900"
                  >
                    {t.common.filterReset}
                  </button>
                )}
              </div>
              <div className="mt-3 space-y-3">{filters}</div>
            </div>
          </aside>
        )}
      </div>

      {fabHref && (
        <Link
          href={fabHref}
          className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg transition hover:bg-slate-700"
        >
          <Plus className="h-7 w-7" />
        </Link>
      )}
    </main>
  );
}
