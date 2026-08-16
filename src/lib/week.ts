import { formatInTimeZone } from "date-fns-tz";

/** Appen regner alltid i norsk tid, uansett hvor serveren eller klienten står. */
export const TIME_ZONE = "Europe/Oslo";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * En "dato" i denne appen er alltid midnatt UTC på en kalenderdag.
 * Det er samme representasjon som Postgres `date` gir oss tilbake via Prisma,
 * så datoer fra databasen og datoer regnet ut her kan sammenlignes direkte.
 */
export function dateOnly(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

/** `yyyy-MM-dd` for en dato-verdi. Leser UTC-feltene, aldri lokal tid. */
export function toYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Hvilken kalenderdag er det i Oslo akkurat nå? */
export function todayInOslo(now: Date = new Date()): Date {
  return dateOnly(formatInTimeZone(now, TIME_ZONE, "yyyy-MM-dd"));
}

/** Mandag i uka som inneholder `date`. */
export function startOfWeekOslo(date: Date): Date {
  const weekday = date.getUTCDay(); // 0 = søndag ... 6 = lørdag
  const daysSinceMonday = (weekday + 6) % 7;
  return addDays(date, -daysSinceMonday);
}

/**
 * Hvilke datoer kan redigeres akkurat nå?
 *
 * Inneværende uke er alltid åpen. Fra lørdag kl. 00:00 (norsk tid) åpnes
 * også neste uke, slik at helga kan brukes til å planlegge uka som kommer.
 *
 * Returnerer mandag i inneværende uke, og søndag i inneværende uke —
 * eller søndag i neste uke dersom `now` er lørdag eller søndag.
 */
export function editableRange(now: Date): { start: Date; end: Date } {
  const today = todayInOslo(now);
  const start = startOfWeekOslo(today);
  const weekday = today.getUTCDay();
  const isWeekend = weekday === 6 || weekday === 0; // lørdag eller søndag
  const end = addDays(start, isWeekend ? 13 : 6);
  return { start, end };
}

/**
 * Hvilken uke skal appen vise når man åpner den?
 *
 * Mandag til fredag: inneværende uke. Fra lørdag: neste uke — da er
 * mandag–fredag i denne uka allerede unnagjort, og det er neste uke man
 * planlegger. Samme skille som i `editableRange`, så uka man får se er alltid
 * en uke man kan skrive i.
 */
export function defaultWeekStart(now: Date = new Date()): Date {
  const today = todayInOslo(now);
  const weekday = today.getUTCDay();
  const isWeekend = weekday === 6 || weekday === 0; // lørdag eller søndag
  return addDays(startOfWeekOslo(today), isWeekend ? 7 : 0);
}

/** Ligger datoen innenfor det som kan redigeres nå? */
export function isEditable(date: Date, now: Date = new Date()): boolean {
  const { start, end } = editableRange(now);
  const t = date.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

/**
 * Hard validering for server actions. Klientens klokke og tidssone er
 * uinteressant — her er det serverens `new Date()` og Europe/Oslo som gjelder.
 */
export function assertEditable(date: Date, now: Date = new Date()): void {
  if (!isEditable(date, now)) {
    const { start, end } = editableRange(now);
    throw new Error(
      `Datoen ${toYmd(date)} kan ikke endres nå. Du kan endre fra ${toYmd(start)} til ${toYmd(end)}.`,
    );
  }
}

/** Mandag til fredag i uka som starter på `weekStart`. */
export function weekdaysOf(weekStart: Date): Date[] {
  return [0, 1, 2, 3, 4].map((offset) => addDays(weekStart, offset));
}

/**
 * Etikett for ukevelgeren, relativt til uka vi står i nå.
 * Uker lenger unna får datointervall i stedet for navn.
 */
export function weekLabel(weekStart: Date, now: Date = new Date()): string {
  const currentWeekStart = startOfWeekOslo(todayInOslo(now));
  const weeksAway = Math.round(
    (weekStart.getTime() - currentWeekStart.getTime()) / (7 * DAY_MS),
  );
  if (weeksAway === 0) return "Denne uka";
  if (weeksAway === 1) return "Neste uke";
  if (weeksAway === -1) return "Forrige uke";
  return `${formatDayMonth(weekStart)} – ${formatDayMonth(addDays(weekStart, 6))}`;
}

const MONTHS_SHORT = [
  "jan",
  "feb",
  "mar",
  "apr",
  "mai",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "des",
];

const WEEKDAYS = [
  "søndag",
  "mandag",
  "tirsdag",
  "onsdag",
  "torsdag",
  "fredag",
  "lørdag",
];

const MONTHS_LONG = [
  "januar",
  "februar",
  "mars",
  "april",
  "mai",
  "juni",
  "juli",
  "august",
  "september",
  "oktober",
  "november",
  "desember",
];

export function formatDayMonth(date: Date): string {
  return `${date.getUTCDate()}. ${MONTHS_SHORT[date.getUTCMonth()]}`;
}

/** «torsdag 20. august» */
export function formatLongDate(date: Date): string {
  return `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()}. ${MONTHS_LONG[date.getUTCMonth()]}`;
}

export function weekdayName(date: Date): string {
  return WEEKDAYS[date.getUTCDay()];
}

/** ISO-ukenummer, kun til visning i toppen av uka. */
export function isoWeekNumber(date: Date): number {
  const thursday = addDays(startOfWeekOslo(date), 3);
  const firstThursday = addDays(
    startOfWeekOslo(dateOnly(`${thursday.getUTCFullYear()}-01-04`)),
    3,
  );
  return (
    1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * DAY_MS))
  );
}
