import * as React from "react";
import { useLoaderData, useSearchParams, Form, Link, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Calendar, Stethoscope, ExternalLink } from "lucide-react";
import { useState } from "react";
import { formatDate } from "~/lib/utils";

export function ListadoAgenda() {
  const { appointments, doctors, date: initialDate, doctorId: initialDoctorId } = useLoaderData<{
    appointments: Array<{
      appointment: { id: string; appointmentTime: string; status: string };
      patient: { id: string; firstName: string; lastName: string } | null;
    }>;
    doctors: Array<{ id: string; firstName: string; lastName: string }>;
    date: string;
    doctorId: string;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [date, setDate] = useState(initialDate);
  const [doctorId, setDoctorId] = useState(initialDoctorId);
  const navigate = useNavigate();

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("date", date);
    if (doctorId) params.set("doctorId", doctorId);
    setSearchParams(params, { replace: true });
  };

  const selectedDoctor = doctors.find((d) => d.id === doctorId);
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
                        <td className="py-3 px-2">{appointment.appointmentTime}</td>
                        <td className="py-3 px-2">{patient ? `${patient.firstName} ${patient.lastName}` : "—"}</td>
                        <td className="py-3 px-2">
                          {appointment.status === "scheduled" ? "Programado" : appointment.status === "attended" ? "Atendido" : appointment.status === "cancelled" ? "Cancelado" : "No asistió"}
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
      )}
    </div>
  );
}
