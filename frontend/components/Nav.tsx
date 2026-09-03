"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearTokens } from "@/lib/auth";

export default function Nav() {
  const router = useRouter();

  function logout() {
    clearTokens();
    router.push("/login");
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3">
        <Link href="/" className="font-bold">
          open-opex
        </Link>
        <Link href="/processes" className="text-sm text-slate-600 hover:text-slate-900">
          Processes
        </Link>
        <Link href="/kpis" className="text-sm text-slate-600 hover:text-slate-900">
          KPIs
        </Link>
        <button
          onClick={logout}
          className="ml-auto text-sm text-slate-500 hover:text-slate-900"
        >
          Log out
        </button>
      </nav>
    </header>
  );
}
