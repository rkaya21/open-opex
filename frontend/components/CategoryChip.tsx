import { t } from "@/lib/i18n";
import type { SuggestionCategory } from "@/lib/types";

const squares: Record<Exclude<SuggestionCategory, "">, string> = {
  five_s: "bg-teal-500",
  sec: "bg-yellow-400",
  respect: "bg-pink-600",
  sigma_green: "bg-green-500",
  sigma_black: "bg-slate-900",
  kaizen: "bg-blue-700",
  investment: "bg-amber-700",
  reasonable: "bg-emerald-600",
  asakai_card: "bg-sky-500",
  tnd: "bg-lime-600",
  autonomous: "border border-slate-300 bg-white",
  rnd: "bg-indigo-500",
  innovation: "bg-purple-500",
  poka_yoke: "bg-orange-500",
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
