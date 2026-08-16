import { describe, expect, it } from "vitest";
import { editableRange, isEditable, toYmd, dateOnly, isoWeekNumber } from "./week";

/**
 * Testene kjører med TZ=America/Los_Angeles (se vitest.config.ts) nettopp for å
 * bevise at logikken ikke er avhengig av systemets tidssone — bare av Europe/Oslo.
 */

function range(iso: string) {
  const { start, end } = editableRange(new Date(iso));
  return { start: toYmd(start), end: toYmd(end) };
}

describe("editableRange", () => {
  it("fredag: kun inneværende uke er åpen", () => {
    // Fredag 14. august 2026, formiddag norsk tid.
    expect(range("2026-08-14T10:00:00+02:00")).toEqual({
      start: "2026-08-10", // mandag
      end: "2026-08-16", // søndag samme uke
    });
  });

  it("lørdag: neste uke åpnes", () => {
    expect(range("2026-08-15T10:00:00+02:00")).toEqual({
      start: "2026-08-10",
      end: "2026-08-23", // søndag i neste uke
    });
  });

  it("søndag: neste uke er fortsatt åpen, og uka starter fortsatt på mandagen før", () => {
    expect(range("2026-08-16T10:00:00+02:00")).toEqual({
      start: "2026-08-10",
      end: "2026-08-23",
    });
  });

  it("mandag: ny uke, neste uke er lukket igjen", () => {
    expect(range("2026-08-17T10:00:00+02:00")).toEqual({
      start: "2026-08-17",
      end: "2026-08-23",
    });
  });

  it("åpner presis lørdag kl. 00:00 norsk tid", () => {
    // Ett minutt før: fortsatt fredag i Oslo.
    expect(range("2026-08-14T23:59:00+02:00").end).toBe("2026-08-16");
    // Presis midnatt: lørdag, neste uke er åpen.
    expect(range("2026-08-15T00:00:00+02:00").end).toBe("2026-08-23");
  });

  it("bruker norsk kalenderdag, ikke UTC-dagen", () => {
    // 2026-08-14T23:30Z er fredag i UTC, men allerede lørdag 01:30 i Oslo.
    expect(range("2026-08-14T23:30:00Z").end).toBe("2026-08-23");
    // 2026-08-16T22:30Z er søndag i UTC, men allerede mandag 00:30 i Oslo.
    expect(range("2026-08-16T22:30:00Z")).toEqual({
      start: "2026-08-17",
      end: "2026-08-23",
    });
  });

  it("krysser årsskiftet uten å hoppe tilbake til januar", () => {
    // Fredag 1. januar 2027. Uka startet mandag 28. desember 2026.
    expect(range("2027-01-01T12:00:00+01:00")).toEqual({
      start: "2026-12-28",
      end: "2027-01-03",
    });

    // Lørdag 2. januar 2027: neste uke åpnes, og strekker seg inn i det nye året.
    expect(range("2027-01-02T12:00:00+01:00")).toEqual({
      start: "2026-12-28",
      end: "2027-01-10",
    });

    // Søndag 3. januar 2027: fortsatt samme uke, mandagen ligger i fjor.
    expect(range("2027-01-03T12:00:00+01:00")).toEqual({
      start: "2026-12-28",
      end: "2027-01-10",
    });

    // Mandag 4. januar 2027: ny uke, helt i det nye året.
    expect(range("2027-01-04T12:00:00+01:00")).toEqual({
      start: "2027-01-04",
      end: "2027-01-10",
    });
  });

  it("håndterer sommertidsovergangen", () => {
    // Søndag 29. mars 2026 er dagen klokka stilles fram i Norge.
    expect(range("2026-03-29T12:00:00+02:00")).toEqual({
      start: "2026-03-23",
      end: "2026-04-05",
    });
  });
});

describe("isEditable", () => {
  const fredag = new Date("2026-08-14T10:00:00+02:00");
  const lordag = new Date("2026-08-15T10:00:00+02:00");

  it("godtar dager i inneværende uke", () => {
    expect(isEditable(dateOnly("2026-08-10"), fredag)).toBe(true);
    expect(isEditable(dateOnly("2026-08-16"), fredag)).toBe(true);
  });

  it("avviser fortid og for langt fram", () => {
    expect(isEditable(dateOnly("2026-08-09"), fredag)).toBe(false);
    expect(isEditable(dateOnly("2026-08-17"), fredag)).toBe(false);
  });

  it("slipper gjennom neste uke i helga", () => {
    expect(isEditable(dateOnly("2026-08-17"), lordag)).toBe(true);
    expect(isEditable(dateOnly("2026-08-23"), lordag)).toBe(true);
    expect(isEditable(dateOnly("2026-08-24"), lordag)).toBe(false);
  });
});

describe("isoWeekNumber", () => {
  it("regner riktig rundt årsskiftet", () => {
    expect(isoWeekNumber(dateOnly("2026-12-28"))).toBe(53);
    expect(isoWeekNumber(dateOnly("2027-01-03"))).toBe(53);
    expect(isoWeekNumber(dateOnly("2027-01-04"))).toBe(1);
    expect(isoWeekNumber(dateOnly("2026-08-10"))).toBe(33);
  });
});
