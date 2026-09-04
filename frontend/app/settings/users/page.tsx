"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { AuthError, authFetch } from "@/lib/auth";
import { t } from "@/lib/i18n";
import type { Paginated, TenantUser } from "@/lib/types";

type Role = TenantUser["role"];

const roleLabels: Record<Role, string> = {
  admin: t.users.roleAdmin,
  manager: t.users.roleManager,
  member: t.users.roleMember,
};

interface ManagedUser extends TenantUser {
  is_active: boolean;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<ManagedUser[] | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", role: "member" as Role });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await authFetch("/api/v1/manage/users/?page_size=200");
      if (response.status === 403) {
        setForbidden(true);
        return;
      }
      const data: Paginated<ManagedUser> = await response.json();
      setUsers(data.results);
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.users.loadFailed);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await authFetch("/api/v1/manage/users/", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const body = await response.json();
        const first = Object.entries(body)[0];
        setError(first ? `${first[0]}: ${first[1]}` : t.users.saveFailed);
        return;
      }
      setForm({ email: "", password: "", role: "member" });
      await load();
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    } finally {
      setBusy(false);
    }
  }

  async function patchUser(user: ManagedUser, payload: Partial<ManagedUser>) {
    setError("");
    try {
      const response = await authFetch(`/api/v1/manage/users/${user.id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setError(
          response.status === 403 ? t.users.selfEditBlocked : t.users.saveFailed,
        );
        return;
      }
      await load();
    } catch (err) {
      if (err instanceof AuthError) router.push("/login");
    }
  }

  const inputClass =
    "rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-slate-400";

  if (forbidden) {
    return (
      <>
        <Nav />
        <main className="px-8 py-8">
          <p className="text-sm text-slate-500">{t.users.forbidden}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="max-w-4xl px-8 py-8">
        <h1 className="text-2xl font-bold">{t.users.title}</h1>

        <form
          onSubmit={createUser}
          className="mt-5 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4"
        >
          <div className="flex grow flex-col">
            <label className="text-xs text-slate-500">{t.users.email}</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500">{t.users.password}</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500">{t.users.role}</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              className={inputClass}
            >
              {(Object.keys(roleLabels) as Role[]).map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {t.users.create}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {users === null && !error && (
          <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
        )}

        <div className="mt-5 space-y-2">
          {users?.map((user) => (
            <div
              key={user.id}
              className={`flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 ${
                user.is_active ? "" : "opacity-60"
              }`}
            >
              <div className="min-w-0 grow">
                <p className="truncate font-medium">{user.email}</p>
                <p className="text-xs text-slate-500">
                  {user.is_active ? t.users.active : t.users.inactive}
                </p>
              </div>
              <select
                value={user.role}
                onChange={(e) => patchUser(user, { role: e.target.value as Role })}
                className={inputClass}
              >
                {(Object.keys(roleLabels) as Role[]).map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role]}
                  </option>
                ))}
              </select>
              <button
                onClick={() => patchUser(user, { is_active: !user.is_active })}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
              >
                {user.is_active ? t.users.deactivate : t.users.activate}
              </button>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
