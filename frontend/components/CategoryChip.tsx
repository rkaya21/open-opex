import { t } from "@/lib/i18n";
import type { SuggestionCategory } from "@/lib/types";

const squares: Record<Exclude<SuggestionCategory, "">, string> = {
  sec: "bg-yellow-400",
  kaizen: "bg-blue-700",
  respect: "bg-pink-600",
  reasonable: "bg-emerald-600",
  autonomous: "border border-slate-300 bg-white",
};

export default function CategoryChip({ category }: { category: SuggestionCategory }) {
  if (!category) return null;
  return (
    <span className="flex items-center gap-1.5 text-sm text-slate-700">
      <span className={`h-3 w-3 shrink-0 rounded-[2px] ${squares[category]}`} />
      {t.suggestions.categories[category]}
    </span>
  );
}
