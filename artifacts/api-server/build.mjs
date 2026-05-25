import * as esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const externalPackages = [
  "@simplewebauthn/server",
  "bcryptjs",
  "cookie-parser",
  "cors",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "multer",
  "openai",
  "pdf-parse",
  "pdfkit",
  "pino",
  "pino-http",
  "pg",
  "web-push",
  "xlsx",
  "zod",
  "ws",
  "@trpc/server",
  "superjson",
];

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  outfile: "dist/index.cjs",
  external: externalPackages,
  sourcemap: true,
  minify: false,
  treeShaking: true,
  logLevel: "info",
  resolveExtensions: [".ts", ".js", ".mjs", ".cjs"],
});

console.log("Build complete: dist/index.cjs");
