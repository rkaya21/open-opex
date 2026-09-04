"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Columns2,
  DoorOpen,
  Inbox,
  ListTodo,
  MapPin,
  MessageSquare,
  ShieldAlert,
  TrendingUp,
  Workflow,
  Zap,
} from "lucide-react";
import Nav from "@/components/Nav";
import { isLoggedIn } from "@/lib/auth";
import { t } from "@/lib/i18n";

interface ModuleCard {
  label: string;
  icon: React.ElementType;
  color: string;
  href?: string; // absent → coming soon
}

const sections: { title: string; cards: ModuleCard[] }[] = [
  {
    title: t.nav.groupCulture,
    cards: [
      { label: t.home.cards.tasks, icon: CheckCircle2, color: "text-pink-600", href: "/actions" },
      { label: t.home.cards.suggestions, icon: MessageSquare, color: "text-violet-600", href: "/suggestions" },
      { label: t.home.cards.beforeAfter, icon: Columns2, color: "text-indigo-500" },
      { label: t.home.cards.tnd, icon: BookOpen, color: "text-green-600", href: "/lessons" },
      { label: t.home.cards.kobetsu, icon: TrendingUp, color: "text-emerald-600", href: "/projects" },
      { label: t.home.cards.asakai, icon: DoorOpen, color: "text-blue-600", href: "/asakai" },
      { label: t.home.cards.asakaiItems, icon: ListTodo, color: "text-sky-700", href: "/asakai-items" },
      { label: t.home.cards.audits5s, icon: ClipboardCheck, color: "text-slate-700", href: "/audits" },
      { label: t.home.cards.areas5s, icon: MapPin, color: "text-orange-600", href: "/areas" },
    ],
  },
  {
    title: t.home.sectionIsg,
    cards: [
      { label: t.home.cards.krk, icon: ShieldAlert, color: "text-amber-600" },
      { label: t.home.cards.hazard, icon: Zap, color: "text-red-600" },
    ],
  },
  {
    title: t.nav.groupPerformance,
    cards: [
      { label: t.nav.processes, icon: Workflow, color: "text-indigo-600", href: "/processes" },
      { label: t.nav.kpis, icon: BarChart3, color: "text-blue-600", href: "/kpis" },
      { label: t.nav.myWork, icon: Inbox, color: "text-cyan-600", href: "/my-work" },
    ],
  },
];

function Card({ card }: { card: ModuleCard }) {
  const body = (
    <>
      <card.icon
        className={`h-11 w-11 ${card.href ? card.color : "text-slate-300"}`}
        strokeWidth={1.7}
      />
      <span
        className={`text-[15px] font-bold leading-snug ${
          card.href ? card.color : "text-slate-400"
        }`}
      >
        {card.label}
      </span>
      {!card.href && (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {t.home.comingSoon}
        </span>
      )}
    </>
  );
  const baseClass =
    "flex h-44 w-48 flex-col items-center justify-center gap-4 rounded-2xl border bg-white px-4 text-center";
  if (!card.href) {
    return (
      <div className={`${baseClass} border-slate-100 shadow-none`}>{body}</div>
    );
  }
  return (
    <Link
      href={card.href}
      className={`${baseClass} border-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md`}
    >
      {body}
    </Link>
  );
}

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
          <section key={section.title} className="mb-12">
            <h2 className="text-xl font-bold text-slate-800">{section.title}</h2>
            <hr className="mb-8 mt-2 border-slate-200" />
            <div className="flex flex-wrap justify-center gap-6">
              {section.cards.map((card) => (
                <Card key={card.label} card={card} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
