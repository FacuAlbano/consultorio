import * as React from "react";
import { useLoaderData, useActionData, useSearchParams, useFetcher, useRevalidator, Form, Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ResponsiveDialog } from "~/components/crud/responsive-dialog";
import { Calendar, Stethoscope, ExternalLink, Plus, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { formatDate } from "~/lib/utils";

const INTENT_CREATE = "create";

type LoaderData = {
  appointments: Array<{
    appointment: { id: string; appointmentTime: string; status: string };
    patient: { id: string; firstName: string; lastName: string } | null;
  }>;
  doctors: Array<{ id: string; firstName: string; lastName: string }>;
  consultingRooms: Array<{ id: string; name: string }>;
  appointmentTypes: Array<{ id: string; name: string; duration: string | null }>;
  date: string;
  doctorId: string;
};

export function ListadoAgenda() {
  const { appointments, doctors, consultingRooms, appointmentTypes, date: initialDate, doctorId: initialDoctorId } = useLoaderData<LoaderData>();
  const actionData = useActionData<{ success?: boolean; error?: string; createdId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [date, setDate] = useState(initialDate);
  const [doctorId, setDoctorId] = useState(initialDoctorId);
  const [createOpen, setCreateOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<Array<{ id: string; label: string; documentNumber?: string }>>([]);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; label: string } | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetcher = useFetcher<{ success?: boolean; error?: string; createdId?: string }>();
  const revalidator = useRevalidator();
  const navigate = useNavigate();

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("date", date);
    if (doctorId) params.set("doctorId", doctorId);
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    if (patientSearch.trim().length < 2) {
      setPatientResults([]);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetch(`/api/patients/search?q=${encodeURIComponent(patientSearch)}&filter=all`)
        .then((r) => r.json())
        .then((data: { patients: Array<{ id: string; label: string; documentNumber?: string }> }) => {
          setPatientResults(data.patients || []);
        })
        .catch(() => setPatientResults([]));
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [patientSearch]);

  useEffect(() => {
    const data = fetcher.data ?? actionData;
    if (data?.success) {
      toast.success("Turno creado correctamente");
      setCreateOpen(false);
      setSelectedPatient(null);
      setPatientSearch("");
      setPatientResults([]);
      revalidator.revalidate();
    } else if (data?.success === false && data?.error) {
      toast.error(data.error);
    }
    // No incluir revalidator en deps para evitar bucle
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.data, actionData]);

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
          Vista de agenda por médico y fecha. Seleccione médico y fecha para ver turnos y agregar nuevos.
        </p>
      </div>

      <Card>
        <CardContent className="py-3 px-4 sm:px-6">
          <Form onSubmit={handleFilter} className="flex flex-wrap gap-3 items-center">
            <span className="text-sm font-medium text-foreground border-r border-border pr-3">Filtros</span>
            <div className="flex flex-col gap-1 min-w-[110px]">
              <label className="text-xs font-medium">Fecha</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="h-8 w-full text-sm" />
            </div>
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-xs font-medium">Médico</label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm"
              >
                <option value="">Seleccionar médico</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.firstName} {d.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="h-8">Ver agenda</Button>
              {doctorId && (
                <Button type="button" size="sm" className="h-8 gap-1" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Agregar turno
                </Button>
              )}
            </div>
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
              <p className="text-center py-8 text-muted-foreground">
                No hay turnos para esta fecha y médico. Use &quot;Agregar turno&quot; para cargar uno.
              </p>
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
                        <td className="py-3 px-2">{statusLabel[appointment.status] ?? appointment.status}</td>
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

      <ResponsiveDialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPatient(null);
            setPatientSearch("");
            setPatientResults([]);
          }
          setCreateOpen(open);
        }}
        title="Agregar turno"
        description={selectedDoctor ? `${selectedDoctor.firstName} ${selectedDoctor.lastName} — ${formatDate(date, "es-AR")}` : ""}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agenda-patientSearch">Buscar paciente (nombre, DNI, HC)</Label>
            <Input
              id="agenda-patientSearch"
              type="text"
              placeholder="Escriba para buscar..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className="h-9"
            />
            {patientResults.length > 0 && (
              <ul className="border rounded-md divide-y max-h-48 overflow-y-auto">
                {patientResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm flex justify-between items-center"
                    onClick={() => setSelectedPatient({ id: p.id, label: p.label })}
                  >
                    <span>{p.label}</span>
                    {p.documentNumber && (
                      <span className="text-muted-foreground text-xs">DNI {p.documentNumber}</span>
                    )}
                  </button>
                ))}
              </ul>
            )}
            {selectedPatient && (
              <p className="text-sm text-muted-foreground">
                Seleccionado: <strong>{selectedPatient.label}</strong>
              </p>
            )}
          </div>

          <fetcher.Form method="post" className="space-y-4">
            <input type="hidden" name="_intent" value={INTENT_CREATE} />
            <input type="hidden" name="appointmentDate" value={date} />
            <input type="hidden" name="doctorId" value={doctorId} />
            <input type="hidden" name="patientId" value={selectedPatient?.id ?? ""} />
            <div className="space-y-2">
              <Label htmlFor="agenda-time">Hora *</Label>
              <Input id="agenda-time" name="appointmentTime" type="time" required className="h-9" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agenda-room">Consultorio</Label>
              <select
                id="agenda-room"
                name="consultingRoomId"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="">—</option>
                {consultingRooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agenda-type">Tipo de turno</Label>
              <select
                id="agenda-type"
                name="appointmentTypeId"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="">—</option>
                {appointmentTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agenda-notes">Notas</Label>
              <Input id="agenda-notes" name="notes" placeholder="Opcional" className="h-9" />
            </div>
            {(fetcher.data?.success === false && fetcher.data?.error) || (actionData?.success === false && actionData?.error) ? (
              <p className="text-sm text-destructive">{(fetcher.data ?? actionData)?.error}</p>
            ) : null}
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!selectedPatient?.id || fetcher.state !== "idle"}>
                {fetcher.state !== "idle" ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creando...</>
                ) : (
                  "Crear turno"
                )}
              </Button>
            </div>
          </fetcher.Form>
        </div>
      </ResponsiveDialog>
    </div>
  );
}
