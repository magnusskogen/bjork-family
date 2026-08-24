"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { readPlan } from "../actions";
import { useMember } from "@/components/member-context";
import type { CategoryLite } from "@/components/notice-pill";

const field =
  "mt-1.5 block w-full rounded-2xl border border-line bg-paper px-4 py-3 outline-none focus:border-accent";
const label = "text-[15px] font-medium text-ink-soft";

function SubmitButton({ ready }: { ready: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || !ready}
      className="mt-5 w-full rounded-2xl bg-accent px-6 py-4 text-lg font-medium text-white transition active:scale-[0.99] disabled:opacity-50"
    >
      {pending ? "Leser planen …" : "Les av planen"}
    </button>
  );
}

export default function PlanUpload({
  categories,
  pupils,
}: {
  categories: CategoryLite[];
  pupils: { id: string; name: string }[];
}) {
  const { member, ready } = useMember();
  const [state, formAction] = useActionState(readPlan, { ok: false });
  const [fileName, setFileName] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  return (
    <form action={formAction} className="rounded-3xl bg-card p-5">
      <input type="hidden" name="memberId" value={member?.id ?? ""} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="childId" className={label}>
            Hvem er planen for
          </label>
          <select
            id="childId"
            name="childId"
            required
            defaultValue={pupils[0]?.id ?? ""}
            className={field}
          >
            {pupils.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </select>
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
            className={field}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <span className={label}>Planen</span>
        <input
          ref={input}
          id="plan"
          name="plan"
          type="file"
          required
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          className="sr-only"
        />
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="mt-1.5 flex w-full items-center gap-3 rounded-2xl border border-dashed border-line bg-paper px-4 py-5 text-left transition active:scale-[0.99]"
        >
          <span aria-hidden="true" className="text-2xl">
            📄
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px]">
              {fileName ?? "Velg bilde eller PDF"}
            </span>
            <span className="block text-[13px] text-ink-faint">
              Skjermbilde, foto eller PDF av lekseplanen
            </span>
          </span>
        </button>
      </div>

      {state.error ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      {state.ok && state.found ? (
        <p role="status" className="mt-3 text-sm text-accent">
          Fant {state.found} {state.found === 1 ? "lekse" : "lekser"}. Se over
          under.
        </p>
      ) : null}

      {ready && !member ? (
        <p className="mt-3 text-sm text-ink-faint">Velg hvem du er først.</p>
      ) : null}

      <SubmitButton ready={Boolean(member)} />
    </form>
  );
}
