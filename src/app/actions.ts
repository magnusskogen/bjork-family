"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  AUTH_COOKIE,
  AUTH_MAX_AGE,
  checkPin,
  createSessionToken,
} from "@/lib/auth";
import { assertEditable, dateOnly } from "@/lib/week";
import {
  NEW_CATEGORY,
  nextColor,
  normaliseCategoryName,
  relativeNorwegian,
  sameCategoryName,
} from "@/lib/format";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : T))
  | { ok: false; error: string };

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

/**
 * Felles inngangssjekk for alt som skriver: gyldig dato, dato innenfor
 * redigerbart intervall, og en avsender som faktisk finnes i databasen.
 * Datoen valideres mot serverens klokke — klientens klokke betyr ingenting.
 */
async function validateWrite(ymd: string, memberId: string) {
  if (!YMD.test(ymd)) throw new Error("Ugyldig dato.");
  const date = dateOnly(ymd);
  if (Number.isNaN(date.getTime())) throw new Error("Ugyldig dato.");

  assertEditable(date, new Date());

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { id: true, name: true },
  });
  if (!member) throw new Error("Ukjent bruker. Velg hvem du er på nytt.");

  return { date, member };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Noe gikk galt.";
}

/* ------------------------------------------------------------------ */
/* Innlogging                                                          */
/* ------------------------------------------------------------------ */

export async function login(
  _prev: unknown,
  formData: FormData,
): Promise<{ error?: string }> {
  const pin = String(formData.get("pin") ?? "");
  if (!pin) return { error: "Skriv inn koden." };

  // Både feil kode og manglende oppsett skal vises som tekst i skjemaet.
  // Kaster vi her, får brukeren bare en tom 500-side og ingen anelse om hvorfor.
  try {
    if (!checkPin(pin)) return { error: "Feil kode. Prøv igjen." };

    const store = await cookies();
    store.set(AUTH_COOKIE, await createSessionToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: AUTH_MAX_AGE,
    });
  } catch (error) {
    return { error: messageOf(error) };
  }

  // Utenfor try: redirect() kaster med vilje, og skal ikke fanges opp her.
  redirect("/");
}

export async function logout() {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
  redirect("/login");
}

/* ------------------------------------------------------------------ */
/* Matpakker                                                           */
/* ------------------------------------------------------------------ */

export async function saveMeal(input: {
  childId: string;
  date: string;
  text: string;
  memberId: string;
}): Promise<ActionResult<{ savedAt: string; by: string; when: string }>> {
  try {
    const { date, member } = await validateWrite(input.date, input.memberId);

    const child = await prisma.member.findUnique({
      where: { id: input.childId },
      select: { id: true, isChild: true },
    });
    if (!child?.isChild) return fail("Ukjent barn.");

    const text = input.text.trim().slice(0, 500);

    if (!text) {
      await prisma.mealEntry.deleteMany({
        where: { childId: child.id, date },
      });
      revalidatePath("/");
      return { ok: true, savedAt: "", by: "", when: "" };
    }

    const saved = await prisma.mealEntry.upsert({
      where: { childId_date: { childId: child.id, date } },
      create: { childId: child.id, date, text, createdById: member.id },
      update: { text, createdById: member.id },
    });

    revalidatePath("/");
    return {
      ok: true,
      savedAt: saved.updatedAt.toISOString(),
      by: member.name,
      when: relativeNorwegian(saved.updatedAt),
    };
  } catch (error) {
    return fail(messageOf(error));
  }
}

/* ------------------------------------------------------------------ */
/* Beskjeder                                                           */
/* ------------------------------------------------------------------ */

/**
 * Finner kategorien beskjeden skal ha. Er det en ny, opprettes den her — men
 * matcher navnet en som finnes fra før (uansett store bokstaver), gjenbrukes
 * den i stedet for å lage en duplikat.
 */
async function resolveCategory(
  categoryId: string,
  newName: string,
): Promise<{ id: string }> {
  if (categoryId !== NEW_CATEGORY) {
    const existing = await prisma.noticeCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!existing) throw new Error("Ukjent kategori.");
    return existing;
  }

  const name = normaliseCategoryName(newName);
  if (!name) throw new Error("Gi den nye kategorien et navn.");
  if (name.length > 40) throw new Error("Kategorinavnet er for langt.");

  const all = await prisma.noticeCategory.findMany({
    select: { id: true, name: true, color: true, sortOrder: true },
  });

  const match = all.find((category) => sameCategoryName(category.name, name));
  if (match) return { id: match.id };

  const created = await prisma.noticeCategory.create({
    data: {
      name,
      color: nextColor(all.map((category) => category.color)),
      sortOrder: Math.max(100, ...all.map((c) => c.sortOrder)) + 10,
    },
    select: { id: true },
  });
  return created;
}

export async function addNotice(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const ymd = String(formData.get("date") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const newCategory = String(formData.get("newCategory") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  const memberId = String(formData.get("memberId") ?? "");

  if (!categoryId) return { ok: false, error: "Velg hvor beskjeden kommer fra." };
  if (!text) return { ok: false, error: "Skriv inn beskjeden." };

  let created: { id: string };
  try {
    const { date, member } = await validateWrite(ymd, memberId);
    const category = await resolveCategory(categoryId, newCategory);

    created = await prisma.notice.create({
      data: {
        date,
        categoryId: category.id,
        text: text.slice(0, 1000),
        createdById: member.id,
      },
      select: { id: true },
    });
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }

  revalidatePath("/");
  revalidatePath("/beskjeder");
  // Id-en brukes som React-nøkkel i skjemaet, så feltene tømmer seg selv.
  return { ok: true, id: created.id };
}

export async function deleteNotice(id: string): Promise<ActionResult> {
  try {
    const notice = await prisma.notice.findUnique({
      where: { id },
      select: { date: true },
    });
    if (!notice) return fail("Beskjeden finnes ikke lenger.");

    // Samme datovalidering som for matpakkene: gamle beskjeder står i fred.
    assertEditable(notice.date, new Date());

    await prisma.notice.delete({ where: { id } });
  } catch (error) {
    return fail(messageOf(error));
  }

  revalidatePath("/");
  revalidatePath("/beskjeder");
  return { ok: true };
}
