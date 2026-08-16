import { formatInTimeZone } from "date-fns-tz";
import { TIME_ZONE, todayInOslo, toYmd, dateOnly } from "./week";

/**
 * «Julie, i går» — kort og lavmælt. Regnes ut på serveren så teksten er lik
 * uansett hva telefonen tror klokka er.
 */
export function relativeNorwegian(when: Date, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - when.getTime()) / 60000);
  if (minutes < 1) return "nå nettopp";
  if (minutes < 60) return `for ${minutes} min siden`;

  const day = dateOnly(formatInTimeZone(when, TIME_ZONE, "yyyy-MM-dd"));
  const today = todayInOslo(now);
  const daysAgo = Math.round((today.getTime() - day.getTime()) / 86400000);
  const clock = formatInTimeZone(when, TIME_ZONE, "HH:mm");

  if (daysAgo === 0) return `i dag ${clock}`;
  if (daysAgo === 1) return `i går ${clock}`;
  if (daysAgo > 1 && daysAgo < 7) return `for ${daysAgo} dager siden`;
  return formatInTimeZone(when, TIME_ZONE, "d. MMM").toLowerCase();
}

export const SOURCE_LABELS = {
  SKOLE: "Skole",
  UNGDOMSSKOLE: "Ungdomsskole",
  BARNEHAGE: "Barnehage",
} as const;

export type SourceKey = keyof typeof SOURCE_LABELS;

export function isSourceKey(value: unknown): value is SourceKey {
  return typeof value === "string" && value in SOURCE_LABELS;
}

export { toYmd };
