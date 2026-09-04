"use client";

import Link from "next/link";
import { Link2 } from "lucide-react";

interface RecordCardProps {
  href?: string;
  index: number;
  title: string;
  accent?: string; // tailwind border color for the left strip
  chip?: string; // source chip label, e.g. "Asakai"
  leftMeta: string[];
  rightMeta: string[];
  rightExtra?: React.ReactNode;
  footerLeft?: string;
  footerRight?: React.ReactNode;
  footerAlert?: string; // red alert text, e.g. "20 gün gecikme"
}

/** Op-Ex style record card: colored left strip, numbered title, source chip,
 * left/right meta columns and a footer row. */
export default function RecordCard({
  href,
  index,
  title,
  accent = "border-l-cyan-400",
  chip,
  leftMeta,
  rightMeta,
  rightExtra,
  footerLeft,
  footerRight,
  footerAlert,
}: RecordCardProps) {
  const body = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1">
        <div className="min-w-0">
          <p className="font-semibold">
            {index}. {title}
          </p>
          {leftMeta.map((line) => (
            <p key={line} className="mt-0.5 text-sm text-slate-600">
              {line}
            </p>
          ))}
        </div>
        <div className="flex flex-col items-end gap-1">
          {chip && (
            <span className="flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
              <Link2 className="h-3 w-3" />
              {chip}
            </span>
          )}
          {rightMeta.map((line) => (
            <p key={line} className="text-sm text-slate-600">
              {line}
            </p>
          ))}
          {rightExtra}
        </div>
      </div>
      {(footerLeft || footerRight || footerAlert) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
          <span className="text-sm text-slate-700">{footerLeft}</span>
          <span className="flex items-center gap-3 text-sm text-slate-600">
            {footerRight}
            {footerAlert && (
              <span className="font-semibold text-red-600">{footerAlert}</span>
            )}
          </span>
        </div>
      )}
    </>
  );

  const cardClass = `block rounded-lg border border-slate-200 border-l-4 ${accent} bg-white px-5 py-4 shadow-sm`;

  if (!href) {
    return <div className={cardClass}>{body}</div>;
  }
  return (
    <Link href={href} className={`${cardClass} hover:border-slate-300 ${accent}`}>
      {body}
    </Link>
  );
}
