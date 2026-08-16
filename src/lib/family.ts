/**
 * Barna som har med matpakke. Fiona går i barnehage og får mat der, så hun
 * ligger i Member (for beskjeder fra barnehagen) men har ingen matpakkefelt.
 *
 * Dette er det eneste stedet familien er navngitt i koden — endre her hvis
 * noen begynner eller slutter å ha med mat.
 */
export const MEAL_CHILD_NAMES = ["Olea", "Louis"] as const;

export const FAMILY = [
  { name: "Magnus", isChild: false },
  { name: "Julie", isChild: false },
  { name: "Olea", isChild: true },
  { name: "Louis", isChild: true },
  { name: "Fiona", isChild: true },
] as const;

/**
 * Kategoriene appen starter med. Familien kan lage flere fra beskjedskjemaet,
 * og de havner i samme tabell — dette er bare utgangspunktet.
 * Id-ene er faste slik at seed og migrasjon peker på de samme radene.
 */
export const DEFAULT_CATEGORIES = [
  { id: "kat_skole", name: "Skole", color: "blaa", sortOrder: 10 },
  { id: "kat_ungdomsskole", name: "Ungdomsskole", color: "lilla", sortOrder: 20 },
  { id: "kat_barnehage", name: "Barnehage", color: "gul", sortOrder: 30 },
  { id: "kat_trening", name: "Trening", color: "gronn", sortOrder: 40 },
  { id: "kat_generelt", name: "Generelt", color: "graa", sortOrder: 50 },
] as const;
