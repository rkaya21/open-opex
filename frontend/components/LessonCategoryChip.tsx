import { t } from "@/lib/i18n";
import type { LessonCategory } from "@/lib/types";

// Pastel squares approximating the İÇDAŞ category palette
const squares: Record<LessonCategory, string> = {
  employee_satisfaction: "bg-orange-200",
  maintenance: "bg-green-300",
  quality: "bg-blue-200",
  new_product: "bg-pink-200",
  new_process: "bg-amber-200",
  kaizen: "bg-teal-400",
  five_s: "bg-orange-500",
  poka_yoke: "bg-rose-600",
  competency: "bg-sky-200",
  motivation: "bg-pink-300",
  hse: "bg-yellow-300",
  capacity_gain: "bg-red-300",
  labor_gain: "bg-orange-300",
  energy_gain: "bg-yellow-200",
  space_gain: "bg-purple-300",
  material_gain: "bg-emerald-200",
  ergonomics: "bg-pink-200",
  customer_satisfaction: "bg-blue-300",
  environment: "bg-green-200",
  stock_transport: "bg-amber-300",
  scrap_rework: "bg-purple-200",
};

export default function LessonCategoryChip({
  category,
  label,
}: {
  category: LessonCategory;
  label?: string;
}) {
  return (
    <span className="flex items-center gap-1.5 text-sm text-slate-700">
      <span className={`h-4 w-4 shrink-0 rounded ${squares[category]}`} />
      {label ?? t.lessons.categories[category]}
    </span>
  );
}
