"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Columns2,
  DoorOpen,
  Home,
  Inbox,
  ListTodo,
  LogOut,
  MapPin,
  MessageSquare,
  Power,
  ShieldAlert,
  TrendingUp,
  UserCog,
  Workflow,
  Zap,
} from "lucide-react";
import { authFetch, clearTokens, getStoredRole, isLoggedIn } from "@/lib/auth";
import { locale, switchLocale, t, type Locale } from "@/lib/i18n";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href?: string; // absent → coming soon (muted, not clickable)
}

const groups: { title: string | null; links: NavItem[] }[] = [
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
      { href: "/actions", label: t.home.cards.tasks, icon: CheckCircle2 },
      { href: "/suggestions", label: t.home.cards.suggestions, icon: MessageSquare },
      { label: t.home.cards.beforeAfter, icon: Columns2 },
      { label: t.home.cards.tnd, icon: BookOpen },
      { href: "/projects", label: t.home.cards.kobetsu, icon: TrendingUp },
      { href: "/asakai", label: t.home.cards.asakai, icon: DoorOpen },
      { href: "/asakai-items", label: t.home.cards.asakaiItems, icon: ListTodo },
      { href: "/audits", label: t.home.cards.audits5s, icon: ClipboardCheck },
      { href: "/areas", label: t.home.cards.areas5s, icon: MapPin },
    ],
  },
  {
    title: t.home.sectionIsg,
    links: [
      { label: t.home.cards.krk, icon: ShieldAlert },
      { label: t.home.cards.hazard, icon: Zap },
    ],
  },
  {
    title: t.nav.groupPerformance,
    links: [
      { href: "/processes", label: t.nav.processes, icon: Workflow },
      { href: "/kpis", label: t.nav.kpis, icon: BarChart3 },
    ],
  },
];

const adminGroup = {
  title: t.nav.groupAdmin,
  links: [{ href: "/settings/users", label: t.nav.users, icon: UserCog }] as NavItem[],
};

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  if (!item.href) {
    return (
      <span
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-300"
        title={t.home.comingSoon}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{item.label}</span>
      </span>
    );
  }
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
        active
          ? "bg-slate-100 font-semibold text-slate-900"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export default function Nav() {
  const router = useRouter();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    document.documentElement.lang = locale;
    setIsAdmin(getStoredRole() === "admin");
    if (!isLoggedIn()) return;
    authFetch("/api/v1/notifications/unread_count/")
      .then((r) => r.json())
      .then((data: { count: number }) => setUnread(data.count))
      .catch(() => {});
  }, [pathname]);

  function logout() {
    clearTokens();
    router.push("/login");
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const allGroups = [...groups, ...(isAdmin ? [adminGroup] : [])];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="app-sidebar fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-lg font-bold tracking-tight">open-opex</span>
          <Link
            href="/notifications"
            className="relative rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
        </div>
        <nav className="grow space-y-4 overflow-y-auto px-3 pb-4">
          {allGroups.map((group) => (
            <div key={group.title ?? "top"}>
              {group.title && (
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {group.title}
                </p>
              )}
              <div className="space-y-0.5">
                {group.links.map((link) => (
                  <NavLink
                    key={link.label}
                    item={link}
                    active={link.href ? isActive(link.href) : false}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-slate-200">
          <div className="flex items-center gap-1 px-6 pt-3">
            {(["tr", "en"] as Locale[]).map((code) => (
              <button
                key={code}
                onClick={() => switchLocale(code)}
                className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${
                  locale === code
                    ? "bg-slate-900 text-white"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                {code}
              </button>
            ))}
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-6 py-3 text-sm text-slate-500 hover:text-slate-900"
          >
            <Power className="h-4 w-4" />
            {t.nav.logout}
          </button>
        </div>
      </aside>

      {/* Mobile top bar — only working modules */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white md:hidden">
        <div className="flex items-center gap-2 overflow-x-auto px-4 py-2">
          <span className="mr-2 shrink-0 font-bold">open-opex</span>
          {allGroups
            .flatMap((group) => group.links)
            .filter((link): link is NavItem & { href: string } => !!link.href)
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
          <Link href="/notifications" className="relative ml-auto shrink-0 p-1 text-slate-500">
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-600 px-0.5 text-[9px] font-bold text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
          <button onClick={logout} className="shrink-0 p-1 text-slate-500">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>
    </>
  );
}
