import type { ProcessStatus } from "@/lib/types";

const styles: Record<ProcessStatus, string> = {
  draft: "bg-amber-100 text-amber-800",
  published: "bg-emerald-100 text-emerald-800",
  archived: "bg-slate-200 text-slate-600",
};

export default function StatusBadge({ status }: { status: ProcessStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}
