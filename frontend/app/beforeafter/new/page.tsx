"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, Info, Plus, X } from "lucide-react";
import InfoModal from "@/components/InfoModal";
import Nav from "@/components/Nav";
import { AuthError, authFetch } from "@/lib/auth";
import { t } from "@/lib/i18n";
import type { BeforeAfterForm, GainCategory } from "@/lib/types";

const categoryKeys = Object.keys(t.beforeAfter.categories) as Exclude<
  GainCategory,
  ""
>[];

// Client-side preview of a chosen photo before upload
interface Pick {
  file: File;
  url: string;
}

function PhotoBlock({
  label,
  headerClass,
  picks,
  onAdd,
  onRemove,
}: {
  label: string;
  headerClass: string;
  picks: Pick[];
  onAdd: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className={`px-5 py-2.5 text-sm font-bold text-white ${headerClass}`}>
        {label}
      </div>
      <div className="p-4">
        <p className="text-sm text-slate-600">{t.beforeAfter.photosHint}</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {picks.map((pick, index) => (
            <div key={pick.url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pick.url}
                alt=""
                className="h-20 w-20 rounded-md object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {picks.length < 5 && (
            <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-md border border-dashed border-slate-300 text-slate-400 hover:bg-slate-50">
              <Plus className="h-6 w-6" />
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onAdd(e.target.files)}
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewBeforeAfterPage() {
  const router = useRouter();
  const [showInfo, setShowInfo] = useState(true);
  const [beforePicks, setBeforePicks] = useState<Pick[]>([]);
  const [afterPicks, setAfterPicks] = useState<Pick[]>([]);
  const [form, setForm] = useState({
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
    category: "" as GainCategory,
    problem: "",
    before_note: "",
    after_note: "",
    cost: "",
    cost_note: "",
    budget_code: "",
    gain_continuity: "" as "continuous" | "one_time" | "",
    one_time_gain: "",
    gain_note: "",
    gain_category: "" as GainCategory,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function addPicks(
    files: FileList | null,
    setter: React.Dispatch<React.SetStateAction<Pick[]>>,
  ) {
    if (!files) return;
    const next = Array.from(files)
      .slice(0, 5)
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    setter((prev) => [...prev, ...next].slice(0, 5));
  }

  async function uploadPhotos(formId: number, kind: "before" | "after", picks: Pick[]) {
    for (const pick of picks) {
      const data = new FormData();
      data.append("kind", kind);
      data.append("image", pick.file);
      await authFetch(`/api/v1/beforeafter/${formId}/add_photo/`, {
        method: "POST",
        body: data,
      });
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await authFetch("/api/v1/beforeafter/", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          end_date: form.end_date || null,
          cost: form.cost === "" ? null : form.cost,
          one_time_gain: form.one_time_gain === "" ? null : form.one_time_gain,
        }),
      });
      if (!response.ok) {
        setError(t.beforeAfter.saveFailed);
        return;
      }
      const saved: BeforeAfterForm = await response.json();
      await uploadPhotos(saved.id, "before", beforePicks);
      await uploadPhotos(saved.id, "after", afterPicks);
      router.push(`/beforeafter/${saved.id}`);
    } catch (err) {
      if (err instanceof AuthError) {
        router.push("/login");
        return;
      }
      setError(t.beforeAfter.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-slate-400";
  const label = "text-sm font-medium";

  function categorySelect(
    field: "category" | "gain_category",
    text: string,
  ) {
    return (
      <div>
        <label className={label}>{text}</label>
        <select
          value={form[field]}
          onChange={(e) =>
            setForm({ ...form, [field]: e.target.value as GainCategory })
          }
          className={inputClass}
        >
          <option value="">—</option>
          {categoryKeys.map((key) => (
            <option key={key} value={key}>
              {t.beforeAfter.categories[key]}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <>
      <Nav />
      {showInfo && (
        <InfoModal
          title={t.beforeAfter.info.title}
          whatLabel={t.beforeAfter.info.what}
          whatItems={t.beforeAfter.info.whatItems}
          whatNotLabel={t.beforeAfter.info.whatNot}
          whatNotItems={t.beforeAfter.info.whatNotItems}
          okLabel={t.beforeAfter.info.ok}
          onClose={() => setShowInfo(false)}
        />
      )}
      <main className="max-w-3xl px-8 py-8">
        <div className="relative flex items-center justify-center">
          <Link href="/beforeafter" className="absolute left-0 text-slate-600">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-xl font-bold">{t.beforeAfter.newTitle}</h1>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowInfo(true)}
            className="text-blue-800 hover:text-blue-600"
          >
            <Info className="h-5 w-5" />
          </button>
          <button
            type="submit"
            form="new-ba"
            disabled={busy}
            className="flex items-center gap-2 text-sm font-semibold text-blue-800 hover:text-blue-600 disabled:opacity-50"
          >
            <ArrowRight className="h-4 w-4" />
            {busy ? t.common.saving : t.common.send}
          </button>
        </div>

        <form id="new-ba" onSubmit={handleSubmit} className="mt-4 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>{t.beforeAfter.startDate}</label>
              <input
                type="date"
                required
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={label}>{t.beforeAfter.endDate}</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          {categorySelect("category", t.beforeAfter.category)}

          <div>
            <label className={label}>{t.beforeAfter.problem}</label>
            <textarea
              rows={3}
              value={form.problem}
              onChange={(e) => setForm({ ...form, problem: e.target.value })}
              className={inputClass}
            />
          </div>

          <PhotoBlock
            label={t.beforeAfter.before}
            headerClass="bg-slate-600"
            picks={beforePicks}
            onAdd={(files) => addPicks(files, setBeforePicks)}
            onRemove={(i) => setBeforePicks((p) => p.filter((_, idx) => idx !== i))}
          />
          <div>
            <label className={label}>{t.beforeAfter.beforeNote}</label>
            <textarea
              rows={2}
              value={form.before_note}
              onChange={(e) => setForm({ ...form, before_note: e.target.value })}
              className={inputClass}
            />
          </div>

          <PhotoBlock
            label={t.beforeAfter.after}
            headerClass="bg-blue-800"
            picks={afterPicks}
            onAdd={(files) => addPicks(files, setAfterPicks)}
            onRemove={(i) => setAfterPicks((p) => p.filter((_, idx) => idx !== i))}
          />
          <div>
            <label className={label}>{t.beforeAfter.afterNote}</label>
            <textarea
              rows={2}
              value={form.after_note}
              onChange={(e) => setForm({ ...form, after_note: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>{t.beforeAfter.cost}</label>
              <input
                type="number"
                step="0.01"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={label}>{t.beforeAfter.budgetCode}</label>
              <input
                value={form.budget_code}
                onChange={(e) => setForm({ ...form, budget_code: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={label}>{t.beforeAfter.costNote}</label>
            <textarea
              rows={2}
              value={form.cost_note}
              onChange={(e) => setForm({ ...form, cost_note: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>{t.beforeAfter.gainContinuity}</label>
              <select
                value={form.gain_continuity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    gain_continuity: e.target.value as "continuous" | "one_time" | "",
                  })
                }
                className={inputClass}
              >
                <option value="">—</option>
                <option value="continuous">{t.beforeAfter.continuous}</option>
                <option value="one_time">{t.beforeAfter.oneTime}</option>
              </select>
            </div>
            <div>
              <label className={label}>{t.beforeAfter.oneTimeGain}</label>
              <input
                type="number"
                step="0.01"
                value={form.one_time_gain}
                onChange={(e) => setForm({ ...form, one_time_gain: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={label}>{t.beforeAfter.gainNote}</label>
            <textarea
              rows={2}
              value={form.gain_note}
              onChange={(e) => setForm({ ...form, gain_note: e.target.value })}
              className={inputClass}
            />
          </div>
          {categorySelect("gain_category", t.beforeAfter.gainCategory)}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </main>
    </>
  );
}
