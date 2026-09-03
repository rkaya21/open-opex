import { projectPhaseLabels } from "@/lib/i18n";
import type { ProjectPhase } from "@/lib/types";

const styles: Record<ProjectPhase, string> = {
  plan: "bg-sky-100 text-sky-800",
  do: "bg-amber-100 text-amber-800",
  check: "bg-indigo-100 text-indigo-800",
  act: "bg-orange-100 text-orange-800",
  done: "bg-emerald-100 text-emerald-800",
};

export default function PhaseBadge({ phase }: { phase: ProjectPhase }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[phase]}`}>
      {projectPhaseLabels[phase]}
    </span>
  );
}
