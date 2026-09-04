"use client";

import { CheckCircle2, Lightbulb, XCircle } from "lucide-react";
import { t } from "@/lib/i18n";

/** "Bilgilendirme" card shown when opening the new-suggestion form:
 * what counts as a suggestion vs. what does not. */
export default function SuggestionInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center gap-2 bg-green-800 px-5 py-3 text-white">
          <Lightbulb className="h-5 w-5" />
          <h2 className="text-lg font-bold">{t.suggestions.info.title}</h2>
        </div>
        <div className="grid gap-4 overflow-y-auto p-5 sm:grid-cols-2">
          <div className="rounded-xl border border-green-100 bg-green-50/60 p-4">
            <h3 className="flex items-center gap-2 font-bold text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              {t.suggestions.info.what}
            </h3>
            <ul className="mt-3 space-y-2.5">
              {t.suggestions.info.whatItems.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-slate-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
            <h3 className="flex items-center gap-2 font-bold text-red-600">
              <XCircle className="h-5 w-5" />
              {t.suggestions.info.whatNot}
            </h3>
            <ul className="mt-3 space-y-2.5">
              {t.suggestions.info.whatNotItems.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-slate-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex justify-center border-t border-slate-100 p-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-green-700 px-10 py-2.5 font-semibold text-white hover:bg-green-600"
          >
            {t.suggestions.info.ok}
          </button>
        </div>
      </div>
    </div>
  );
}
