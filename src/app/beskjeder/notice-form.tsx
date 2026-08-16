"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { addNotice } from "../actions";
import { useMember } from "@/components/member-context";
import { NEW_CATEGORY } from "@/lib/format";
import type { CategoryLite } from "@/components/notice-pill";

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
  categories,
  minDate,
  maxDate,
  defaultDate,
}: {
  categories: CategoryLite[];
  minDate: string;
  maxDate: string;
  defaultDate: string;
}) {
  const { member, ready } = useMember();
  const [state, formAction] = useActionState(addNotice, { ok: false });

  return (
    <form action={formAction} className="rounded-3xl bg-card p-5">
      <input type="hidden" name="memberId" value={member?.id ?? ""} />

      {/*
        Nøkkelen bytter hver gang en beskjed er lagret. Da monteres feltene på
        nytt og tømmer seg selv — enklere enn å nullstille dem for hånd.
      */}
      <Fields
        key={state.ok ? state.id : "start"}
        categories={categories}
        minDate={minDate}
        maxDate={maxDate}
        defaultDate={defaultDate}
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
  minDate,
  maxDate,
  defaultDate,
}: {
  categories: CategoryLite[];
  minDate: string;
  maxDate: string;
  defaultDate: string;
}) {
  const [makingNew, setMakingNew] = useState(false);
  const newCategory = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (makingNew) newCategory.current?.focus();
  }, [makingNew]);

  return (
    <>
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
          <label
            htmlFor="categoryId"
            className="text-[15px] font-medium text-ink-soft"
          >
            Hvor fra
          </label>
          <select
            id="categoryId"
            name="categoryId"
            required
            defaultValue={categories[0]?.id ?? ""}
            onChange={(e) => setMakingNew(e.target.value === NEW_CATEGORY)}
            className="mt-1.5 block w-full rounded-2xl border border-line bg-paper px-4 py-3 outline-none focus:border-accent"
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
          <label
            htmlFor="newCategory"
            className="text-[15px] font-medium text-ink-soft"
          >
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
            className="mt-1.5 block w-full rounded-2xl border border-line bg-paper px-4 py-3 outline-none focus:border-accent"
          />
          <p className="mt-1 px-1 text-[13px] text-ink-faint">
            Den får en farge automatisk og dukker opp i lista neste gang.
          </p>
        </div>
      ) : null}

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
    </>
  );
}
