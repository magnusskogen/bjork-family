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
  { name: "Marte", isChild: false },
  { name: "Olea", isChild: true },
  { name: "Louis", isChild: true },
  { name: "Fiona", isChild: true },
] as const;
