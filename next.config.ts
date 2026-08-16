import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Uten dette gjetter Next på rotmappe og kan finne en package.json lenger opp.
  turbopack: { root: path.resolve(process.cwd()) },
};

export default nextConfig;
