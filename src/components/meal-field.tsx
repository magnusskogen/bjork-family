"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveMeal } from "@/app/actions";
import { useMember } from "./member-context";

const DEBOUNCE_MS = 800;

type Status = "hvile" | "lagrer" | "lagret" | "feil";

export default function MealField({
  childId,
  childName,
  date,
  initialText,
  initialMeta,
}: {
  childId: string;
  childName: string;
  /** yyyy-MM-dd */
  date: string;
  initialText: string;
  /** «Julie, i går» — regnet ut på serveren. */
  initialMeta: string | null;
}) {
  const { member, ready } = useMember();
  const [text, setText] = useState(initialText);
  const [status, setStatus] = useState<Status>("hvile");
  const [meta, setMeta] = useState(initialMeta);
  const [error, setError] = useState<string | null>(null);

  const savedText = useRef(initialText);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const fieldId = `mat-${childId}-${date}`;

  // Teksten vokser med innholdet i stedet for å få egen scrollbar.
  const autoGrow = useCallback(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(autoGrow, [autoGrow, text]);

  const flush = useCallback(
    async (value: string) => {
      if (timer.current) clearTimeout(timer.current);
      if (!member || value === savedText.current) return;

      setStatus("lagrer");
      setError(null);
      const result = await saveMeal({
        childId,
        date,
        text: value,
        memberId: member.id,
      });

      if (!result.ok) {
        setStatus("feil");
        setError(result.error);
        return;
      }

      savedText.current = value;
      setStatus("lagret");
      setMeta(value.trim() ? `${result.by}, ${result.when}` : null);
    },
    [childId, date, member],
  );

  function onChange(value: string) {
    setText(value);
    setStatus("hvile");
    setError(null);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(value), DEBOUNCE_MS);
  }

  // Lagre med én gang feltet forlates, i stedet for å vente ut debouncen.
  function onBlur() {
    void flush(text);
  }

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const disabled = !ready || !member;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={fieldId}
          className="shrink-0 text-sm font-medium text-ink-soft"
        >
          {childName}
        </label>

        {/*
          «Julie, i går» ligger på samme linje som navnet i stedet for på en egen
          linje under feltet. Det sparer en tekstlinje per barn per dag, altså ti
          linjer i uka.
        */}
        <p
          className="min-w-0 truncate text-[12px] text-ink-faint"
          aria-live="polite"
        >
          {error ? (
            <span className="text-red-700">{error}</span>
          ) : status === "lagrer" ? (
            "Lagrer …"
          ) : status === "lagret" ? (
            "Lagret"
          ) : (
            meta
          )}
        </p>
      </div>

      <textarea
        id={fieldId}
        ref={textarea}
        rows={1}
        value={text}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="Hva skal med?"
        maxLength={500}
        // min-h-11 holder trykkflaten på 44 px selv med én linje tekst.
        className="mt-1 block max-h-40 min-h-11 w-full resize-none overflow-y-auto rounded-xl border border-line bg-paper px-3 py-2 leading-snug outline-none transition focus:border-accent focus:bg-card disabled:opacity-60"
      />
    </div>
  );
}
