"use client";

import { ToastProvider } from "@/components/Toast";

/** Client-side context providers wrapped around the whole app. */
export default function Providers({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
