#!/usr/bin/env node
/**
 * Servidor que inicia la app Y un keep-alive interno cada 4 días contra Supabase.
 * Uso: node server.mjs (después de npm run build). En Vercel no corre este proceso;
 * allí el keep-alive lo hace Vercel Cron (vercel.json) llamando a /api/keep-alive.
 */
import "dotenv/config";
import postgres from "postgres";
import { spawn } from "child_process";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL en .env");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require", max: 1 });
const INTERVAL_MS = 4 * 24 * 60 * 60 * 1000; // 4 días (Supabase suele marcar inactivo tras ~1 semana)

function ping() {
  sql`SELECT 1`
    .then(() => console.log("[keep-alive] Supabase OK"))
    .catch((err) => console.error("[keep-alive] Error:", err.message));
}

// Primer ping a los 30 segundos (da tiempo a que arranque todo)
setTimeout(ping, 30_000);
// Luego cada 4 días
setInterval(ping, INTERVAL_MS);

const child = spawn("npx", ["react-router-serve", "./build/server/index.js"], {
  stdio: "inherit",
  env: process.env,
  cwd: process.cwd(),
});

child.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
