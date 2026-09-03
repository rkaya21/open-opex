import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "open-opex",
  description:
    "Açık kaynak Operasyonel Mükemmellik platformu — süreçler, KPI'lar, sürekli iyileştirme, denetimler",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
