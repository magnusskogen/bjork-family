"use client";

import { useState, useTransition } from "react";
import { deleteNotice } from "../actions";
import NoticePill, { type CategoryLite } from "@/components/notice-pill";

export type NoticeRow = {
  id: string;
  dateLabel: string;
  category: CategoryLite;
  text: string;
  by: string;
  canDelete: boolean;
};

function Row({ notice }: { notice: NoticeRow }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove() {
    if (!confirm("Slette denne beskjeden?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteNotice(notice.id);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <li
      className={`flex items-start gap-3 rounded-3xl bg-card p-5 ${pending ? "opacity-50" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[15px] text-ink-faint capitalize">{notice.dateLabel}</p>
        <div className="mt-1.5">
          <NoticePill category={notice.category} text={notice.text} />
        </div>
        <p className="mt-2 text-[13px] text-ink-faint">Lagt inn av {notice.by}</p>
        {error ? (
          <p role="alert" className="mt-2 text-[13px] text-red-700">
            {error}
          </p>
        ) : null}
      </div>

      {notice.canDelete ? (
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          aria-label={`Slett beskjed: ${notice.text}`}
          className="shrink-0 rounded-full border border-line px-4 py-2 text-[15px] text-ink-soft transition active:scale-95"
        >
          Slett
        </button>
      ) : null}
    </li>
  );
}

export default function NoticeList({
  upcoming,
  past,
}: {
  upcoming: NoticeRow[];
  past: NoticeRow[];
}) {
  const [showPast, setShowPast] = useState(false);

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold">Kommende</h2>

      {upcoming.length === 0 ? (
        <p className="mt-3 rounded-3xl bg-card p-5 text-ink-soft">
          Ingen beskjeder framover.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {upcoming.map((notice) => (
            <Row key={notice.id} notice={notice} />
          ))}
        </ul>
      )}

      {past.length > 0 ? (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            aria-expanded={showPast}
            className="w-full rounded-2xl border border-line px-5 py-3 text-ink-soft"
          >
            {showPast ? "Skjul tidligere" : `Vis tidligere (${past.length})`}
          </button>

          {showPast ? (
            <ul className="mt-3 space-y-3 opacity-70">
              {past.map((notice) => (
                <Row key={notice.id} notice={notice} />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
