import type { Route } from "./+types/api.keep-alive";
import { db } from "~/db/client";
import { sql } from "drizzle-orm";

/**
 * Keep-alive para Supabase: una consulta mínima a la DB evita que el proyecto pase a inactivo.
 * Sin autenticación para que un cron externo (UptimeRobot, cron-job.org, etc.) pueda llamarlo.
 * Configurar un ping cada 10–15 minutos a: GET /api/keep-alive
 */
export async function loader({ request }: Route.LoaderArgs) {
  if (request.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    await db.execute(sql`SELECT 1`);
    return Response.json(
      { ok: true, at: new Date().toISOString() },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("Keep-alive DB check failed:", err);
    return Response.json(
      { ok: false, error: "Database unreachable" },
      { status: 503 }
    );
  }
}
