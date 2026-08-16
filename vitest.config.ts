import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Bevisst "feil" tidssone: ukelogikken skal gi samme svar uansett hvor
    // koden kjører. Vercel kjører i UTC, telefonen står i Oslo.
    env: { TZ: "America/Los_Angeles" },
  },
});
