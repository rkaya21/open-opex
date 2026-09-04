"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { useToast } from "@/components/Toast";
import { login } from "@/lib/auth";
import { t } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      router.push("/");
    } catch {
      setError(t.login.invalid);
      toast.error(t.login.invalid);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <div className="mb-6">
        <Logo size={40} />
      </div>
      <h1 className="text-2xl font-bold">{t.login.title}</h1>
      <p className="mt-1 text-sm text-slate-600">{t.login.subtitle}</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          type="email"
          required
          placeholder={t.login.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="password"
          required
          placeholder={t.login.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-teal-600 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50"
        >
          {busy ? t.login.submitting : t.login.submit}
        </button>
      </form>
    </main>
  );
}
