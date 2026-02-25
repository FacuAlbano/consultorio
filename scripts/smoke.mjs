#!/usr/bin/env node
/**
 * Script de smoke: typecheck + build.
 * Opcionalmente prueba URLs (ejecutar con la app ya corriendo: npm run dev en otra terminal).
 * Uso:
 *   node scripts/smoke.mjs           → solo typecheck + build
 *   node scripts/smoke.mjs --urls    → typecheck + build + fetch a rutas principales (BASE_URL por defecto http://localhost:5173)
 *   BASE_URL=http://localhost:3000 node scripts/smoke.mjs --urls
 */

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import http from "http";
import https from "https";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const run = (cmd, args, opts = {}) =>
  new Promise((resolve, reject) => {
    const c = spawn(cmd, args, { stdio: "inherit", shell: true, cwd: root, ...opts });
    c.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} → exit ${code}`))));
  });

async function typecheck() {
  console.log("\n▶ Typecheck...");
  await run("npm", ["run", "typecheck"]);
  console.log("  ✓ Typecheck OK\n");
}

async function build() {
  console.log("▶ Build...");
  await run("npm", ["run", "build"]);
  console.log("  ✓ Build OK\n");
}

const RUTAS_PRINCIPALES = [
  "/",
  "/login",
  "/dashboard",
  "/dashboard/agenda",
  "/dashboard/medicos",
  "/dashboard/pool-atencion",
  "/dashboard/listados/turnos",
  "/dashboard/administracion/agenda/consultorio",
  "/dashboard/administracion/web/institucion",
  "/dashboard/administracion/pacientes/obras-sociales",
];

function fetchUrl(baseUrl, path) {
  const url = new URL(path, baseUrl);
  const lib = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = lib.get(url, { timeout: 10000 }, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve({ status: res.statusCode, path }));
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Timeout ${path}`));
    });
  });
}

async function smokeUrls(baseUrl) {
  console.log(`▶ Probando URLs (${baseUrl})...\n`);
  const fails = [];
  for (const path of RUTAS_PRINCIPALES) {
    try {
      const { status } = await fetchUrl(baseUrl, path);
      if (status >= 500) fails.push({ path, status, error: `HTTP ${status}` });
      else console.log(`  ✓ ${path} → ${status}`);
    } catch (e) {
      fails.push({ path, error: e.message });
      console.log(`  ✗ ${path} → ${e.message}`);
    }
  }
  if (fails.length) {
    console.log("\n❌ Fallos:");
    fails.forEach((f) => console.log(`   ${f.path}: ${f.error}`));
    process.exit(1);
  }
  console.log("\n  ✓ Todas las URLs respondieron OK\n");
}

async function main() {
  const withUrls = process.argv.includes("--urls");
  const baseUrl = process.env.BASE_URL || "http://localhost:5173";

  console.log("=== Smoke test (consultorio) ===\n");

  await typecheck();
  await build();

  if (withUrls) {
    await smokeUrls(baseUrl);
  } else {
    console.log("Para probar también las URLs, ejecuta con --urls (con la app corriendo):");
    console.log("  npm run dev   # en otra terminal");
    console.log("  node scripts/smoke.mjs --urls");
    console.log("  # o: BASE_URL=http://localhost:3000 node scripts/smoke.mjs --urls\n");
  }

  console.log("=== Smoke OK ===\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
