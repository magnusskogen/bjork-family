import type { CategoryLite } from "./notice-pill";

export type RoutineLite = {
  id: string;
  time: string | null;
  who: string | null;
  text: string;
  category: CategoryLite;
};

/**
 * Faste avtaler ser ut som beskjeder — samme farger, samme form — men leder med
 * klokkeslettet. Det er det som skiller «hver mandag 19:30» fra «husk gymtøy i
 * morgen». Uten klokkeslett faller den tilbake på kategorinavnet, så pillen
 * aldri står uten en ledetekst.
 */
export default function RoutinePill({ routine }: { routine: RoutineLite }) {
  const label = routine.time ?? routine.category.name;
  const rest = [routine.who, routine.text].filter(Boolean).join(" ");

  return (
    <span
      className="kategori inline-flex max-w-full items-baseline gap-1.5 rounded-full px-3 py-1 text-[13px] leading-snug"
      data-farge={routine.category.color}
    >
      <span className={`font-medium ${routine.time ? "tabular-nums" : ""}`}>
        {label}
      </span>
      <span className="opacity-90">{rest}</span>
    </span>
  );
}
