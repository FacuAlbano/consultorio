import * as React from "react";
import { useLoaderData, useActionData, useSearchParams, Form, Link } from "react-router";
import type { Route } from "./+types/dashboard.listados.pacientes-no-atendidos";
import { requireAuth } from "~/lib/middleware";
import { getAppointments } from "~/lib/appointments.server";
import { updateAppointment } from "~/lib/appointments.server";
import { getAllDoctors } from "~/lib/doctors.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { UserX, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { formatDate } from "~/lib/utils";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const url = new URL(request.url);
  const date = url.searchParams.get("date") || "";
  const doctorId = url.searchParams.get("doctorId") || "";

  const appointments = await getAppointments({
    status: "no_show",
    date: date || undefined,
    doctorId: doctorId || undefined,
    limit: 200,
  });
  const doctors = await getAllDoctors({ limit: 100 });

  return { appointments, doctors, date, doctorId };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const formData = await request.formData();
  if (formData.get("intent") !== "updateNoShow") return { success: false, error: "Acción no válida" };
  const appointmentId = formData.get("appointmentId") as string;
  const noShowReason = (formData.get("noShowReason") as string) || null;
  const noShowFollowUp = (formData.get("noShowFollowUp") as string) || null;
  if (!appointmentId) return { success: false, error: "ID de turno requerido" };
  const result = await updateAppointment(appointmentId, { noShowReason, noShowFollowUp });
  return result;
}

export default function PacientesNoAtendidos() {
  const { appointments, doctors, date: initialDate, doctorId: initialDoctorId } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [date, setDate] = useState(initialDate);
  const [doctorId, setDoctorId] = useState(initialDoctorId);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (actionData?.success) {
      setEditingId(null);
    }
  }, [actionData]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (doctorId) params.set("doctorId", doctorId);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <UserX className="h-7 w-7" />
          Pacientes NO Atendidos
        </h1>
        <p className="text-muted-foreground mt-1">
          Listado de inasistencias (no asistieron al turno). Filtros por fecha y médico.
        </p>
      </div>

      {actionData?.success === false && actionData?.error && (
        <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-3 text-sm">{actionData.error}</div>
      )}
      {actionData?.success && (
        <div className="rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 px-4 py-3 text-sm">Actualización realizada correctamente.</div>
      )}

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
          <CardTitle className="text-lg">Inasistencias {appointments.length > 0 ? `(${appointments.length})` : ""}</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No hay registros de inasistencias con los filtros seleccionados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium">Fecha</th>
                    <th className="text-left py-3 px-2 font-medium">Hora</th>
                    <th className="text-left py-3 px-2 font-medium">Paciente</th>
                    <th className="text-left py-3 px-2 font-medium">DNI</th>
                    <th className="text-left py-3 px-2 font-medium">Médico</th>
                    <th className="text-left py-3 px-2 font-medium">Motivo de no atención</th>
                    <th className="text-left py-3 px-2 font-medium">Seguimiento</th>
                    <th className="text-left py-3 px-2 w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(({ appointment, patient, doctor }) => {
                    const isEditing = editingId === appointment.id;
                    const noShowReason = appointment.noShowReason ?? "";
                    const noShowFollowUp = appointment.noShowFollowUp ?? "";
                    return (
                      <tr key={appointment.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-3 px-2">{formatDate(appointment.appointmentDate)}</td>
                        <td className="py-3 px-2">{appointment.appointmentTime}</td>
                        <td className="py-3 px-2">{patient ? `${patient.firstName} ${patient.lastName}` : "—"}</td>
                        <td className="py-3 px-2">{patient?.documentNumber ?? "—"}</td>
                        <td className="py-3 px-2">{doctor ? `${doctor.firstName} ${doctor.lastName}` : "—"}</td>
                        <td className="py-3 px-2 max-w-[180px]">
                          {isEditing ? (
                            <Form method="post" className="space-y-1">
                              <input type="hidden" name="intent" value="updateNoShow" />
                              <input type="hidden" name="appointmentId" value={appointment.id} />
                              <Input name="noShowReason" defaultValue={noShowReason} placeholder="Motivo" className="text-sm" />
                              <Input name="noShowFollowUp" defaultValue={noShowFollowUp} placeholder="Seguimiento" className="text-sm mt-1" />
                              <div className="flex gap-1 mt-1">
                                <Button type="submit" size="sm">Guardar</Button>
                                <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancelar</Button>
                              </div>
                            </Form>
                          ) : (
                            <>
                              <span className="text-muted-foreground truncate block">{noShowReason || "—"}</span>
                              <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setEditingId(appointment.id)}>Editar</Button>
                            </>
                          )}
                        </td>
                        <td className="py-3 px-2 max-w-[180px] text-muted-foreground truncate">
                          {!isEditing && (noShowFollowUp || "—")}
                        </td>
                        <td className="py-3 px-2">
                          {patient && (
                            <Link to={`/pacientes/${patient.id}`} className="text-primary hover:underline inline-flex items-center gap-1">
                              Ver <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
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
