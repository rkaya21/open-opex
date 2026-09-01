const modules = [
  {
    title: "Process Management",
    description: "Hierarchical processes, owners, SIPOC definitions, versioning.",
    phase: "Phase 1",
  },
  {
    title: "KPI & Dashboards",
    description: "Targets, measurements, trends — OEE, FTQ, scrap templates.",
    phase: "Phase 1",
  },
  {
    title: "Continuous Improvement",
    description: "Suggestion flow and PDCA projects linked to KPI impact.",
    phase: "Phase 2",
  },
  {
    title: "Audits & Actions",
    description: "5S-ready checklists, findings, shared CAPA action pool.",
    phase: "Phase 3",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">open-opex</h1>
      <p className="mt-2 text-slate-600">
        Open-source, self-hosted platform for Operational Excellence.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {modules.map((mod) => (
          <div
            key={mod.title}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{mod.title}</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {mod.phase}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{mod.description}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
