import { describe, expect, it } from "vitest";
import { compareRoutines, normaliseTime } from "./routines";

describe("normaliseTime", () => {
  const time = (input: string) => normaliseTime(input);

  it("tar imot klokkeslett slik folk skriver dem", () => {
    expect(time("19:30")).toEqual({ ok: true, time: "19:30" });
    expect(time("1930")).toEqual({ ok: true, time: "19:30" });
    expect(time("19.30")).toEqual({ ok: true, time: "19:30" });
    expect(time(" 19:30 ")).toEqual({ ok: true, time: "19:30" });
  });

  it("fyller ut ledende null", () => {
    expect(time("7:05")).toEqual({ ok: true, time: "07:05" });
    expect(time("705")).toEqual({ ok: true, time: "07:05" });
  });

  it("tom tekst betyr ingen fast klokke, ikke en feil", () => {
    expect(time("")).toEqual({ ok: true, time: null });
    expect(time("   ")).toEqual({ ok: true, time: null });
  });

  it("avviser det som ikke er et klokkeslett", () => {
    expect(time("19:60")).toEqual({ ok: false });
    expect(time("24:00")).toEqual({ ok: false });
    expect(time("halv åtte")).toEqual({ ok: false });
    expect(time("19")).toEqual({ ok: false });
    expect(time("19:3")).toEqual({ ok: false });
  });

  it("godtar ytterpunktene i døgnet", () => {
    expect(time("00:00")).toEqual({ ok: true, time: "00:00" });
    expect(time("23:59")).toEqual({ ok: true, time: "23:59" });
  });
});

describe("compareRoutines", () => {
  const sort = (routines: { time: string | null; text: string }[]) =>
    [...routines].sort(compareRoutines).map((r) => `${r.time ?? "–"} ${r.text}`);

  it("setter tidligste avtale først", () => {
    expect(
      sort([
        { time: "19:30", text: "Trening" },
        { time: "08:15", text: "Kor" },
        { time: "18:30", text: "Svømming" },
      ]),
    ).toEqual(["08:15 Kor", "18:30 Svømming", "19:30 Trening"]);
  });

  it("legger avtaler uten klokkeslett nederst", () => {
    expect(
      sort([
        { time: null, text: "Søppel ut" },
        { time: "19:30", text: "Trening" },
      ]),
    ).toEqual(["19:30 Trening", "– Søppel ut"]);
  });

  it("sorterer likt klokkeslett på tekst, med norsk alfabet", () => {
    expect(
      sort([
        { time: "17:00", text: "Ålesund" },
        { time: "17:00", text: "Bading" },
        { time: "17:00", text: "Aikido" },
      ]),
    ).toEqual(["17:00 Aikido", "17:00 Bading", "17:00 Ålesund"]);
  });
});
