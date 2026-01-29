import * as React from "react";
import { useLoaderData, useSearchParams, Form, Link } from "react-router";
import type { Route } from "./+types/dashboard.listados.agenda";
import { requireAuth } from "~/lib/middleware";
import { getAppointments } from "~/lib/appointments.server";
import { getAllDoctors } from "~/lib/doctors.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Calendar, Stethoscope, ExternalLink } from "lucide-react";
import { useState } from "react";
import { getTodayLocalISO, formatDate } from "~/lib/utils";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const url = new URL(request.url);
  const date = url.searchParams.get("date") || getTodayLocalISO();
  const doctorId = url.searchParams.get("doctorId") || "";

  if (!doctorId) {
    return { appointments: [], doctors: await getAllDoctors({ limit: 100 }), date, doctorId: "" };
  }

  const appointments = await getAppointments({
    date,
    doctorId,
    limit: 200,
  });
  const doctors = await getAllDoctors({ limit: 100 });

  return { appointments, doctors, date, doctorId };
}

export default function AgendaProfesional() {
  const { appointments, doctors, date: initialDate, doctorId: initialDoctorId } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [date, setDate] = useState(initialDate);
  const [doctorId, setDoctorId] = useState(initialDoctorId);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("date", date);
    if (doctorId) params.set("doctorId", doctorId);
    setSearchParams(params, { replace: true });
  };

  const selectedDoctor = doctors.find((d) => d.id === doctorId);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="h-7 w-7" />
          Agenda del Profesional
        </h1>
        <p className="text-muted-foreground mt-1">
          Vista de agenda por médico y fecha. Seleccione médico y fecha para ver turnos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <Form onSubmit={handleFilter} className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-sm font-medium">Fecha</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Médico</label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm min-w-[180px]"
              >
                <option value="">Seleccionar médico</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.firstName} {d.lastName}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit">Ver agenda</Button>
          </Form>
        </CardContent>
      </Card>

      {doctorId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              {selectedDoctor ? `${selectedDoctor.firstName} ${selectedDoctor.lastName}` : "Médico"} — {formatDate(date, "es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No hay turnos para esta fecha y médico.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-medium">Hora</th>
                      <th className="text-left py-3 px-2 font-medium">Paciente</th>
                      <th className="text-left py-3 px-2 font-medium">Estado</th>
                      <th className="text-left py-3 px-2 w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map(({ appointment, patient }) => (
                      <tr key={appointment.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-3 px-2">{appointment.appointmentTime}</td>
                        <td className="py-3 px-2">{patient ? `${patient.firstName} ${patient.lastName}` : "—"}</td>
                        <td className="py-3 px-2">{appointment.status === "scheduled" ? "Programado" : appointment.status === "attended" ? "Atendido" : appointment.status === "cancelled" ? "Cancelado" : "No asistió"}</td>
                        <td className="py-3 px-2">
                          {patient && (
                            <Link to={`/pacientes/${patient.id}`} className="text-primary hover:underline inline-flex items-center gap-1">
                              Ver <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
