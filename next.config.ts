import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Uten dette gjetter Next på rotmappe og kan finne en package.json lenger opp.
  turbopack: { root: path.resolve(process.cwd()) },

  experimental: {
    // Lekseplaner lastes opp gjennom en server action. Standardgrensa er 1 MB,
    // og et foto fra telefonen er fort større. Serveren avviser uansett alt
    // over 8 MB selv, med en lesbar feil i stedet for en rå 413.
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
