import * as React from "react";
import { useLoaderData, Link } from "react-router";
import type { Route } from "./+types/dashboard.listados.gestion-disponibilidad";
import { requireAuth } from "~/lib/middleware";
import { getAllDoctors } from "~/lib/doctors.server";
import { db } from "~/db/client";
import { doctorUnavailableDays } from "~/db/schema";
import { eq, gte } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Settings, Clock, CalendarOff } from "lucide-react";
import { PATHS } from "~/lib/constants";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const doctors = await getAllDoctors({ limit: 100 });
  const today = new Date().toISOString().slice(0, 10);
  
  // Obtener todos los días no laborables en una sola query
  const allDays = await db.select().from(doctorUnavailableDays);
  
  // Agrupar por doctor ID en memoria
  const byId: Record<string, { doctorId: string; unavailableCount: number; futureUnavailable: number }> = {};
  for (const day of allDays) {
    if (!byId[day.doctorId]) {
      byId[day.doctorId] = { doctorId: day.doctorId, unavailableCount: 0, futureUnavailable: 0 };
    }
    byId[day.doctorId].unavailableCount++;
    if (day.date >= today) {
      byId[day.doctorId].futureUnavailable++;
    }
  }
  
  return { doctors, byId };
}

export default function GestionDisponibilidad() {
  const { doctors, byId } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-7 w-7" />
          Gestión de disponibilidad
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure la ventana de atención y los días no laborables de cada profesional. Use &quot;Configurar&quot; para editar.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profesionales</CardTitle>
        </CardHeader>
        <CardContent>
          {doctors.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No hay médicos registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium">Médico</th>
                    <th className="text-left py-3 px-2 font-medium">Ventana de atención</th>
                    <th className="text-left py-3 px-2 font-medium">Días no laborables</th>
                    <th className="text-left py-3 px-2 w-28"></th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((d) => {
                    const info = byId[d.id];
                    const start = d.attentionWindowStart ? String(d.attentionWindowStart).slice(0, 5) : "—";
                    const end = d.attentionWindowEnd ? String(d.attentionWindowEnd).slice(0, 5) : "—";
                    return (
                      <tr key={d.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-3 px-2 font-medium">{d.firstName} {d.lastName}</td>
                        <td className="py-3 px-2 flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {start} – {end}
                        </td>
                        <td className="py-3 px-2 flex items-center gap-1">
                          <CalendarOff className="h-4 w-4 text-muted-foreground" />
                          {info ? `${info.unavailableCount} días` : "0"} (próximos: {info?.futureUnavailable ?? 0})
                        </td>
                        <td className="py-3 px-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={PATHS.medicoProfile(d.id)}>Configurar</Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
