"use client";

import { useState, useTransition } from "react";
import { deleteRoutine } from "../actions";
import RoutinePill, { type RoutineLite } from "@/components/routine-pill";

export type RoutineRow = RoutineLite;

export type WeekdayGroup = {
  weekday: number;
  name: string;
  routines: RoutineRow[];
};

function Row({ routine }: { routine: RoutineRow }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove() {
    if (!confirm(`Fjerne «${routine.text}» fra alle uker?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteRoutine(routine.id);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <li
      className={`flex items-start gap-3 rounded-3xl bg-card p-5 ${pending ? "opacity-50" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <RoutinePill routine={routine} />
        {error ? (
          <p role="alert" className="mt-2 text-[13px] text-red-700">
            {error}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={remove}
        disabled={pending}
        aria-label={`Fjern fast avtale: ${routine.text}`}
        className="shrink-0 rounded-full border border-line px-4 py-2 text-[15px] text-ink-soft transition active:scale-95"
      >
        Fjern
      </button>
    </li>
  );
}

export default function RoutineList({ groups }: { groups: WeekdayGroup[] }) {
  if (groups.length === 0) {
    return (
      <p className="mt-8 rounded-3xl bg-card p-5 text-ink-soft">
        Ingen faste avtaler ennå. Legg inn den første over — for eksempel
        trening på mandager.
      </p>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {groups.map((group) => (
        <section key={group.weekday}>
          <h2 className="text-lg font-semibold capitalize">{group.name}</h2>
          <ul className="mt-3 space-y-3">
            {group.routines.map((routine) => (
              <Row key={routine.id} routine={routine} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
