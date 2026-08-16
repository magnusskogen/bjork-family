"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { addNotice } from "../actions";
import { useMember } from "@/components/member-context";
import { SOURCE_LABELS } from "@/lib/format";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-5 w-full rounded-2xl bg-accent px-6 py-4 text-lg font-medium text-white transition active:scale-[0.99] disabled:opacity-50"
    >
      {pending ? "Lagrer …" : "Legg til beskjed"}
    </button>
  );
}

export default function NoticeForm({
  minDate,
  maxDate,
  defaultDate,
}: {
  minDate: string;
  maxDate: string;
  defaultDate: string;
}) {
  const { member, ready } = useMember();
  const [state, formAction] = useActionState(addNotice, { ok: false });
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state]);

  return (
    <form ref={form} action={formAction} className="rounded-3xl bg-card p-5">
      <input type="hidden" name="memberId" value={member?.id ?? ""} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className="text-[15px] font-medium text-ink-soft">
            Dato
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            min={minDate}
            max={maxDate}
            defaultValue={defaultDate}
            className="mt-1.5 block w-full rounded-2xl border border-line bg-paper px-4 py-3 outline-none focus:border-accent"
          />
        </div>

        <div>
          <label htmlFor="source" className="text-[15px] font-medium text-ink-soft">
            Hvor fra
          </label>
          <select
            id="source"
            name="source"
            required
            defaultValue="SKOLE"
            className="mt-1.5 block w-full rounded-2xl border border-line bg-paper px-4 py-3 outline-none focus:border-accent"
          >
            {Object.entries(SOURCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="text" className="text-[15px] font-medium text-ink-soft">
          Beskjed
        </label>
        <textarea
          id="text"
          name="text"
          rows={3}
          required
          maxLength={1000}
          placeholder="Gymtøy, tur, foreldremøte …"
          className="mt-1.5 block w-full resize-none rounded-2xl border border-line bg-paper px-4 py-3 leading-relaxed outline-none focus:border-accent"
        />
      </div>

      {state.error ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      {ready && !member ? (
        <p className="mt-3 text-sm text-ink-faint">Velg hvem du er først.</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
