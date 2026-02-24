import * as React from "react";
import {
  useLoaderData,
  useActionData,
  useSearchParams,
  useFetcher,
  useRevalidator,
  useNavigate,
  Form,
  Link,
} from "react-router";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ResponsiveDialog } from "~/components/crud/responsive-dialog";
import { ClipboardList, Plus, Loader2, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "~/lib/utils";

const INTENTS = { create: "create", update: "update", cancel: "cancel", delete: "delete" } as const;

const statusLabel: Record<string, string> = {
  scheduled: "Programado",
  attended: "Atendido",
  cancelled: "Cancelado",
  no_show: "No asistió",
};

type LoaderData = {
  appointments: Array<{
    appointment: {
      id: string;
      appointmentDate: string;
      appointmentTime: string;
      status: string;
      notes: string | null;
      patientId: string;
      doctorId: string | null;
      consultingRoomId: string | null;
      appointmentTypeId: string | null;
    };
    patient: { id: string; firstName: string; lastName: string } | null;
    doctor: { id: string; firstName: string; lastName: string } | null;
  }>;
  doctors: Array<{ id: string; firstName: string; lastName: string }>;
  date: string;
  doctorId: string;
  status: string;
  consultingRooms: Array<{ id: string; name: string }>;
  appointmentTypes: Array<{ id: string; name: string; duration: string | null }>;
  appointmentToEdit: Awaited<ReturnType<typeof import("~/lib/appointments.server").getAppointmentById>>;
  patients: Array<{ id: string; firstName: string; lastName: string }>;
};

function TurnoFormFields({
  doctors,
  patients,
  consultingRooms,
  appointmentTypes,
  appointment,
}: {
  doctors: LoaderData["doctors"];
  patients: LoaderData["patients"];
  consultingRooms: LoaderData["consultingRooms"];
  appointmentTypes: LoaderData["appointmentTypes"];
  appointment?: LoaderData["appointmentToEdit"];
}) {
  const apt = appointment?.appointment;
  const defDate = apt?.appointmentDate ?? "";
  const defTime = apt?.appointmentTime ? String(apt.appointmentTime).slice(0, 5) : "";
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="patientId">Paciente *</Label>
        <select
          id="patientId"
          name="patientId"
          required
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          defaultValue={apt?.patientId ?? ""}
        >
          <option value="">Seleccionar paciente</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="doctorId">Médico</Label>
        <select
          id="doctorId"
          name="doctorId"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          defaultValue={apt?.doctorId ?? ""}
        >
          <option value="">Sin asignar</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="appointmentDate">Fecha *</Label>
          <Input id="appointmentDate" name="appointmentDate" type="date" required defaultValue={defDate} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="appointmentTime">Hora *</Label>
          <Input id="appointmentTime" name="appointmentTime" type="time" required defaultValue={defTime} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="consultingRoomId">Consultorio</Label>
          <select
            id="consultingRoomId"
            name="consultingRoomId"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            defaultValue={apt?.consultingRoomId ?? ""}
          >
            <option value="">—</option>
            {consultingRooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="appointmentTypeId">Tipo de turno</Label>
          <select
            id="appointmentTypeId"
            name="appointmentTypeId"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            defaultValue={apt?.appointmentTypeId ?? ""}
          >
            <option value="">—</option>
            {appointmentTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Input id="notes" name="notes" defaultValue={apt?.notes ?? ""} placeholder="Opcional" />
      </div>
    </>
  );
}

export function ListadoTurnos() {
  const {
    appointments,
    doctors,
    date: initialDate,
    doctorId: initialDoctorId,
    status: initialStatus,
    consultingRooms,
    appointmentTypes,
    appointmentToEdit,
    patients,
  } = useLoaderData<LoaderData>();
  const actionData = useActionData<{ success?: boolean; error?: string; createdId?: string; cancelled?: boolean; deleted?: boolean }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [date, setDate] = React.useState(initialDate);
  const [doctorId, setDoctorId] = React.useState(initialDoctorId);
  const [status, setStatus] = React.useState(initialStatus);
  const [createOpen, setCreateOpen] = React.useState(false);
  const revalidator = useRevalidator();
  const navigate = useNavigate();

  const createFetcher = useFetcher<{ success?: boolean; error?: string; createdId?: string }>();
  const editFetcher = useFetcher<{ success?: boolean; error?: string }>();

  const openEdit = (appointmentId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("appointment", appointmentId);
    setSearchParams(params, { replace: true });
  };

  const closeEdit = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("appointment");
    setSearchParams(params, { replace: true });
  };

  const editOpen = !!appointmentToEdit;

  React.useEffect(() => {
    if (createFetcher.data?.success) {
      toast.success("Turno creado correctamente");
      setCreateOpen(false);
      revalidator.revalidate();
    } else if (createFetcher.data?.success === false && createFetcher.data?.error) {
      toast.error(createFetcher.data.error);
    }
  }, [createFetcher.data, revalidator]);

  React.useEffect(() => {
    if (editFetcher.data?.success) {
      toast.success("Turno actualizado correctamente");
      closeEdit();
      revalidator.revalidate();
    } else if (editFetcher.data?.success === false && editFetcher.data?.error) {
      toast.error(editFetcher.data.error);
    }
  }, [editFetcher.data, revalidator]);

  React.useEffect(() => {
    if (actionData?.success && (actionData?.cancelled || actionData?.deleted)) {
      toast.success(actionData.deleted ? "Turno eliminado" : "Turno cancelado");
      revalidator.revalidate();
    } else if (actionData?.success === false && actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData, revalidator]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (doctorId) params.set("doctorId", doctorId);
    if (status) params.set("status", status);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ClipboardList className="h-7 w-7" />
          Turnos de la Institución
        </h1>
        <p className="text-muted-foreground mt-1">
          Vista general de turnos. Filtros por fecha, médico y estado. Crear, editar o cancelar turnos.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm font-medium text-foreground mb-3">Filtros</p>
          <Form onSubmit={handleFilter} className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1 min-w-[140px]">
              <label className="text-sm font-medium">Fecha</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 w-full" />
            </div>
            <div className="space-y-1 min-w-[180px]">
              <label className="text-sm font-medium">Médico</label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="">Todos</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1 min-w-[140px]">
              <label className="text-sm font-medium">Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="">Todos</option>
                {Object.entries(statusLabel).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="h-9">Filtrar</Button>
              <Button type="button" variant="secondary" className="h-9 gap-1" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Nuevo
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Turnos {appointments.length > 0 ? `(${appointments.length})` : ""}</CardTitle>
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
                    <th className="text-left py-3 px-2 w-32">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(({ appointment, patient, doctor }) => (
                    <tr
                      key={appointment.id}
                      role="button"
                      tabIndex={0}
                      className="border-b border-border/50 hover:bg-muted/30 cursor-pointer"
                      onClick={() => {
                        if (patient) navigate(`/pacientes/${patient.id}`);
                        else openEdit(appointment.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          if (patient) navigate(`/pacientes/${patient.id}`);
                          else openEdit(appointment.id);
                        }
                      }}
                    >
                      <td className="py-3 px-2">{formatDate(appointment.appointmentDate)}</td>
                      <td className="py-3 px-2">{appointment.appointmentTime}</td>
                      <td className="py-3 px-2">{patient ? `${patient.firstName} ${patient.lastName}` : "—"}</td>
                      <td className="py-3 px-2">{doctor ? `${doctor.firstName} ${doctor.lastName}` : "—"}</td>
                      <td className="py-3 px-2">{statusLabel[appointment.status] ?? appointment.status}</td>
                      <td className="py-3 px-2 space-x-2" onClick={(e) => e.stopPropagation()}>
                        {patient && (
                          <Link to={`/pacientes/${patient.id}`} className="text-primary hover:underline inline-flex items-center gap-1">
                            Ver <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                        {appointment.status === "scheduled" && (
                          <>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground hover:underline inline-flex items-center gap-1"
                              onClick={() => openEdit(appointment.id)}
                            >
                              <Pencil className="h-3 w-3" /> Editar
                            </button>
                            <Form method="post" className="inline">
                              <input type="hidden" name="_intent" value={INTENTS.cancel} />
                              <input type="hidden" name="appointmentId" value={appointment.id} />
                              <Button
                                type="submit"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive h-auto p-0 min-w-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!confirm("¿Cancelar este turno?")) e.preventDefault();
                                }}
                              >
                                Cancelar
                              </Button>
                            </Form>
                            <Form method="post" className="inline">
                              <input type="hidden" name="_intent" value={INTENTS.delete} />
                              <input type="hidden" name="appointmentId" value={appointment.id} />
                              <Button
                                type="submit"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive h-auto p-0 min-w-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!confirm("¿Eliminar definitivamente este turno?")) e.preventDefault();
                                }}
                              >
                                <Trash2 className="h-3 w-3" /> Eliminar
                              </Button>
                            </Form>
                          </>
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

      <ResponsiveDialog open={createOpen} onOpenChange={setCreateOpen} title="Nuevo turno" description="Crear un nuevo turno">
        <createFetcher.Form method="post" className="space-y-4">
          <input type="hidden" name="_intent" value={INTENTS.create} />
          <TurnoFormFields
            doctors={doctors}
            patients={patients}
            consultingRooms={consultingRooms}
            appointmentTypes={appointmentTypes}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={createFetcher.state !== "idle"}>
              {createFetcher.state !== "idle" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creando...</> : "Crear turno"}
            </Button>
          </div>
          {createFetcher.data?.success === false && createFetcher.data?.error && (
            <p className="text-sm text-destructive">{createFetcher.data.error}</p>
          )}
        </createFetcher.Form>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={editOpen}
        onOpenChange={(open) => !open && closeEdit()}
        title="Editar turno"
        description={appointmentToEdit ? `Turno ${appointmentToEdit.appointment.appointmentDate} ${appointmentToEdit.appointment.appointmentTime}` : ""}
      >
        {appointmentToEdit && (
          <editFetcher.Form method="post" className="space-y-4">
            <input type="hidden" name="_intent" value={INTENTS.update} />
            <input type="hidden" name="appointmentId" value={appointmentToEdit.appointment.id} />
            <TurnoFormFields
              doctors={doctors}
              patients={patients}
              consultingRooms={consultingRooms}
              appointmentTypes={appointmentTypes}
              appointment={appointmentToEdit}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end pt-2">
              <Button type="button" variant="outline" onClick={closeEdit}>Cancelar</Button>
              <Button type="submit" disabled={editFetcher.state !== "idle"}>
                {editFetcher.state !== "idle" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando...</> : "Guardar cambios"}
              </Button>
            </div>
            {editFetcher.data?.success === false && editFetcher.data?.error && (
              <p className="text-sm text-destructive">{editFetcher.data.error}</p>
            )}
          </editFetcher.Form>
        )}
      </ResponsiveDialog>
    </div>
  );
}
