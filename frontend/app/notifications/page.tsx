"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Info } from "lucide-react";
import Nav from "@/components/Nav";
import { AuthError, authFetch } from "@/lib/auth";
import { t } from "@/lib/i18n";
import type { AppNotification, Paginated } from "@/lib/types";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await authFetch("/api/v1/notifications/");
      const data: Paginated<AppNotification> = await response.json();
      setNotifications(data.results);
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.notifications.loadFailed);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function markAllRead() {
    try {
      await authFetch("/api/v1/notifications/mark_all_read/", { method: "POST" });
      await load();
      router.refresh();
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    }
  }

  async function open(notification: AppNotification) {
    try {
      if (!notification.read) {
        await authFetch(`/api/v1/notifications/${notification.id}/mark_read/`, {
          method: "POST",
        });
      }
    } catch {
      // best effort — navigation matters more than the read flag
    }
    if (notification.link) router.push(notification.link);
  }

  return (
    <>
      <Nav />
      <main className="max-w-3xl px-8 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t.notifications.title}</h1>
          <button
            onClick={markAllRead}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            {t.notifications.markAllRead}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {notifications === null && !error && (
          <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
        )}
        {notifications !== null && notifications.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">{t.notifications.empty}</p>
        )}

        <div className="mt-5 space-y-2">
          {notifications?.map((notification) => (
            <button
              key={notification.id}
              onClick={() => open(notification)}
              className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left ${
                notification.read
                  ? "border-slate-200 bg-white opacity-70"
                  : "border-slate-300 bg-white shadow-sm"
              } hover:border-slate-400`}
            >
              {notification.kind === "warning" ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              ) : (
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
              )}
              <span className="min-w-0 grow">
                <span className={`block text-sm ${notification.read ? "" : "font-semibold"}`}>
                  {notification.title}
                </span>
                {notification.body && (
                  <span className="block text-xs text-slate-500">{notification.body}</span>
                )}
              </span>
              <span className="shrink-0 text-xs text-slate-400">
                {new Date(notification.created_at).toLocaleDateString("tr-TR")}
              </span>
            </button>
          ))}
        </div>

        <p className="mt-6 text-xs text-slate-400">
          <Link href="/" className="underline">
            open-opex
          </Link>{" "}
          · akıllı uyarılar her gün otomatik kontrol edilir
        </p>
      </main>
    </>
  );
}
