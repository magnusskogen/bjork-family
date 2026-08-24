import { describe, expect, it, vi } from "vitest";

// homework.ts er merket "server-only". Det kaster utenfor en serverkontekst,
// og testene bryr seg bare om tolkingen av svaret — ikke om nettverkskallet.
vi.mock("server-only", () => ({}));

const { NO_DAY, parseRows } = await import("./homework");

function svar(lekser: unknown) {
  return JSON.stringify({ lekser });
}

describe("parseRows", () => {
  it("plukker ut fag, lekse og dag", () => {
    expect(
      parseRows(
        svar([
          { fag: "Matte", lekse: "Gjør utdelt ark ferdig", dag: "fredag" },
          { fag: "Samfunnsfag", lekse: "Se en nyhetssending", dag: "onsdag" },
        ]),
      ),
    ).toEqual([
      { subject: "Matte", task: "Gjør utdelt ark ferdig", weekday: 5 },
      { subject: "Samfunnsfag", task: "Se en nyhetssending", weekday: 3 },
    ]);
  });

  it("lar dagen stå åpen når planen ikke sier noe", () => {
    const rows = parseRows(
      svar([{ fag: "Tysk", lekse: "Øv på å presentere deg", dag: NO_DAY }]),
    );
    expect(rows).toEqual([
      { subject: "Tysk", task: "Øv på å presentere deg", weekday: null },
    ]);
  });

  it("behandler en ukjent dag som ingen dag, ikke som mandag", () => {
    // Helg finnes ikke i ukevisningen, og tull skal ikke bli til dag 1.
    for (const dag of ["lørdag", "søndag", "tulledag", "", "3"]) {
      expect(parseRows(svar([{ fag: "X", lekse: "Y", dag }]))[0].weekday).toBe(
        null,
      );
    }
  });

  it("tar dagen uansett store bokstaver og mellomrom", () => {
    expect(
      parseRows(svar([{ fag: "X", lekse: "Y", dag: " Fredag " }]))[0].weekday,
    ).toBe(5);
  });

  it("hopper over rader uten lekse", () => {
    expect(
      parseRows(
        svar([
          { fag: "Norsk", lekse: "", dag: NO_DAY },
          { fag: "KRLE", lekse: "   ", dag: NO_DAY },
          { fag: "Matte", lekse: "Regn s. 12", dag: NO_DAY },
        ]),
      ).map((row) => row.subject),
    ).toEqual(["Matte"]);
  });

  it("godtar rader uten fag", () => {
    const rows = parseRows(svar([{ lekse: "Les 20 minutter", dag: NO_DAY }]));
    expect(rows).toEqual([
      { subject: "", task: "Les 20 minutter", weekday: null },
    ]);
  });

  it("klipper urimelig lange verdier", () => {
    const rows = parseRows(
      svar([{ fag: "F".repeat(200), lekse: "L".repeat(2000), dag: NO_DAY }]),
    );
    expect(rows[0].subject).toHaveLength(60);
    expect(rows[0].task).toHaveLength(1000);
  });

  it("sier fra i klartekst når svaret ikke gir mening", () => {
    expect(() => parseRows("ikke json")).toThrow(/tolke/i);
    expect(() => parseRows("{}")).toThrow(/lekser/i);
    expect(() => parseRows(svar("ikke en liste"))).toThrow(/lekser/i);
  });

  it("takler tomt resultat uten å kaste", () => {
    expect(parseRows(svar([]))).toEqual([]);
  });

  it("ignorerer felt av feil type framfor å krasje", () => {
    expect(parseRows(svar([{ fag: 42, lekse: null, dag: {} }]))).toEqual([]);
    expect(parseRows(svar([{ fag: 42, lekse: "Reelt", dag: {} }]))).toEqual([
      { subject: "", task: "Reelt", weekday: null },
    ]);
  });
});
