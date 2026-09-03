"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ClipboardCheck,
  Home,
  Inbox,
  Lightbulb,
  ListChecks,
  LogOut,
  MapPin,
  Power,
  TrendingUp,
  Workflow,
} from "lucide-react";
import { clearTokens } from "@/lib/auth";
import { t } from "@/lib/i18n";

const groups: {
  title: string | null;
  links: { href: string; label: string; icon: React.ElementType }[];
}[] = [
  {
    title: null,
    links: [
      { href: "/", label: t.nav.home, icon: Home },
      { href: "/my-work", label: t.nav.myWork, icon: Inbox },
    ],
  },
  {
    title: t.nav.groupCulture,
    links: [
      { href: "/suggestions", label: t.nav.suggestions, icon: Lightbulb },
      { href: "/projects", label: t.nav.projects, icon: TrendingUp },
    ],
  },
  {
    title: t.nav.groupPerformance,
    links: [
      { href: "/processes", label: t.nav.processes, icon: Workflow },
      { href: "/kpis", label: t.nav.kpis, icon: BarChart3 },
    ],
  },
  {
    title: t.nav.groupField,
    links: [
      { href: "/areas", label: t.nav.areas, icon: MapPin },
      { href: "/audits", label: t.nav.audits, icon: ClipboardCheck },
      { href: "/actions", label: t.nav.actions, icon: ListChecks },
    ],
  },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
        active
          ? "bg-slate-100 font-semibold text-slate-900"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

export default function Nav() {
  const router = useRouter();
  const pathname = usePathname();

  function logout() {
    clearTokens();
    router.push("/login");
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="app-sidebar fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="px-5 py-4 text-lg font-bold tracking-tight">open-opex</div>
        <nav className="grow space-y-4 overflow-y-auto px-3 pb-4">
          {groups.map((group) => (
            <div key={group.title ?? "top"}>
              {group.title && (
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {group.title}
                </p>
              )}
              <div className="space-y-0.5">
                {group.links.map((link) => (
                  <NavLink key={link.href} {...link} active={isActive(link.href)} />
                ))}
              </div>
            </div>
          ))}
        </nav>
        <button
          onClick={logout}
          className="flex items-center gap-3 border-t border-slate-200 px-6 py-3 text-sm text-slate-500 hover:text-slate-900"
        >
          <Power className="h-4 w-4" />
          {t.nav.logout}
        </button>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white md:hidden">
        <div className="flex items-center gap-2 overflow-x-auto px-4 py-2">
          <span className="mr-2 shrink-0 font-bold">open-opex</span>
          {groups
            .flatMap((group) => group.links)
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-full px-3 py-1 text-xs ${
                  isActive(link.href)
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {link.label}
              </Link>
            ))}
          <button onClick={logout} className="ml-auto shrink-0 p-1 text-slate-500">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>
    </>
  );
}
