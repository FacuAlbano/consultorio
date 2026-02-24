import * as React from "react";
import { useLoaderData, useActionData, useSearchParams, useFetcher, useRevalidator, Form, Link } from "react-router";
import type { Route } from "./+types/dashboard.agenda";
import { requireAuth } from "~/lib/middleware";
import { getAppointments, createAppointment } from "~/lib/appointments.server";
import { getAllDoctors } from "~/lib/doctors.server";
import { getAllConsultingRooms } from "~/lib/consulting-rooms.server";
import { getAllAppointmentTypes } from "~/lib/appointment-types.server";
import { getTodayLocalISO } from "~/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ResponsiveDialog } from "~/components/crud/responsive-dialog";
import { Calendar, Clock, Plus, Loader2, User } from "lucide-react";
import { PATHS } from "~/lib/constants";
import { formatDate } from "~/lib/utils";

/** Horario de inicio y fin (horas). Slots cada 15 min. */
const HORA_INICIO = 8;
const HORA_FIN = 18;
const INTERVALO_MIN = 15;

function buildSlots(): string[] {
  const slots: string[] = [];
  for (let h = HORA_INICIO; h < HORA_FIN; h++) {
    for (let m = 0; m < 60; m += INTERVALO_MIN) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

const SLOTS = buildSlots();

/** Normaliza hora "HH:MM:SS" o "HH:MM" a "HH:MM" */
function normTime(t: string): string {
  const part = String(t).slice(0, 5);
  return part.length === 5 ? part : t;
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const url = new URL(request.url);
  const date = url.searchParams.get("date") || getTodayLocalISO();
  const doctorId = url.searchParams.get("doctorId") || "";
  const consultingRoomId = url.searchParams.get("consultingRoomId") || "";

  const [appointments, doctors, consultingRooms, appointmentTypes] = await Promise.all([
    getAppointments({
      date,
      doctorId: doctorId || undefined,
      consultingRoomId: consultingRoomId || undefined,
      limit: 500,
    }),
    getAllDoctors({ limit: 100 }),
    getAllConsultingRooms({ limit: 50 }),
    getAllAppointmentTypes({ limit: 50 }),
  ]);

  return {
    date,
    doctorId,
    consultingRoomId,
    appointments,
    doctors,
    consultingRooms,
    appointmentTypes,
  };
}

const INTENT_CREATE = "create";

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const formData = await request.formData();
  if (formData.get("_intent") !== INTENT_CREATE) {
    return { success: false as const, error: "Acción no válida" };
  }
  const patientId = formData.get("patientId") as string;
  const appointmentDate = formData.get("appointmentDate") as string;
  const appointmentTime = formData.get("appointmentTime") as string;
  const doctorId = (formData.get("doctorId") as string) || undefined;
  const consultingRoomId = (formData.get("consultingRoomId") as string) || undefined;
  const appointmentTypeId = (formData.get("appointmentTypeId") as string) || undefined;
  const notes = (formData.get("notes") as string)?.trim() || undefined;
  if (!patientId || !appointmentDate || !appointmentTime) {
    return { success: false as const, error: "Paciente, fecha y hora son obligatorios" };
  }
  const result = await createAppointment({
    patientId,
    doctorId: doctorId || null,
    consultingRoomId: consultingRoomId || null,
    appointmentTypeId: appointmentTypeId || null,
    appointmentDate,
    appointmentTime: appointmentTime.length === 5 ? `${appointmentTime}:00` : appointmentTime,
    notes,
    status: "scheduled",
    isOverbooking: false,
  });
  if (!result.success) return { success: false, error: result.error };
  return { success: true as const };
}

const statusLabel: Record<string, string> = {
  scheduled: "Programado",
  attended: "Atendido",
  cancelled: "Cancelado",
  no_show: "No asistió",
};

export default function AgendaPage() {
  const {
    date,
    doctorId,
    consultingRoomId,
    appointments,
    doctors,
    consultingRooms,
    appointmentTypes,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams, setSearchParams] = useSearchParams();
  const fetcher = useFetcher<{ success?: boolean; error?: string }>();
  const revalidator = useRevalidator();
  const [assignSlot, setAssignSlot] = React.useState<string | null>(null);
  const [patientSearch, setPatientSearch] = React.useState("");
  const [patientResults, setPatientResults] = React.useState<Array<{ id: string; label: string; documentNumber?: string }>>([]);
  const [selectedPatient, setSelectedPatient] = React.useState<{ id: string; label: string } | null>(null);
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const params = new URLSearchParams();
    const d = fd.get("date") as string;
    const doc = fd.get("doctorId") as string;
    const room = fd.get("consultingRoomId") as string;
    if (d) params.set("date", d);
    if (doc) params.set("doctorId", doc);
    if (room) params.set("consultingRoomId", room);
    setSearchParams(params, { replace: true });
  };

  const appointmentsByTime = React.useMemo(() => {
    const map = new Map<string, (typeof appointments)[0]>();
    for (const row of appointments) {
      const key = normTime(row.appointment.appointmentTime);
      map.set(key, row);
    }
    return map;
  }, [appointments]);

  React.useEffect(() => {
    if (!patientSearch.trim() || patientSearch.length < 2) {
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

  React.useEffect(() => {
    if (fetcher.data?.success) {
      setAssignSlot(null);
      setSelectedPatient(null);
      setPatientSearch("");
      setPatientResults([]);
      revalidator.revalidate();
    }
  }, [fetcher.data, revalidator]);

  const assignOpen = assignSlot !== null;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="h-7 w-7" />
          Agenda del día
        </h1>
        <p className="text-muted-foreground mt-1">
          Elija la fecha y opcionalmente médico o consultorio. Cada casilla es un turno de 15 minutos. Haga clic en &quot;Asignar&quot; para poner un paciente en ese horario.
        </p>
      </div>

      <Card>
        <CardHeader className="py-2 px-4 sm:px-6">
          <CardTitle className="text-sm font-medium">Día y filtros</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-3 px-4 sm:px-6">
          <form onSubmit={handleFilter} className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" name="date" type="date" required defaultValue={date} className="h-9" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="doctorId">Médico</Label>
              <select
                id="doctorId"
                name="doctorId"
                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm min-w-[180px]"
                defaultValue={doctorId}
              >
                <option value="">Todos</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="consultingRoomId">Consultorio</Label>
              <select
                id="consultingRoomId"
                name="consultingRoomId"
                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm min-w-[140px]"
                defaultValue={consultingRoomId}
              >
                <option value="">Todos</option>
                {consultingRooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm" className="h-9">Ver agenda</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {formatDate(date, "es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Turnos cada 15 minutos. Clic en &quot;Asignar&quot; para agregar un paciente a ese horario.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {SLOTS.map((slotTime) => {
              const row = appointmentsByTime.get(slotTime);
              return (
                <div
                  key={slotTime}
                  className="flex items-center gap-4 py-2 px-3 rounded-lg border border-border/50 hover:bg-muted/30"
                >
                  <div className="w-16 shrink-0 font-medium text-muted-foreground">{slotTime}</div>
                  <div className="flex-1 min-w-0">
                    {row ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium">
                          {row.patient ? `${row.patient.firstName} ${row.patient.lastName}` : "—"}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {statusLabel[row.appointment.status] ?? row.appointment.status}
                        </span>
                        {row.doctor && (
                          <span className="text-muted-foreground text-sm">
                            · {row.doctor.firstName} {row.doctor.lastName}
                          </span>
                        )}
                        {row.patient && (
                          <Button asChild variant="ghost" size="sm" className="h-8">
                            <Link to={PATHS.patientProfile(row.patient.id)}>Ver paciente</Link>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1 h-9"
                        onClick={() => setAssignSlot(slotTime)}
                      >
                        <Plus className="h-4 w-4" />
                        Asignar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <ResponsiveDialog
        open={assignOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAssignSlot(null);
            setSelectedPatient(null);
            setPatientSearch("");
            setPatientResults([]);
          }
        }}
        title="Asignar paciente al turno"
        description={assignSlot ? `Horario ${assignSlot} — ${formatDate(date, "es-AR")}` : ""}
      >
        {assignSlot && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patientSearch">Buscar paciente (nombre, DNI, HC)</Label>
              <Input
                id="patientSearch"
                type="text"
                placeholder="Escriba para buscar..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="h-9"
              />
              {patientResults.length > 0 && (
                <ul className="border rounded-md divide-y max-h-48 overflow-y-auto">
                  {patientResults.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm flex justify-between items-center"
                        onClick={() => setSelectedPatient({ id: p.id, label: p.label })}
                      >
                        <span>{p.label}</span>
                        {p.documentNumber && (
                          <span className="text-muted-foreground text-xs">DNI {p.documentNumber}</span>
                        )}
                      </button>
                    </li>
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
              <input type="hidden" name="appointmentTime" value={assignSlot} />
              <input type="hidden" name="patientId" value={selectedPatient?.id ?? ""} />
              {doctorId && <input type="hidden" name="doctorId" value={doctorId} />}
              {consultingRoomId && <input type="hidden" name="consultingRoomId" value={consultingRoomId} />}
              <div className="space-y-2">
                <Label>Tipo de turno</Label>
                <select
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
                <Label htmlFor="notes">Notas</Label>
                <Input id="notes" name="notes" placeholder="Opcional" className="h-9" />
              </div>
              {actionData?.success === false && actionData?.error && (
                <p className="text-sm text-destructive">{actionData.error}</p>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setAssignSlot(null)}>
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
        )}
      </ResponsiveDialog>
    </div>
  );
}
