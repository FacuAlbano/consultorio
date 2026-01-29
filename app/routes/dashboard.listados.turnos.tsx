import * as React from "react";
import { useLoaderData, useSearchParams, Form, Link } from "react-router";
import type { Route } from "./+types/dashboard.listados.turnos";
import { requireAuth } from "~/lib/middleware";
import { getAppointments } from "~/lib/appointments.server";
import { getAllDoctors } from "~/lib/doctors.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Calendar, ClipboardList, ExternalLink } from "lucide-react";
import { useState } from "react";
import { PATHS } from "~/lib/constants";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const url = new URL(request.url);
  const date = url.searchParams.get("date") || "";
  const doctorId = url.searchParams.get("doctorId") || "";
  const status = url.searchParams.get("status") || "";

  const appointments = await getAppointments({
    date: date || undefined,
    doctorId: doctorId || undefined,
    status: status || undefined,
    limit: 200,
  });
  const doctors = await getAllDoctors({ limit: 100 });

  return { appointments, doctors, date, doctorId, status };
}

export default function ListadoTurnos() {
  const { appointments, doctors, date: initialDate, doctorId: initialDoctorId, status: initialStatus } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [date, setDate] = useState(initialDate);
  const [doctorId, setDoctorId] = useState(initialDoctorId);
  const [status, setStatus] = useState(initialStatus);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (doctorId) params.set("doctorId", doctorId);
    if (status) params.set("status", status);
    setSearchParams(params, { replace: true });
  };

  const statusLabel: Record<string, string> = {
    scheduled: "Programado",
    attended: "Atendido",
    cancelled: "Cancelado",
    no_show: "No asistió",
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ClipboardList className="h-7 w-7" />
          Turnos de la Institución
        </h1>
        <p className="text-muted-foreground mt-1">
          Vista general de turnos. Filtros por fecha, médico y estado.
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
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Médico</label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm min-w-[180px]"
              >
                <option value="">Todos</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.firstName} {d.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm min-w-[140px]"
              >
                <option value="">Todos</option>
                {Object.entries(statusLabel).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <Button type="submit">Filtrar</Button>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Turnos {appointments.length > 0 ? `(${appointments.length})` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No hay turnos con los filtros seleccionados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium">Fecha</th>
                    <th className="text-left py-3 px-2 font-medium">Hora</th>
                    <th className="text-left py-3 px-2 font-medium">Paciente</th>
                    <th className="text-left py-3 px-2 font-medium">Médico</th>
                    <th className="text-left py-3 px-2 font-medium">Estado</th>
                    <th className="text-left py-3 px-2 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(({ appointment, patient, doctor }) => (
                    <tr key={appointment.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-2">
                        {new Date(appointment.appointmentDate).toLocaleDateString("es-AR")}
                      </td>
                      <td className="py-3 px-2">{appointment.appointmentTime}</td>
                      <td className="py-3 px-2">
                        {patient ? `${patient.firstName} ${patient.lastName}` : "—"}
                      </td>
                      <td className="py-3 px-2">
                        {doctor ? `${doctor.firstName} ${doctor.lastName}` : "—"}
                      </td>
                      <td className="py-3 px-2">{statusLabel[appointment.status] ?? appointment.status}</td>
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
    </div>
  );
}
