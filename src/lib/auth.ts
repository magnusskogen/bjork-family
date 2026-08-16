/**
 * Innlogging for fem personer i samme hus: én delt PIN-kode.
 *
 * Riktig PIN gir en signert cookie som varer i et år. Cookien inneholder ingen
 * personopplysninger — bare et tidsstempel og en HMAC. Vi bruker Web Crypto
 * (ikke node:crypto) fordi den samme koden må kunne kjøre i middleware.
 */

export const AUTH_COOKIE = "bjork_auth";
export const AUTH_MAX_AGE = 60 * 60 * 24 * 365; // ett år

const encoder = new TextEncoder();

function requireSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET mangler eller er for kort. Sett en tilfeldig streng på minst 16 tegn.",
    );
  }
  return secret;
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(requireSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Sammenligning uten tidslekkasje. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function checkPin(input: string): boolean {
  const pin = process.env.FAMILY_PIN;
  if (!pin) {
    throw new Error("FAMILY_PIN mangler. Sett den i .env.local eller i Vercel.");
  }
  return safeEqual(input.trim(), pin.trim());
}

export async function createSessionToken(now: Date = new Date()): Promise<string> {
  const payload = `v1.${now.getTime()}`;
  return `${payload}.${await hmac(payload)}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [version, issuedAt, signature] = parts;
  if (version !== "v1") return false;
  return safeEqual(signature, await hmac(`${version}.${issuedAt}`));
}
