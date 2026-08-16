"use client";

import { useEffect } from "react";

/** Ruller til dagens kort ved lasting, uten animasjon. */
export default function ScrollToToday() {
  useEffect(() => {
    const target = document.getElementById("i-dag");
    if (!target) return;
    target.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior });
  }, []);

  return null;
}
