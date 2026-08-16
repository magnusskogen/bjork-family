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

/**
 * Sendes som kategori-verdi når familien vil lage en ny i samme slengen.
 * Ligger her og ikke i actions.ts fordi en `"use server"`-fil bare kan
 * eksportere async-funksjoner.
 */
export const NEW_CATEGORY = "__ny__";

/**
 * Fargene en kategori kan ha. Nøklene må finnes som `data-farge` i globals.css.
 * Nye kategorier får den fargen som er minst brukt fra før.
 */
export const CATEGORY_COLORS = [
  "blaa",
  "lilla",
  "gul",
  "gronn",
  "rosa",
  "teal",
  "oransje",
  "graa",
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export function isCategoryColor(value: string): value is CategoryColor {
  return (CATEGORY_COLORS as readonly string[]).includes(value);
}

export function nextColor(used: string[]): CategoryColor {
  const count = new Map<string, number>(CATEGORY_COLORS.map((c) => [c, 0]));
  for (const color of used) {
    if (count.has(color)) count.set(color, count.get(color)! + 1);
  }
  let best: CategoryColor = CATEGORY_COLORS[0];
  for (const color of CATEGORY_COLORS) {
    if (count.get(color)! < count.get(best)!) best = color;
  }
  return best;
}

/**
 * Kategorinavn skrives som familien skriver dem, men sammenlignes uten hensyn
 * til store bokstaver og ekstra mellomrom, så «trening» og «Trening» ikke blir
 * to kategorier.
 */
export function normaliseCategoryName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function sameCategoryName(a: string, b: string): boolean {
  return a.toLocaleLowerCase("nb-NO") === b.toLocaleLowerCase("nb-NO");
}

export { toYmd };
