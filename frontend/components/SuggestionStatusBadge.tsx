import { suggestionStatusLabels } from "@/lib/i18n";
import type { SuggestionStatus } from "@/lib/types";

const styles: Record<SuggestionStatus, string> = {
  submitted: "bg-sky-100 text-sky-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
  implemented: "bg-violet-100 text-violet-800",
};

export default function SuggestionStatusBadge({ status }: { status: SuggestionStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {suggestionStatusLabels[status]}
    </span>
  );
}
