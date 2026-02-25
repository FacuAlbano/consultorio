import * as React from "react";
import { useLoaderData, useActionData, useSearchParams, Form, Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { UserX, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { formatDate } from "~/lib/utils";

export function ListadoPacientesNoAtendidos() {
  const { appointments, doctors, date: initialDate, doctorId: initialDoctorId } = useLoaderData<{
    appointments: Array<{
      appointment: {
        id: string;
        appointmentDate: string;
        appointmentTime: string;
        noShowReason: string | null;
        noShowFollowUp: string | null;
      };
      patient: { id: string; firstName: string; lastName: string; documentNumber?: string | null } | null;
      doctor: { firstName: string; lastName: string } | null;
    }>;
    doctors: Array<{ id: string; firstName: string; lastName: string }>;
    date: string;
    doctorId: string;
  }>();
  const actionData = useActionData<{ success?: boolean; error?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [date, setDate] = useState(initialDate);
  const [doctorId, setDoctorId] = useState(initialDoctorId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (actionData?.success) {
      toast.success("Actualización realizada correctamente");
      setEditingId(null);
    } else if (actionData?.success === false && actionData?.error) {
      toast.error(actionData.error);
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
        <CardContent className="py-3 px-4 sm:px-6">
          <Form onSubmit={handleFilter} className="flex flex-wrap gap-3 items-center">
            <span className="text-sm font-medium text-foreground border-r border-border pr-3">Filtros</span>
            <div className="flex flex-col gap-1 min-w-[110px]">
              <label className="text-xs font-medium">Fecha</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 w-full text-sm" />
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
                      <tr
                        key={appointment.id}
                        role="button"
                        tabIndex={0}
                        className="border-b border-border/50 hover:bg-muted/30 cursor-pointer"
                        onClick={() => patient && !isEditing && navigate(`/pacientes/${patient.id}`)}
                        onKeyDown={(e) => {
                          if ((e.key === "Enter" || e.key === " ") && patient && !isEditing) {
                            e.preventDefault();
                            navigate(`/pacientes/${patient.id}`);
                          }
                        }}
                      >
                        <td className="py-3 px-2">{formatDate(appointment.appointmentDate)}</td>
                        <td className="py-3 px-2">{appointment.appointmentTime}</td>
                        <td className="py-3 px-2">{patient ? `${patient.firstName} ${patient.lastName}` : "—"}</td>
                        <td className="py-3 px-2">{patient?.documentNumber ?? "—"}</td>
                        <td className="py-3 px-2">{doctor ? `${doctor.firstName} ${doctor.lastName}` : "—"}</td>
                        <td className="py-3 px-2 max-w-[180px]" onClick={(e) => e.stopPropagation()}>
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
                        <td className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
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
