"use client";

import { Check, Lightbulb, X } from "lucide-react";
import { t } from "@/lib/i18n";

/** "Bilgilendirme" card shown when opening the new-suggestion form:
 * an OPEX mini-glossary of what counts as a suggestion vs. what does not.
 * Intentionally styled with our own identity (emerald/rose, icon bullets). */
export default function SuggestionInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
            <Lightbulb className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-bold tracking-wide">
            {t.suggestions.info.title}
          </h2>
        </div>

        <div className="grid gap-6 overflow-y-auto p-6 sm:grid-cols-2">
          <div className="rounded-xl border-l-4 border-emerald-500 bg-slate-50/70 p-5">
            <h3 className="text-base font-bold text-emerald-700">
              {t.suggestions.info.what}
            </h3>
            <div className="mt-1 h-0.5 w-12 rounded bg-emerald-500" />
            <ul className="mt-4 space-y-2.5">
              {t.suggestions.info.whatItems.map((item) => (
                <li key={item} className="flex gap-2.5 text-[13px] leading-snug text-slate-700">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border-l-4 border-rose-500 bg-slate-50/70 p-5">
            <h3 className="text-base font-bold text-rose-600">
              {t.suggestions.info.whatNot}
            </h3>
            <div className="mt-1 h-0.5 w-12 rounded bg-rose-500" />
            <ul className="mt-4 space-y-2.5">
              {t.suggestions.info.whatNotItems.map((item) => (
                <li key={item} className="flex gap-2.5 text-[13px] leading-snug text-slate-700">
                  <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-center border-t border-slate-100 bg-slate-50/50 p-4">
          <button
            onClick={onClose}
            className="rounded-full bg-slate-900 px-12 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            {t.suggestions.info.ok}
          </button>
        </div>
      </div>
    </div>
  );
}
