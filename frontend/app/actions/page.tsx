"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ListShell from "@/components/ListShell";
import Nav from "@/components/Nav";
import RecordCard from "@/components/RecordCard";
import { ListSkeleton } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import { AuthError, authFetch, downloadFile } from "@/lib/auth";
import { locale, t } from "@/lib/i18n";
import { usePaginatedList } from "@/lib/usePaginatedList";
import type { Action, ActionStatus } from "@/lib/types";

const statusLabels: Record<ActionStatus, string> = {
  open: t.actions.statusOpen,
  in_progress: t.actions.statusInProgress,
  done: t.actions.statusDone,
};

function sourceChip(action: Action): string | undefined {
  if (action.asakai_item) return t.actions.sourceAsakai;
  if (action.project) return t.actions.sourceKobetsu;
  if (action.finding) return t.actions.sourceFinding;
  if (action.suggestion) return t.actions.sourceSuggestion;
  return undefined;
}

function daysLate(action: Action): number {
  if (!action.due_date || action.status === "done") return 0;
  const diff = Date.now() - new Date(`${action.due_date}T23:59:59`).getTime();
  return diff > 0 ? Math.ceil(diff / 86_400_000) : 0;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
    dateStyle: "long",
  });
}

export default function ActionsPage() {
  const router = useRouter();
  const toast = useToast();
  const [filter, setFilter] = useState<ActionStatus | "">("");
  const {
    items: actions,
    count,
    failed,
    page,
    setPage,
    pageCount,
    search,
    setSearch,
    reload,
  } = usePaginatedList<Action>(
    "/api/v1/actions/",
    filter ? `status=${filter}` : "",
  );

  async function setStatus(action: Action, status: ActionStatus) {
    try {
      const response = await authFetch(`/api/v1/actions/${action.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        toast.error(t.actions.saveFailed);
        return;
      }
      toast.success(t.common.updated);
      await reload();
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    }
  }

  const filters = (
    <>
      <div>
        <label className="text-xs text-slate-500">{t.common.status}</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as ActionStatus | "")}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">{t.actions.all}</option>
          {(Object.keys(statusLabels) as ActionStatus[]).map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={() =>
          downloadFile(
            `/api/v1/actions/export/${filter ? `?status=${filter}` : ""}`,
            "actions.csv",
          )
        }
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
      >
        {t.common.exportCsv}
      </button>
    </>
  );

  return (
    <>
      <Nav />
      <ListShell
        title={t.actions.title}
        count={count}
        filters={filters}
        onFilterReset={() => setFilter("")}
        fabHref="/actions/new"
        search={search}
        onSearchChange={setSearch}
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
      >
        {failed && <p className="text-sm text-red-600">{t.actions.loadFailed}</p>}
        {actions === null && !failed && <ListSkeleton />}
        {actions !== null && actions.length === 0 && (
          <p className="text-center text-sm text-slate-500">{t.actions.empty}</p>
        )}
        {actions?.map((action, index) => {
          const late = daysLate(action);
          return (
            <RecordCard
              key={action.id}
              index={index + 1}
              title={action.title}
              chip={sourceChip(action)}
              leftMeta={[`${t.common.recordNo}: ${action.id}`]}
              rightMeta={[
                `${t.common.createdAtLabel}: ${formatDate(action.created_at)}`,
                `${t.common.targetDate}: ${formatDate(action.due_date)}`,
              ]}
              footerLeft={`${t.actions.owner}: ${
                action.assignee_email ?? t.actions.unassigned
              }`}
              footerRight={
                <>
                  <span>{statusLabels[action.status]}</span>
                  {action.status === "open" && (
                    <button
                      onClick={() => setStatus(action, "in_progress")}
                      className="rounded-md border border-slate-300 px-2.5 py-1 text-xs hover:bg-slate-100"
                    >
                      {t.actions.markInProgress}
                    </button>
                  )}
                  {action.status !== "done" && (
                    <button
                      onClick={() => setStatus(action, "done")}
                      className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-500"
                    >
                      {t.actions.markDone}
                    </button>
                  )}
                </>
              }
              footerAlert={late > 0 ? `${late} ${t.common.daysLate}` : undefined}
            />
          );
        })}
      </ListShell>
    </>
  );
}
