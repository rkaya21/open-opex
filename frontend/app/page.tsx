import Link from "next/link";
import { t } from "@/lib/i18n";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">open-opex</h1>
      <p className="mt-2 text-slate-600">{t.home.tagline}</p>
      <Link
        href="/processes"
        className="mt-6 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        {t.home.openApp}
      </Link>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {t.home.modules.map((mod) => (
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
