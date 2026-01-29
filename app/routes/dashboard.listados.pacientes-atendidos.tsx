import * as React from "react";
import { useLoaderData, useSearchParams, Form, Link } from "react-router";
import type { Route } from "./+types/dashboard.listados.pacientes-atendidos";
import { requireAuth } from "~/lib/middleware";
import { getAppointments } from "~/lib/appointments.server";
import { getAllDoctors } from "~/lib/doctors.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Users, ExternalLink, Download } from "lucide-react";
import { useState } from "react";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const url = new URL(request.url);
  const date = url.searchParams.get("date") || "";
  const doctorId = url.searchParams.get("doctorId") || "";

  const appointments = await getAppointments({
    status: "attended",
    date: date || undefined,
    doctorId: doctorId || undefined,
    limit: 200,
  });
  const doctors = await getAllDoctors({ limit: 100 });

  return { appointments, doctors, date, doctorId };
}

function exportToCSV(appointments: Awaited<ReturnType<typeof getAppointments>>) {
  const headers = ["Fecha", "Hora", "Paciente", "DNI", "HC", "Médico"];
  const rows = appointments.map(({ appointment, patient, doctor }) => [
    new Date(appointment.appointmentDate).toLocaleDateString("es-AR"),
    appointment.appointmentTime,
    patient ? `${patient.firstName} ${patient.lastName}` : "",
    patient?.documentNumber ?? "",
    patient?.medicalRecordNumber ?? "",
    doctor ? `${doctor.firstName} ${doctor.lastName}` : "",
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `pacientes-atendidos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function PacientesAtendidos() {
  const { appointments, doctors, date: initialDate, doctorId: initialDoctorId } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [date, setDate] = useState(initialDate);
  const [doctorId, setDoctorId] = useState(initialDoctorId);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (doctorId) params.set("doctorId", doctorId);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-7 w-7" />
            Pacientes Atendidos
          </h1>
          <p className="text-muted-foreground mt-1">
            Listado de pacientes atendidos. Filtros por fecha y médico.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => exportToCSV(appointments)} className="gap-2">
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <Form onSubmit={handleFilter} className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-sm font-medium">Fecha</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
                  <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                ))}
              </select>
            </div>
            <Button type="submit">Filtrar</Button>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Atendidos {appointments.length > 0 ? `(${appointments.length})` : ""}</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No hay pacientes atendidos con los filtros seleccionados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium">Fecha</th>
                    <th className="text-left py-3 px-2 font-medium">Hora</th>
                    <th className="text-left py-3 px-2 font-medium">Paciente</th>
                    <th className="text-left py-3 px-2 font-medium">DNI</th>
                    <th className="text-left py-3 px-2 font-medium">HC</th>
                    <th className="text-left py-3 px-2 font-medium">Médico</th>
                    <th className="text-left py-3 px-2 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(({ appointment, patient, doctor }) => (
                    <tr key={appointment.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-2">{new Date(appointment.appointmentDate).toLocaleDateString("es-AR")}</td>
                      <td className="py-3 px-2">{appointment.appointmentTime}</td>
                      <td className="py-3 px-2">{patient ? `${patient.firstName} ${patient.lastName}` : "—"}</td>
                      <td className="py-3 px-2">{patient?.documentNumber ?? "—"}</td>
                      <td className="py-3 px-2">{patient?.medicalRecordNumber ?? "—"}</td>
                      <td className="py-3 px-2">{doctor ? `${doctor.firstName} ${doctor.lastName}` : "—"}</td>
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
