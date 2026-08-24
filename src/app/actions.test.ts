import { describe, expect, it, vi, beforeEach } from "vitest";

const setCookie = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: setCookie, delete: vi.fn() }) }));
vi.mock("next/navigation", () => ({
  redirect: (u: string) => { throw new Error("NEXT_REDIRECT:" + u); },
}));

import { addRoutine, login } from "./actions";

function form(pin: string) {
  const fd = new FormData();
  fd.set("pin", pin);
  return fd;
}

beforeEach(() => {
  setCookie.mockClear();
  process.env.FAMILY_PIN = "1234";
  process.env.AUTH_SECRET = "en-lang-nok-hemmelighet";
});

describe("login", () => {
  it("gir lesbar feil når AUTH_SECRET er for kort", async () => {
    process.env.AUTH_SECRET = "kort";
    const r = await login(null, form("1234"));
    expect(r.error).toContain("AUTH_SECRET");
    expect(setCookie).not.toHaveBeenCalled();
  });

  it("gir lesbar feil når FAMILY_PIN mangler", async () => {
    delete process.env.FAMILY_PIN;
    expect((await login(null, form("1234"))).error).toContain("FAMILY_PIN");
  });

  it("sier fra ved feil kode", async () => {
    expect((await login(null, form("0000"))).error).toBe("Feil kode. Prøv igjen.");
    expect(setCookie).not.toHaveBeenCalled();
  });

  it("krever at det står noe i feltet", async () => {
    expect((await login(null, form(""))).error).toBe("Skriv inn koden.");
  });

  it("setter cookie og redirecter ved riktig kode", async () => {
    await expect(login(null, form("1234"))).rejects.toThrow("NEXT_REDIRECT:/");
    expect(setCookie).toHaveBeenCalledOnce();
    const [navn, verdi, opts] = setCookie.mock.calls[0];
    expect(navn).toBe("bjork_auth");
    expect(verdi).toMatch(/^v1\.\d+\.[0-9a-f]{64}$/);
    expect(opts.httpOnly).toBe(true);
  });
});

/**
 * Bare valideringen som skjer før databasen røres. Alt etter det krever en
 * ekte Postgres, og hører hjemme et annet sted enn i enhetstestene.
 */
describe("addRoutine", () => {
  function routine(overrides: Record<string, string> = {}) {
    const fd = new FormData();
    fd.set("weekday", "1");
    fd.set("time", "19:30");
    fd.set("text", "Trening");
    fd.set("subjectId", "__alle__");
    fd.set("categoryId", "kat_trening");
    fd.set("memberId", "medlem_1");
    for (const [key, value] of Object.entries(overrides)) fd.set(key, value);
    return fd;
  }

  it("krever en ukedag mandag til fredag", async () => {
    expect((await addRoutine(null, routine({ weekday: "6" }))).error).toBe(
      "Velg en ukedag.",
    );
    expect((await addRoutine(null, routine({ weekday: "" }))).error).toBe(
      "Velg en ukedag.",
    );
  });

  it("krever at det står hva avtalen er", async () => {
    expect((await addRoutine(null, routine({ text: "   " }))).error).toBe(
      "Skriv hva avtalen er.",
    );
  });

  it("avviser et klokkeslett som ikke er et klokkeslett", async () => {
    expect((await addRoutine(null, routine({ time: "halv åtte" }))).error).toBe(
      "Klokkeslettet må se ut som 19:30.",
    );
  });
});
