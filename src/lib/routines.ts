/**
 * Faste avtaler: det som gjentar seg hver uke. Modellen er en regel — ukedag
 * pluss valgfritt klokkeslett — og forekomstene regnes ut når uka vises.
 *
 * Ligger for seg selv fordi både skjemaet (klient) og server actions trenger
 * det samme. En `"use server"`-fil kan bare eksportere async-funksjoner, så
 * konstantene kan ikke bo der.
 */

/** Sendes som person-verdi når avtalen gjelder hele familien. */
export const WHOLE_FAMILY = "__alle__";

export type RoutineTime = { ok: true; time: string | null } | { ok: false };

/**
 * Klokkeslett skrives som folk skriver dem. «1930», «19.30» og «19:30» blir
 * alle «19:30», og tom tekst betyr at avtalen ikke har noe fast klokkeslett.
 *
 * Returnerer et resultatobjekt framfor å kaste, slik at «tom» og «tullete»
 * kan skilles fra hverandre — begge ville blitt `null` ellers.
 */
export function normaliseTime(input: string): RoutineTime {
  const raw = input.trim();
  if (!raw) return { ok: true, time: null };

  const match = /^(\d{1,2})[.:]?(\d{2})$/.exec(raw);
  if (!match) return { ok: false };

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return { ok: false };

  return {
    ok: true,
    time: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
  };
}

/**
 * Rekkefølgen avtalene vises i på en dag: tidligst først, og de uten
 * klokkeslett nederst — de sier ingenting om når på dagen det skjer.
 */
export function compareRoutines(
  a: { time: string | null; text: string },
  b: { time: string | null; text: string },
): number {
  if (a.time !== b.time) {
    if (a.time === null) return 1;
    if (b.time === null) return -1;
    return a.time < b.time ? -1 : 1;
  }
  return a.text.localeCompare(b.text, "nb-NO");
}
