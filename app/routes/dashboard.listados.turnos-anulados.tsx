import * as React from "react";
import { useLoaderData, useSearchParams, Form, Link } from "react-router";
import type { Route } from "./+types/dashboard.listados.turnos-anulados";
import { requireAuth } from "~/lib/middleware";
import { getAppointments } from "~/lib/appointments.server";
import { getAllDoctors } from "~/lib/doctors.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ClipboardX, ExternalLink, Download, FileText } from "lucide-react";
import { useState } from "react";
import { formatDate } from "~/lib/utils";

function exportToCSV(
  appointments: Awaited<ReturnType<typeof getAppointments>>,
) {
  const headers = ["Fecha", "Hora", "Paciente", "DNI", "Médico", "Motivo / Notas"];
  const rows = appointments.map(({ appointment, patient, doctor }) => [
    formatDate(appointment.appointmentDate),
    appointment.appointmentTime,
    patient ? `${patient.firstName} ${patient.lastName}` : "",
    patient?.documentNumber ?? "",
    doctor ? `${doctor.firstName} ${doctor.lastName}` : "",
    appointment.notes ?? "",
  ]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `turnos-anulados-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const url = new URL(request.url);
  const date = url.searchParams.get("date") || "";
  const dateFrom = url.searchParams.get("dateFrom") || "";
  const dateTo = url.searchParams.get("dateTo") || "";
  const doctorId = url.searchParams.get("doctorId") || "";

  const options: Parameters<typeof getAppointments>[0] = {
    status: "cancelled",
    doctorId: doctorId || undefined,
    limit: 500,
  };
  if (date) options.date = date;
  else {
    if (dateFrom) options.dateFrom = dateFrom;
    if (dateTo) options.dateTo = dateTo;
  }

  const appointments = await getAppointments(options);
  const doctors = await getAllDoctors({ limit: 100 });

  // Resumen: total y por médico
  const total = appointments.length;
  const byDoctor: { doctorName: string; count: number }[] = [];
  const map = new Map<string, number>();
  for (const { doctor } of appointments) {
    const name = doctor ? `${doctor.firstName} ${doctor.lastName}` : "Sin médico";
    map.set(name, (map.get(name) ?? 0) + 1);
  }
  map.forEach((count, doctorName) => byDoctor.push({ doctorName, count }));
  byDoctor.sort((a, b) => b.count - a.count);

  return {
    appointments,
    doctors,
    date,
    dateFrom,
    dateTo,
    doctorId,
    reportSummary: { total, byDoctor },
  };
}

export default function TurnosAnulados() {
  const {
    appointments,
    doctors,
    date: initialDate,
    dateFrom: initialDateFrom,
    dateTo: initialDateTo,
    doctorId: initialDoctorId,
    reportSummary,
  } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [date, setDate] = useState(initialDate);
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);
  const [doctorId, setDoctorId] = useState(initialDoctorId);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (doctorId) params.set("doctorId", doctorId);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardX className="h-7 w-7" />
            Turnos Anulados
          </h1>
          <p className="text-muted-foreground mt-1">
            Historial de turnos cancelados. Filtros por fecha y médico. Exportar reporte CSV.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToCSV(appointments)}
          className="gap-2 shrink-0"
        >
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
              <label className="text-sm font-medium">Fecha exacta</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Desde</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Hasta</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
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

      {reportSummary && (reportSummary.total > 0 || reportSummary.byDoctor.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" /> Resumen del reporte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Total de turnos anulados: <strong className="text-foreground">{reportSummary.total}</strong>
            </p>
            {reportSummary.byDoctor.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-medium">Médico</th>
                      <th className="text-right py-2 px-2 font-medium">Cancelados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportSummary.byDoctor.map((row) => (
                      <tr key={row.doctorName} className="border-b border-border/50">
                        <td className="py-2 px-2">{row.doctorName}</td>
                        <td className="py-2 px-2 text-right font-medium">{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cancelados {appointments.length > 0 ? `(${appointments.length})` : ""}</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No hay turnos cancelados con los filtros seleccionados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium">Fecha</th>
                    <th className="text-left py-3 px-2 font-medium">Hora</th>
                    <th className="text-left py-3 px-2 font-medium">Paciente</th>
                    <th className="text-left py-3 px-2 font-medium">Médico</th>
                    <th className="text-left py-3 px-2 font-medium">Motivo / Notas</th>
                    <th className="text-left py-3 px-2 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(({ appointment, patient, doctor }) => (
                    <tr key={appointment.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-2">{formatDate(appointment.appointmentDate)}</td>
                      <td className="py-3 px-2">{appointment.appointmentTime}</td>
                      <td className="py-3 px-2">{patient ? `${patient.firstName} ${patient.lastName}` : "—"}</td>
                      <td className="py-3 px-2">{doctor ? `${doctor.firstName} ${doctor.lastName}` : "—"}</td>
                      <td className="py-3 px-2 text-muted-foreground max-w-[200px] truncate" title={appointment.notes ?? ""}>
                        {appointment.notes ?? "—"}
                      </td>
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
