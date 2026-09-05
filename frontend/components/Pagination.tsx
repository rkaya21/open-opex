"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { t } from "@/lib/i18n";

interface PaginationProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, pageCount, onChange }: PaginationProps) {
  if (pageCount <= 1) return null;
  const btn =
    "flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className="mt-6 flex items-center justify-center gap-3 text-sm">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label={t.common.prevPage}
        className={btn}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-slate-500">
        {t.common.page} {page} / {pageCount}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        aria-label={t.common.nextPage}
        className={btn}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
