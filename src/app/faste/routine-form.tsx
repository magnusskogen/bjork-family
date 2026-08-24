"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { addRoutine } from "../actions";
import { useMember } from "@/components/member-context";
import { NEW_CATEGORY } from "@/lib/format";
import { WHOLE_FAMILY } from "@/lib/routines";
import { WEEKDAYS_MON_FRI, weekdayNameOf } from "@/lib/week";
import type { CategoryLite } from "@/components/notice-pill";

const field =
  "mt-1.5 block w-full rounded-2xl border border-line bg-paper px-4 py-3 outline-none focus:border-accent";
const label = "text-[15px] font-medium text-ink-soft";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-5 w-full rounded-2xl bg-accent px-6 py-4 text-lg font-medium text-white transition active:scale-[0.99] disabled:opacity-50"
    >
      {pending ? "Lagrer …" : "Legg til fast avtale"}
    </button>
  );
}

export default function RoutineForm({
  categories,
  defaultWeekday,
}: {
  categories: CategoryLite[];
  defaultWeekday: number;
}) {
  const { member, ready } = useMember();
  const [state, formAction] = useActionState(addRoutine, { ok: false });

  return (
    <form action={formAction} className="rounded-3xl bg-card p-5">
      <input type="hidden" name="memberId" value={member?.id ?? ""} />

      {/* Samme knep som i beskjedskjemaet: ny nøkkel etter lagring tømmer feltene. */}
      <Fields
        key={state.ok ? state.id : "start"}
        categories={categories}
        defaultWeekday={defaultWeekday}
      />

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

function Fields({
  categories,
  defaultWeekday,
}: {
  categories: CategoryLite[];
  defaultWeekday: number;
}) {
  const { members } = useMember();
  const [makingNew, setMakingNew] = useState(false);
  const newCategory = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (makingNew) newCategory.current?.focus();
  }, [makingNew]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="subjectId" className={label}>
            Hvem
          </label>
          <select
            id="subjectId"
            name="subjectId"
            required
            defaultValue={WHOLE_FAMILY}
            className={field}
          >
            <option value={WHOLE_FAMILY}>Hele familien</option>
            {members.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="weekday" className={label}>
            Dag
          </label>
          <select
            id="weekday"
            name="weekday"
            required
            defaultValue={defaultWeekday}
            className={`${field} capitalize`}
          >
            {WEEKDAYS_MON_FRI.map((weekday) => (
              <option key={weekday} value={weekday}>
                {weekdayNameOf(weekday)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="time" className={label}>
            Klokka
          </label>
          <input id="time" name="time" type="time" className={field} />
          <p className="mt-1 px-1 text-[13px] text-ink-faint">
            Kan stå tom hvis det ikke er noe fast tidspunkt.
          </p>
        </div>

        <div>
          <label htmlFor="categoryId" className={label}>
            Kategori
          </label>
          <select
            id="categoryId"
            name="categoryId"
            required
            defaultValue={categories[0]?.id ?? ""}
            onChange={(e) => setMakingNew(e.target.value === NEW_CATEGORY)}
            className={field}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
            <option value={NEW_CATEGORY}>+ Ny kategori …</option>
          </select>
        </div>
      </div>

      {makingNew ? (
        <div className="mt-4">
          <label htmlFor="newCategory" className={label}>
            Navn på ny kategori
          </label>
          <input
            id="newCategory"
            name="newCategory"
            ref={newCategory}
            type="text"
            required
            maxLength={40}
            placeholder="Trening, korps, besteforeldre …"
            className={field}
          />
          <p className="mt-1 px-1 text-[13px] text-ink-faint">
            Den deles med beskjedene, og får en farge automatisk.
          </p>
        </div>
      ) : null}

      <div className="mt-4">
        <label htmlFor="text" className={label}>
          Hva
        </label>
        <input
          id="text"
          name="text"
          type="text"
          required
          maxLength={200}
          placeholder="Trening, korps, svømming …"
          className={field}
        />
      </div>
    </>
  );
}
