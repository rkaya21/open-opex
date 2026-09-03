import type { KpiStatus } from "@/lib/types";

const colors: Record<KpiStatus, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  red: "bg-red-500",
  gray: "bg-slate-300",
};

export default function KpiStatusDot({ status }: { status: KpiStatus }) {
  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ${colors[status]}`}
      title={status}
    />
  );
}
