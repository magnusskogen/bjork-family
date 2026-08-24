"use client";

import { useState, useTransition } from "react";
import { approveProposals, rejectProposals } from "../actions";
import { useMember } from "@/components/member-context";
import type { CategoryLite } from "@/components/notice-pill";

export type Proposal = {
  id: string;
  subject: string | null;
  text: string;
  who: string | null;
  category: CategoryLite;
  /** Dagen planen oppga, hvis den kan skrives til nå. Ellers null. */
  day: string | null;
};

export type Day = { ymd: string; label: string };

/** Ikke valgt dag. Forslag uten dag kan ikke godkjennes. */
const NO_DAY = "";

export default function ProposalList({
  proposals,
  days,
}: {
  proposals: Proposal[];
  days: Day[];
}) {
  const { member } = useMember();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Dagen modellen fant er utgangspunktet; resten må velges.
  const [chosen, setChosen] = useState<Record<string, string>>(() =>
    Object.fromEntries(proposals.map((p) => [p.id, p.day ?? NO_DAY])),
  );
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  if (proposals.length === 0) return null;

  const keeping = proposals.filter((p) => !skipped.has(p.id));
  const ready = keeping.filter((p) => chosen[p.id] !== NO_DAY);
  const missingDay = keeping.length - ready.length;

  function toggle(id: string) {
    setSkipped((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function save() {
    if (!member) return;
    setError(null);
    startTransition(async () => {
      const result = await approveProposals(
        ready.map((p) => ({ id: p.id, date: chosen[p.id] })),
        member.id,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // Det som ble stående uten dag forkastes sammen med det avkryssede,
      // så lista er tom etterpå og ingenting blir hengende igjen.
      const dropped = proposals
        .filter((p) => !ready.some((r) => r.id === p.id))
        .map((p) => p.id);
      if (dropped.length > 0) await rejectProposals(dropped);
    });
  }

  return (
    <div className={`mt-8 ${pending ? "opacity-50" : ""}`}>
      <h2 className="text-lg font-semibold">Fant i planen</h2>
      <p className="mt-1 text-[15px] text-ink-soft">
        Velg dag for hver lekse. Fjern det du ikke vil ha med.
      </p>

      <ul className="mt-4 space-y-3">
        {proposals.map((proposal) => {
          const off = skipped.has(proposal.id);
          return (
            <li
              key={proposal.id}
              className={`rounded-3xl bg-card p-5 ${off ? "opacity-40" : ""}`}
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-2 text-[15px]">
                    {proposal.subject ? (
                      <span
                        className="kategori rounded-full px-2.5 py-0.5 text-[13px] font-medium"
                        data-farge={proposal.category.color}
                      >
                        {proposal.subject}
                      </span>
                    ) : null}
                    {proposal.who ? (
                      <span className="text-[13px] text-ink-faint">
                        {proposal.who}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1.5 leading-snug whitespace-pre-wrap">
                    {proposal.text}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggle(proposal.id)}
                  aria-pressed={off}
                  aria-label={`${off ? "Ta med" : "Fjern"}: ${proposal.text}`}
                  className="shrink-0 rounded-full border border-line px-4 py-2 text-[15px] text-ink-soft transition active:scale-95"
                >
                  {off ? "Ta med" : "Fjern"}
                </button>
              </div>

              {!off ? (
                <div className="mt-3">
                  <label
                    htmlFor={`dag-${proposal.id}`}
                    className="text-[13px] text-ink-faint"
                  >
                    Dag
                  </label>
                  <select
                    id={`dag-${proposal.id}`}
                    value={chosen[proposal.id] ?? NO_DAY}
                    onChange={(e) =>
                      setChosen((c) => ({ ...c, [proposal.id]: e.target.value }))
                    }
                    className="mt-1 block w-full rounded-2xl border border-line bg-paper px-4 py-3 capitalize outline-none focus:border-accent"
                  >
                    <option value={NO_DAY}>Ikke valgt</option>
                    {days.map((day) => (
                      <option key={day.ymd} value={day.ymd}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {missingDay > 0 ? (
        <p className="mt-3 text-[15px] text-ink-faint">
          {missingDay} {missingDay === 1 ? "lekse mangler" : "lekser mangler"} dag
          og blir ikke lagt inn.
        </p>
      ) : null}

      <button
        type="button"
        onClick={save}
        disabled={pending || ready.length === 0 || !member}
        className="mt-4 w-full rounded-2xl bg-accent px-6 py-4 text-lg font-medium text-white transition active:scale-[0.99] disabled:opacity-50"
      >
        {pending
          ? "Lagrer …"
          : `Legg inn ${ready.length} ${ready.length === 1 ? "lekse" : "lekser"}`}
      </button>
    </div>
  );
}
