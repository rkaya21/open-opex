"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  ClipboardCheck,
  Inbox,
  Lightbulb,
  ListChecks,
  MapPin,
  TrendingUp,
  Workflow,
} from "lucide-react";
import Nav from "@/components/Nav";
import { isLoggedIn } from "@/lib/auth";
import { t } from "@/lib/i18n";

const sections: {
  title: string;
  cards: {
    href: string;
    label: string;
    icon: React.ElementType;
    color: string;
  }[];
}[] = [
  {
    title: t.nav.groupCulture,
    cards: [
      { href: "/suggestions", label: t.nav.suggestions, icon: Lightbulb, color: "text-violet-600" },
      { href: "/projects", label: t.nav.projects, icon: TrendingUp, color: "text-emerald-600" },
      { href: "/my-work", label: t.nav.myWork, icon: Inbox, color: "text-pink-600" },
    ],
  },
  {
    title: t.nav.groupPerformance,
    cards: [
      { href: "/processes", label: t.nav.processes, icon: Workflow, color: "text-indigo-600" },
      { href: "/kpis", label: t.nav.kpis, icon: BarChart3, color: "text-blue-600" },
    ],
  },
  {
    title: t.nav.groupField,
    cards: [
      { href: "/areas", label: t.nav.areas, icon: MapPin, color: "text-orange-600" },
      { href: "/audits", label: t.nav.audits, icon: ClipboardCheck, color: "text-teal-600" },
      { href: "/actions", label: t.nav.actions, icon: ListChecks, color: "text-red-600" },
    ],
  },
];

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) router.push("/login");
  }, [router]);

  return (
    <>
      <Nav />
      <main className="px-8 py-8">
        {sections.map((section) => (
          <section key={section.title} className="mb-10">
            <h2 className="text-lg font-bold text-slate-800">{section.title}</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {section.cards.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-8 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <card.icon className={`h-9 w-9 ${card.color}`} strokeWidth={1.8} />
                  <span className={`text-sm font-semibold ${card.color}`}>
                    {card.label}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
