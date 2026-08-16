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
  /** «Marte, i går» — regnet ut på serveren. */
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
      <label
        htmlFor={fieldId}
        className="text-[15px] font-medium text-ink-soft"
      >
        {childName}
      </label>

      <textarea
        id={fieldId}
        ref={textarea}
        rows={2}
        value={text}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="Hva skal med?"
        maxLength={500}
        className="mt-1.5 block w-full resize-none rounded-2xl border border-line bg-paper px-4 py-3 leading-relaxed outline-none transition focus:border-accent focus:bg-card disabled:opacity-60"
      />

      <p
        className="mt-1 min-h-5 px-1 text-[13px] text-ink-faint"
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
  );
}
