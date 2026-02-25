import * as React from "react";
import { useLoaderData, useSearchParams, Form, Link, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ClipboardX, ExternalLink, Download, FileText } from "lucide-react";
import { useState } from "react";
import { formatDate } from "~/lib/utils";

function exportToCSV(
  appointments: Array<{
    appointment: { appointmentDate: string; appointmentTime: string; notes: string | null };
    patient: { firstName: string; lastName: string; documentNumber?: string | null } | null;
    doctor: { firstName: string; lastName: string } | null;
  }>
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

export function ListadoTurnosAnulados() {
  const {
    appointments,
    doctors,
    date: initialDate,
    dateFrom: initialDateFrom,
    dateTo: initialDateTo,
    doctorId: initialDoctorId,
    reportSummary,
  } = useLoaderData<{
    appointments: Array<{
      appointment: { id: string; appointmentDate: string; appointmentTime: string; notes: string | null };
      patient: { id: string; firstName: string; lastName: string } | null;
      doctor: { firstName: string; lastName: string } | null;
    }>;
    doctors: Array<{ id: string; firstName: string; lastName: string }>;
    date: string;
    dateFrom: string;
    dateTo: string;
    doctorId: string;
    reportSummary: { total: number; byDoctor: Array<{ doctorName: string; count: number }> };
  }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [date, setDate] = useState(initialDate);
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);
  const [doctorId, setDoctorId] = useState(initialDoctorId);
  const navigate = useNavigate();

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
        <Button variant="outline" size="sm" onClick={() => exportToCSV(appointments)} className="gap-2 shrink-0">
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <Card>
        <CardContent className="py-3 px-4 sm:px-6">
          <Form onSubmit={handleFilter} className="flex flex-wrap gap-3 items-center">
            <span className="text-sm font-medium text-foreground border-r border-border pr-3">Filtros</span>
            <div className="flex flex-col gap-1 min-w-[110px]">
              <label className="text-xs font-medium">Fecha exacta</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 w-full text-sm" />
            </div>
            <div className="flex flex-col gap-1 min-w-[110px]">
              <label className="text-xs font-medium">Desde</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 w-full text-sm" />
            </div>
            <div className="flex flex-col gap-1 min-w-[110px]">
              <label className="text-xs font-medium">Hasta</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 w-full text-sm" />
            </div>
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-xs font-medium">Médico</label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm"
              >
                <option value="">Todos</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm" className="h-8">Filtrar</Button>
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
                    <tr
                      key={appointment.id}
                      role="button"
                      tabIndex={0}
                      className="border-b border-border/50 hover:bg-muted/30 cursor-pointer"
                      onClick={() => patient && navigate(`/pacientes/${patient.id}`)}
                      onKeyDown={(e) => {
                        if ((e.key === "Enter" || e.key === " ") && patient) {
                          e.preventDefault();
                          navigate(`/pacientes/${patient.id}`);
                        }
                      }}
                    >
                      <td className="py-3 px-2">{formatDate(appointment.appointmentDate)}</td>
                      <td className="py-3 px-2">{appointment.appointmentTime}</td>
                      <td className="py-3 px-2">{patient ? `${patient.firstName} ${patient.lastName}` : "—"}</td>
                      <td className="py-3 px-2">{doctor ? `${doctor.firstName} ${doctor.lastName}` : "—"}</td>
                      <td className="py-3 px-2 text-muted-foreground max-w-[200px] truncate" title={appointment.notes ?? ""}>
                        {appointment.notes ?? "—"}
                      </td>
                      <td className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
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
