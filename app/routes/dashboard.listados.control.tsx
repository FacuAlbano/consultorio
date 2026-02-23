import * as React from "react";
import { useLoaderData } from "react-router";
import type { Route } from "./+types/dashboard.listados.control";
import { requireAuth } from "~/lib/middleware";
import { getAppointments } from "~/lib/appointments.server";
import { getPatientsCount } from "~/lib/patients.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { BarChart3, Calendar, Users, UserCheck, UserX, ClipboardX } from "lucide-react";
import { getTodayLocalISO } from "~/lib/utils";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const today = getTodayLocalISO();

  const [turnosHoy, totalPacientes] = await Promise.all([
    getAppointments({ date: today, limit: 500 }),
    getPatientsCount(),
  ]);

  const turnosProgramados = turnosHoy.filter((t) => t.appointment.status === "scheduled").length;
  const turnosAtendidos = turnosHoy.filter((t) => t.appointment.status === "attended").length;
  const turnosCancelados = turnosHoy.filter((t) => t.appointment.status === "cancelled").length;
  const noAsistieron = turnosHoy.filter((t) => t.appointment.status === "no_show").length;

  return {
    turnosHoy: turnosHoy.length,
    turnosProgramados,
    turnosAtendidos,
    turnosCancelados,
    noAsistieron,
    totalPacientes,
  };
}

export default function ControlInstitucional() {
  const stats = useLoaderData<typeof loader>();

  const cards = [
    { title: "Turnos hoy", value: stats.turnosHoy, icon: Calendar, desc: "Total de turnos del día" },
    { title: "Programados", value: stats.turnosProgramados, icon: ClipboardX, desc: "Pendientes de atención" },
    { title: "Atendidos hoy", value: stats.turnosAtendidos, icon: UserCheck, desc: "Ya atendidos" },
    { title: "Cancelados", value: stats.turnosCancelados, icon: ClipboardX, desc: "Turnos cancelados" },
    { title: "No asistieron", value: stats.noAsistieron, icon: UserX, desc: "Inasistencias" },
    { title: "Total pacientes", value: stats.totalPacientes, icon: Users, desc: "Pacientes registrados" },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-7 w-7" />
          Control Institucional
        </h1>
        <p className="text-muted-foreground mt-1">
          Reportes y estadísticas generales de la institución.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ title, value, icon: Icon, desc }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
              <Icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
