import * as React from "react";
import { useLoaderData, useActionData, useSearchParams, useFetcher, useRevalidator, Form, Link } from "react-router";
import { toast } from "sonner";
import type { Route } from "./+types/dashboard.agenda._index";
import { requireAuth } from "~/lib/middleware";
import { getAppointments, createAppointment, updateAppointment, deleteAppointment } from "~/lib/appointments.server";
import { createPatient, getPatientByDocument } from "~/lib/patients.server";
import { getAllDoctors } from "~/lib/doctors.server";
import { getAllConsultingRooms } from "~/lib/consulting-rooms.server";
import { getAllAppointmentTypes } from "~/lib/appointment-types.server";
import { getSlotsForDoctorAndDate } from "~/lib/doctor-agenda.server";
import { cn, formatDate, getTodayLocalISO, calculateAge, capitalizeWords } from "~/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ResponsiveDialog } from "~/components/crud/responsive-dialog";
import { Calendar as CalendarIcon, Clock, Plus, Loader2, User, List, Settings, Pencil, Trash2, CalendarPlus } from "lucide-react";
import { Calendar } from "~/components/ui/calendar";
import type { DayButtonProps } from "react-day-picker";
import { PATHS } from "~/lib/constants";

/** Slots por defecto cuando no hay médico o no tiene agenda configurada: 8-18 cada 15 min */
function buildDefaultSlots(): string[] {
  const slots: string[] = [];
  for (let h = 8; h < 18; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}
const DEFAULT_SLOTS = buildDefaultSlots();

/** Normaliza hora "HH:MM:SS" o "HH:MM" a "HH:MM" */
function normTime(t: string): string {
  const part = String(t).slice(0, 5);
  return part.length === 5 ? part : t;
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const url = new URL(request.url);
  const date = url.searchParams.get("date") || getTodayLocalISO();
  const viewParam = url.searchParams.get("view") || "lista";
  const view = (viewParam === "mes" ? "lista" : viewParam) as "dia" | "lista";
  const doctorId = url.searchParams.get("doctorId") || "";
  const consultingRoomId = url.searchParams.get("consultingRoomId") || "";
  const appointmentTypeId = url.searchParams.get("appointmentTypeId") || "";
  const status = url.searchParams.get("status") || "";

  const monthStart = date.slice(0, 7) + "-01";
  const monthEnd = endOfMonth(monthStart);
  const dateFrom =
    url.searchParams.get("dateFrom") || (view === "lista" ? monthStart : date);
  const dateTo =
    url.searchParams.get("dateTo") || (view === "lista" ? monthEnd : date);

  const effectiveFrom = view === "lista" ? dateFrom : date;
  const effectiveTo = view === "lista" ? dateTo : date;
  const queryFrom = view === "lista" ? monthStart : date;
  const queryTo = view === "lista" ? monthEnd : date;

  const [appointments, doctors, consultingRooms, appointmentTypes, slotsForDay] = await Promise.all([
    getAppointments({
      date: view === "dia" ? date : undefined,
      dateFrom: view !== "dia" ? queryFrom : undefined,
      dateTo: view !== "dia" ? queryTo : undefined,
      doctorId: doctorId || undefined,
      consultingRoomId: consultingRoomId || undefined,
      appointmentTypeId: appointmentTypeId || undefined,
      status: status || undefined,
      limit: 500,
    }),
    getAllDoctors({ limit: 100 }),
    getAllConsultingRooms({ limit: 50 }),
    getAllAppointmentTypes({ limit: 50 }),
    doctorId && date ? getSlotsForDoctorAndDate(doctorId, date) : Promise.resolve([]),
  ]);

  const specialties = [...new Set(doctors.map((d) => d.specialty).filter(Boolean))] as string[];
  specialties.sort();

  return {
    date,
    view,
    dateFrom,
    dateTo,
    monthStart,
    monthEnd,
    doctorId,
    consultingRoomId,
    appointmentTypeId,
    status,
    appointments,
    doctors,
    consultingRooms,
    appointmentTypes,
    specialties,
    slotsForDay,
  };
}

function endOfMonth(dateStr: string): string {
  const [y, m] = dateStr.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

const INTENT_CREATE = "create";
const INTENT_UPDATE = "updateAppointment";
const INTENT_DELETE = "deleteAppointment";
const INTENT_CREATE_PATIENT = "createPatient";

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("_intent");

  if (intent === INTENT_CREATE_PATIENT) {
    const firstName = (formData.get("firstName") as string)?.trim() || "";
    const lastName = (formData.get("lastName") as string)?.trim() || "";
    const documentNumber = (formData.get("documentNumber") as string)?.trim() || "";
    const documentType = (formData.get("documentType") as string) || "DNI";
    const phone = (formData.get("phone") as string)?.trim() || undefined;
    const email = (formData.get("email") as string)?.trim() || undefined;
    const birthDateRaw = (formData.get("birthDate") as string)?.trim() || null;
    const birthDate = birthDateRaw && birthDateRaw.length >= 10 ? birthDateRaw.slice(0, 10) : null;
    const insuranceCompany = (formData.get("insuranceCompany") as string)?.trim() || null;
    const insuranceNumber = (formData.get("insuranceNumber") as string)?.trim() || null;
    if (!firstName || !lastName || !documentNumber) {
      return { success: false as const, error: "Nombre, apellido y documento son obligatorios" };
    }
    const existing = await getPatientByDocument(documentNumber);
    if (existing) {
      return {
        success: false as const,
        error: "Ya existe un paciente con ese número de documento",
        patientId: existing.id,
        patientLabel: `${existing.firstName} ${existing.lastName}`,
      };
    }
    const result = await createPatient({
      firstName,
      lastName,
      documentNumber,
      documentType,
      phone,
      email,
      birthDate,
      insuranceCompany,
      insuranceNumber,
    });
    if (!result.success || !result.data) {
      return { success: false as const, error: "Error al crear el paciente" };
    }
    return {
      success: true as const,
      patientId: result.data.id,
      patientLabel: `${result.data.firstName} ${result.data.lastName}`,
    };
  }

  if (intent === INTENT_DELETE) {
    const appointmentId = formData.get("appointmentId") as string;
    if (!appointmentId) return { success: false as const, error: "ID de turno requerido" };
    const result = await deleteAppointment(appointmentId);
    if (!result.success) return { success: false, error: result.error };
    return { success: true as const, deleted: true };
  }

  if (intent === INTENT_UPDATE) {
    const appointmentId = formData.get("appointmentId") as string;
    const estado = (formData.get("estado") as string) || "";
    if (!appointmentId) return { success: false as const, error: "ID de turno requerido" };
    const updateData: { status?: string; isOverbooking?: boolean } = {};
    if (estado === "attended") { updateData.status = "attended"; updateData.isOverbooking = false; }
    else if (estado === "cancelled") { updateData.status = "cancelled"; updateData.isOverbooking = false; }
    else if (estado === "no_show") { updateData.status = "no_show"; updateData.isOverbooking = false; }
    else if (estado === "sobre_turno") { updateData.status = "scheduled"; updateData.isOverbooking = true; }
    else if (estado === "scheduled") { updateData.status = "scheduled"; updateData.isOverbooking = false; }
    if (Object.keys(updateData).length === 0) return { success: false as const, error: "Estado no válido" };
    const result = await updateAppointment(appointmentId, updateData);
    if (!result.success) return { success: false, error: result.error };
    return { success: true as const, updated: true };
  }

  if (intent !== INTENT_CREATE) {
    return { success: false as const, error: "Acción no válida" };
  }

  const patientId = formData.get("patientId") as string;
  const appointmentDate = formData.get("appointmentDate") as string;
  const appointmentTime = formData.get("appointmentTime") as string;
  const doctorId = (formData.get("doctorId") as string) || undefined;
  const consultingRoomId = (formData.get("consultingRoomId") as string) || undefined;
  const appointmentTypeId = (formData.get("appointmentTypeId") as string) || undefined;
  const notes = (formData.get("notes") as string)?.trim() || undefined;
  const isOverbooking = formData.get("isOverbooking") === "1" || formData.get("sobreTurno") === "1";
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
    isOverbooking: !!isOverbooking,
  });
  if (!result.success) return { success: false, error: result.error };
  return { success: true as const };
}

/** Opciones de estado: mismo color en el select (Editar) y en la lista (StatusBadge) */
const ESTADO_OPTIONS = [
  { value: "scheduled", label: "En espera", badgeClass: "bg-sky-500/20 text-sky-800 dark:text-sky-200", selectClass: "bg-sky-500/20 border-sky-500/50 text-sky-800 dark:text-sky-200" },
  { value: "attended", label: "Atendido", badgeClass: "bg-green-600/20 text-green-700 dark:text-green-300", selectClass: "bg-green-600/20 border-green-600/50 text-green-800 dark:text-green-200" },
  { value: "cancelled", label: "Cancelado", badgeClass: "bg-red-600/20 text-red-700 dark:text-red-300", selectClass: "bg-red-600/20 border-red-600/50 text-red-800 dark:text-red-200" },
  { value: "no_show", label: "No asistió", badgeClass: "bg-rose-200 text-rose-900 dark:bg-rose-900/60 dark:text-rose-100", selectClass: "bg-rose-200 text-rose-900 border-rose-400 dark:bg-rose-900/60 dark:text-rose-100 dark:border-rose-700" },
  { value: "sobre_turno", label: "Sobre turno", badgeClass: "bg-amber-500/20 text-amber-700 dark:text-amber-300", selectClass: "bg-amber-500/20 border-amber-500/50 text-amber-800 dark:text-amber-200" },
] as const;

function getEstadoDisplay(status: string, isOverbooking?: boolean): { value: string; label: string; badgeClass: string } {
  if (status === "cancelled") return { value: "cancelled", label: "Cancelado", badgeClass: ESTADO_OPTIONS.find(o => o.value === "cancelled")!.badgeClass };
  if (status === "attended") return { value: "attended", label: "Atendido", badgeClass: ESTADO_OPTIONS.find(o => o.value === "attended")!.badgeClass };
  if (status === "no_show") return { value: "no_show", label: "No asistió", badgeClass: ESTADO_OPTIONS.find(o => o.value === "no_show")!.badgeClass };
  if (isOverbooking) return { value: "sobre_turno", label: "Sobre turno", badgeClass: ESTADO_OPTIONS.find(o => o.value === "sobre_turno")!.badgeClass };
  return { value: "scheduled", label: "En espera", badgeClass: ESTADO_OPTIONS.find(o => o.value === "scheduled")!.badgeClass };
}

/** Badge de estado en la lista de turnos: mismos colores que el select de Editar */
function StatusBadge({ status, isOverbooking }: { status: string; isOverbooking?: boolean }) {
  const { label, badgeClass } = getEstadoDisplay(status, isOverbooking);
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>{label}</span>;
}

type AppointmentRow = Awaited<ReturnType<typeof getAppointments>>[0];

/** Formatea un Date a YYYY-MM-DD (primer día del mes para navegación) */
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toMonthStart(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export default function AgendaPage() {
  const {
    date,
    view,
    dateFrom,
    dateTo,
    monthStart,
    monthEnd,
    doctorId,
    consultingRoomId,
    appointmentTypeId,
    status,
    appointments,
    doctors,
    consultingRooms,
    appointmentTypes,
    specialties,
    slotsForDay,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams, setSearchParams] = useSearchParams();
  const fetcher = useFetcher<{ success?: boolean; error?: string; updated?: boolean; deleted?: boolean }>();
  const revalidator = useRevalidator();
  const today = getTodayLocalISO();
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 90);
  const maxDateStr = maxDate.toISOString().slice(0, 10);
  const [assignSlot, setAssignSlot] = React.useState<string | null>(null);
  const [agendarOpen, setAgendarOpen] = React.useState(false);
  const [agendarDoctorId, setAgendarDoctorId] = React.useState(doctorId || "");
  const [agendarDate, setAgendarDate] = React.useState(today);
  const [agendarSlots, setAgendarSlots] = React.useState<string[]>([]);
  const [agendarTime, setAgendarTime] = React.useState("");
  const [agendarPatientSearch, setAgendarPatientSearch] = React.useState("");
  const [agendarPatientResults, setAgendarPatientResults] = React.useState<Array<{ id: string; label: string; documentNumber?: string }>>([]);
  const [agendarSelectedPatient, setAgendarSelectedPatient] = React.useState<{ id: string; label: string } | null>(null);
  const [patientSearch, setPatientSearch] = React.useState("");
  const [patientResults, setPatientResults] = React.useState<Array<{ id: string; label: string; documentNumber?: string }>>([]);
  const [selectedPatient, setSelectedPatient] = React.useState<{ id: string; label: string } | null>(null);
  const [editAppointment, setEditAppointment] = React.useState<{ id: string; status: string; isOverbooking: boolean } | null>(null);
  const [editEstado, setEditEstado] = React.useState<string>("scheduled");
  const [createPatientOpen, setCreatePatientOpen] = React.useState(false);
  const [createPatientContext, setCreatePatientContext] = React.useState<"agendar" | "assign" | null>(null);
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const createPatientFetcher = useFetcher<typeof action>();

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const params = new URLSearchParams();
    const v = (fd.get("view") as string) || view;
    params.set("view", v);
    if (v === "lista") {
      const from = fd.get("dateFrom") as string;
      const to = fd.get("dateTo") as string;
      if (from) params.set("dateFrom", from);
      if (to) params.set("dateTo", to);
    } else {
      const d = fd.get("date") as string;
      if (d) params.set("date", d);
    }
    const doc = fd.get("doctorId") as string;
    const room = fd.get("consultingRoomId") as string;
    const typeId = fd.get("appointmentTypeId") as string;
    const st = fd.get("status") as string;
    if (doc) params.set("doctorId", doc);
    if (room) params.set("consultingRoomId", room);
    if (typeId) params.set("appointmentTypeId", typeId);
    if (st) params.set("status", st);
    setSearchParams(params, { replace: true });
  };

  const appointmentsByTime = React.useMemo(() => {
    const map = new Map<string, (typeof appointments)[0][]>();
    for (const row of appointments) {
      const key = normTime(row.appointment.appointmentTime);
      const arr = map.get(key) || [];
      arr.push(row);
      map.set(key, arr);
    }
    return map;
  }, [appointments]);

  const appointmentsByDate = React.useMemo(() => {
    const map = new Map<string, (typeof appointments)[0][]>();
    for (const row of appointments) {
      const d = row.appointment.appointmentDate;
      const arr = map.get(d) || [];
      arr.push(row);
      map.set(d, arr);
    }
    return map;
  }, [appointments]);

  // En lista mostramos solo el día seleccionado en el calendario (date), no todo el mes
  const listAppointments = React.useMemo(() => {
    if (view !== "lista") return appointments;
    return appointments.filter((row) => row.appointment.appointmentDate === date);
  }, [view, appointments, date]);

  // Para vista lista: agrupar turnos del día por hora (igual que vista día)
  const listAppointmentsByTime = React.useMemo(() => {
    const map = new Map<string, (typeof listAppointments)[0][]>();
    for (const row of listAppointments) {
      const key = normTime(row.appointment.appointmentTime);
      const arr = map.get(key) || [];
      arr.push(row);
      map.set(key, arr);
    }
    return map;
  }, [listAppointments]);

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
    if (editAppointment) {
      setEditEstado(
        editAppointment.status === "cancelled"
          ? "cancelled"
          : editAppointment.status === "attended"
            ? "attended"
            : editAppointment.status === "no_show"
              ? "no_show"
              : editAppointment.isOverbooking
                ? "sobre_turno"
                : "scheduled"
      );
    }
  }, [editAppointment]);

  const createPatientHandledRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (createPatientFetcher.state !== "idle" || !createPatientFetcher.data || !createPatientContext) return;
    const key = `${createPatientFetcher.state}-${JSON.stringify(createPatientFetcher.data)}-${createPatientContext}`;
    if (createPatientHandledRef.current === key) return;
    createPatientHandledRef.current = key;
    const d = createPatientFetcher.data as { success?: boolean; patientId?: string; patientLabel?: string; error?: string };
    if (d.success && d.patientId && d.patientLabel) {
      toast.success("Paciente creado");
      if (createPatientContext === "agendar") {
        setAgendarSelectedPatient({ id: d.patientId, label: d.patientLabel });
      } else if (createPatientContext === "assign") {
        setSelectedPatient({ id: d.patientId, label: d.patientLabel });
      }
      setCreatePatientOpen(false);
      setCreatePatientContext(null);
    } else if (d.success === false && d.patientId && d.patientLabel) {
      toast.info("Paciente ya existía. Se asignó a la búsqueda.");
      if (createPatientContext === "agendar") {
        setAgendarSelectedPatient({ id: d.patientId, label: d.patientLabel });
      } else if (createPatientContext === "assign") {
        setSelectedPatient({ id: d.patientId, label: d.patientLabel });
      }
      setCreatePatientOpen(false);
      setCreatePatientContext(null);
    } else if (d.success === false && d.error) {
      toast.error(d.error);
    }
  }, [createPatientFetcher.state, createPatientFetcher.data, createPatientContext]);

  const fetcherHandledRef = React.useRef<string | null>(null);
  const fetcherCounterRef = React.useRef(0);
  React.useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    fetcherCounterRef.current += 1;
    const key = `${fetcher.state}-${JSON.stringify(fetcher.data)}-${fetcherCounterRef.current}`;
    if (fetcherHandledRef.current === key) return;
    fetcherHandledRef.current = key;
    if (fetcher.data.success) {
      if ((fetcher.data as { deleted?: boolean }).deleted) {
        toast.success("Turno eliminado");
        setAssignSlot(null);
      } else if ((fetcher.data as { updated?: boolean }).updated) {
        toast.success("Turno actualizado");
        setEditAppointment(null);
      } else {
        toast.success("Turno creado correctamente");
        setAssignSlot(null);
        setAgendarOpen(false);
        setSelectedPatient(null);
        setPatientSearch("");
        setPatientResults([]);
        setAgendarSelectedPatient(null);
        setAgendarPatientSearch("");
        setAgendarPatientResults([]);
        setAgendarTime("");
      }
      revalidator.revalidate();
    } else if (fetcher.data.success === false && fetcher.data.error) {
      toast.error(fetcher.data.error);
    }
  }, [fetcher.state, fetcher.data, revalidator]);

  React.useEffect(() => {
    if (!agendarOpen || !agendarDoctorId || !agendarDate) {
      setAgendarSlots([]);
      setAgendarTime("");
      return;
    }
    fetch(`/api/doctors/${agendarDoctorId}/slots?date=${agendarDate}`)
      .then((r) => r.json())
      .then((data: { slots?: string[] }) => {
        setAgendarSlots(data.slots || []);
        setAgendarTime((prev) => (data.slots?.includes(prev) ? prev : data.slots?.[0] || ""));
      })
      .catch(() => setAgendarSlots([]));
  }, [agendarOpen, agendarDoctorId, agendarDate]);

  React.useEffect(() => {
    if (!agendarPatientSearch.trim() || agendarPatientSearch.length < 2) {
      setAgendarPatientResults([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/patients/search?q=${encodeURIComponent(agendarPatientSearch)}&filter=all`)
        .then((r) => r.json())
        .then((data: { patients: Array<{ id: string; label: string; documentNumber?: string }> }) => {
          setAgendarPatientResults(data.patients || []);
        })
        .catch(() => setAgendarPatientResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [agendarPatientSearch]);

  const assignOpen = assignSlot !== null;
  const CreatePatientForm = createPatientFetcher.Form;

  const setView = (v: "dia" | "lista") => {
    const p = new URLSearchParams(searchParams);
    p.set("view", v);
    setSearchParams(p, { replace: true });
  };
  const goToDay = (d: string) => {
    const p = new URLSearchParams(searchParams);
    p.set("date", d);
    p.set("view", "dia");
    setSearchParams(p, { replace: true });
  };

  return (
    <div className="p-4 md:p-6 min-h-0 flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarIcon className="h-7 w-7" />
            Agenda de Turnos
          </h1>
          <p className="text-muted-foreground mt-1">
            Vea todos los turnos por día o lista. Agende hasta varias semanas adelante.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={PATHS.agendaCrear}>
              <CalendarIcon className="h-4 w-4 mr-1" />
              Crear Agenda Propia
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={doctorId ? `${PATHS.agendaEditar}?doctorId=${doctorId}` : PATHS.agendaEditar}>
              <Settings className="h-4 w-4 mr-1" />
              Editar agenda
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={PATHS.agendaEditarBloques}>
              <Pencil className="h-4 w-4 mr-1" />
              Editar bloques
            </Link>
          </Button>
          <Button size="sm" className="gap-1" onClick={() => {
            setAgendarDoctorId(doctorId || doctors[0]?.id || "");
            setAgendarDate(today);
            setAgendarTime("");
            setAgendarOpen(true);
          }}>
            <Plus className="h-4 w-4" />
            Agendar turno
          </Button>
        </div>
      </div>

      {view === "lista" ? (
        <div className="flex flex-1 gap-6 min-h-0">
          {/* Panel izquierdo: Turno Fuera de Agenda, vista Día/Lista, fecha, calendario, filtros */}
          <aside className="w-72 shrink-0 flex flex-col gap-4">
            <Button asChild className="w-full gap-2 bg-primary/90 hover:bg-primary">
              <Link to={PATHS.atenderSinTurno}>
                <Plus className="h-4 w-4" />
                Turno Fuera de Agenda
              </Link>
            </Button>
            <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
              <button
                type="button"
                onClick={() => { const p = new URLSearchParams(searchParams); p.set("view", "dia"); p.set("date", dateFrom || getTodayLocalISO()); setSearchParams(p, { replace: true }); }}
                className={`flex-1 text-sm font-medium px-2 py-1.5 rounded ${(view as "dia" | "lista") === "dia" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Día
              </button>
              <button
                type="button"
                onClick={() => { const p = new URLSearchParams(searchParams); p.set("view", "lista"); setSearchParams(p, { replace: true }); }}
                className={`flex-1 text-sm font-medium px-2 py-1.5 rounded ${(view as "dia" | "lista") === "lista" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Lista
              </button>
            </div>
            <Card>
              <CardContent className="pt-4">
                <form onSubmit={handleFilter} className="space-y-4">
                  <input type="hidden" name="view" value="lista" />
                  <input type="hidden" name="dateFrom" value={monthStart} />
                  <input type="hidden" name="dateTo" value={monthEnd} />
                  <div className="pt-2">
                    <Calendar
                      mode="single"
                      selected={new Date(date + "T12:00:00")}
                      onSelect={(selected) => {
                        if (!selected) return;
                        const d = toISODate(selected);
                        const p = new URLSearchParams(searchParams);
                        p.set("date", d);
                        p.set("view", "lista");
                        p.set("dateFrom", d);
                        p.set("dateTo", d);
                        setSearchParams(p, { replace: true });
                      }}
                      month={new Date(monthStart + "T12:00:00")}
                      onMonthChange={(month) => {
                        const p = new URLSearchParams(searchParams);
                        const start = toMonthStart(month);
                        // Mantener el mismo día del mes si existe (ej. 25 → 25 del nuevo mes), sino día 1
                        const prevDay = new Date(date + "T12:00:00").getDate();
                        const lastDayNew = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
                        const day = Math.min(prevDay, lastDayNew);
                        const newDate = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        p.set("date", newDate);
                        if (view === "lista") {
                          p.set("dateFrom", newDate);
                          p.set("dateTo", newDate);
                        }
                        setSearchParams(p, { replace: true });
                      }}
                      weekStartsOn={1}
                      components={{
                        DayButton: (props: DayButtonProps) => {
                          const dateStr = toISODate(props.day.date);
                          const count = appointmentsByDate.get(dateStr)?.length ?? 0;
                          return (
                            <button
                              type="button"
                              {...props}
                              className={cn("w-full min-h-12 flex flex-col items-center justify-center gap-0 rounded-md overflow-hidden", props.className)}
                            >
                              <span>{props.day.date.getDate()}</span>
                              {count > 0 && (
                                <span className="text-[10px] font-medium text-primary leading-tight truncate max-w-full">
                                  {count} t.
                                </span>
                              )}
                            </button>
                          );
                        },
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doctorId">Médico</Label>
                    <select
                      id="doctorId"
                      name="doctorId"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      defaultValue={doctorId}
                    >
                      <option value="">Buscar por medico...</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Especialidad</Label>
                    <select
                      id="specialty"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      onChange={(e) => {
                        const s = e.target.value;
                        const sel = document.getElementById("doctorId") as HTMLSelectElement;
                        if (!sel) return;
                        if (!s) { sel.value = ""; return; }
                        const doc = doctors.find((d) => d.specialty === s);
                        if (doc) sel.value = doc.id;
                      }}
                    >
                      <option value="">Buscar por especialidad...</option>
                      {specialties.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appointmentTypeId">Tipo de turno</Label>
                    <select
                      id="appointmentTypeId"
                      name="appointmentTypeId"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      defaultValue={appointmentTypeId}
                    >
                      <option value="">Buscar por tipo de turno...</option>
                      {appointmentTypes.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado</Label>
                    <select
                      id="status"
                      name="status"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      defaultValue={status}
                    >
                      <option value="">Buscar por estado de turno...</option>
                      <option value="scheduled">Programado</option>
                      <option value="attended">Atendido</option>
                      <option value="cancelled">Cancelado</option>
                      <option value="no_show">No asistió</option>
                    </select>
                  </div>
                  <Button type="submit" size="sm" className="w-full">Ver</Button>
                </form>
              </CardContent>
            </Card>
          </aside>
          {/* Panel derecho: rango horario del médico (como vista día) para cargar turnos fácil */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="mb-2">
              <h2 className="text-lg font-semibold text-foreground">Agenda de Turnos</h2>
              <p className="text-muted-foreground text-sm">
                {formatDate(date, "es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} — Total {listAppointments.length} turno{listAppointments.length !== 1 ? "s" : ""}.
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                Se muestra el rango horario en que trabaja el médico (desde Crear Agenda Propia o horario semanal). Clic en <strong>Agendar</strong> para cargar un turno en ese horario.
              </p>
            </div>
            <Card className="flex-1 min-w-0 flex flex-col">
              <CardContent className="pt-4">
                {doctorId && slotsForDay.length === 0 ? (
                  <p className="text-muted-foreground py-4">
                    Este médico no tiene horario definido para este día. Use <strong>Crear Agenda Propia</strong> para generar disponibilidad o configure el horario semanal del médico.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(slotsForDay.length > 0 ? slotsForDay : DEFAULT_SLOTS).map((slotTime) => {
                      const rows = listAppointmentsByTime.get(slotTime) || [];
                      return (
                        <div
                          key={slotTime}
                          className="flex items-center gap-4 py-2 px-3 rounded-lg border border-border/50 hover:bg-muted/30"
                        >
                          <div className="w-16 shrink-0 font-medium text-muted-foreground">{slotTime}</div>
                          <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
                            {rows.map((row) => (
                              <div key={row.appointment.id} className="flex items-center gap-2 flex-wrap">
                                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="font-medium">
                                  {row.patient ? capitalizeWords(`${row.patient.firstName} ${row.patient.lastName}`) : "—"}
                                </span>
                                <StatusBadge status={row.appointment.status} isOverbooking={row.appointment.isOverbooking} />
                                <Button type="button" variant="ghost" size="sm" className="h-8 gap-1" onClick={() => setEditAppointment({ id: row.appointment.id, status: row.appointment.status, isOverbooking: row.appointment.isOverbooking })}>
                                  <Pencil className="h-3.5 w-3.5" />
                                  Editar
                                </Button>
                                <fetcher.Form method="post" className="inline">
                                  <input type="hidden" name="_intent" value={INTENT_DELETE} />
                                  <input type="hidden" name="appointmentId" value={row.appointment.id} />
                                  <Button type="submit" variant="ghost" size="sm" className="h-8 gap-1 text-destructive hover:text-destructive" disabled={fetcher.state !== "idle"}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Eliminar
                                  </Button>
                                </fetcher.Form>
                                <Button type="button" variant="ghost" size="sm" className="h-8 gap-1" onClick={() => { setAgendarDoctorId(row.doctor?.id || ""); setAgendarDate(row.appointment.appointmentDate); setAgendarTime(slotTime); setAgendarOpen(true); }}>
                                  <CalendarPlus className="h-3.5 w-3.5" />
                                  Agendar
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1 h-9"
                              onClick={() => setAssignSlot(slotTime)}
                            >
                              <CalendarPlus className="h-4 w-4" />
                              Agendar
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 w-72 flex flex-col gap-4">
            <Button asChild className="w-full gap-2 bg-primary/90 hover:bg-primary">
              <Link to={PATHS.atenderSinTurno}>
                <Plus className="h-4 w-4" />
                Turno Fuera de Agenda
              </Link>
            </Button>
            <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
              <button
                type="button"
                onClick={() => { const p = new URLSearchParams(searchParams); p.set("view", "dia"); p.set("date", date); setSearchParams(p, { replace: true }); }}
                className={`flex-1 text-sm font-medium px-2 py-1.5 rounded ${(view as "dia" | "lista") === "dia" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Día
              </button>
              <button
                type="button"
                onClick={() => { const p = new URLSearchParams(searchParams); p.set("view", "lista"); setSearchParams(p, { replace: true }); }}
                className={`flex-1 text-sm font-medium px-2 py-1.5 rounded ${(view as "dia" | "lista") === "lista" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Lista
              </button>
            </div>
          </div>
          <Card className="mb-4">
            <CardContent className="py-3 px-4 sm:px-6">
              <form onSubmit={handleFilter} className="flex flex-wrap gap-3 items-center">
                <input type="hidden" name="view" value={view} />
                <span className="text-sm font-medium text-foreground border-r border-border pr-4">Filtros</span>
                {(view as "dia" | "lista") === "dia" && (
                  <div className="flex flex-col gap-1 min-w-[110px]">
                    <Label htmlFor="date" className="text-xs">Fecha</Label>
                    <Input id="date" name="date" type="date" required defaultValue={date} className="h-8 w-full text-sm" />
                  </div>
                )}
                {(view as "dia" | "lista") === "lista" && (
                  <>
                    <div className="flex flex-col gap-1 min-w-[110px]"><Label htmlFor="dateFrom" className="text-xs">Desde</Label><Input id="dateFrom" name="dateFrom" type="date" defaultValue={dateFrom} className="h-8 w-full text-sm" /></div>
                    <div className="flex flex-col gap-1 min-w-[110px]"><Label htmlFor="dateTo" className="text-xs">Hasta</Label><Input id="dateTo" name="dateTo" type="date" defaultValue={dateTo} className="h-8 w-full text-sm" /></div>
                  </>
                )}
                <div className="flex flex-col gap-1 min-w-[140px]">
                  <Label htmlFor="doctorId" className="text-xs">Médico</Label>
                  <select id="doctorId" name="doctorId" className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm" defaultValue={doctorId}>
                    <option value="">Todos</option>
                    {doctors.map((d) => (<option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 min-w-[120px]">
                  <Label htmlFor="consultingRoomId" className="text-xs">Consultorio</Label>
                  <select id="consultingRoomId" name="consultingRoomId" className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm" defaultValue={consultingRoomId}>
                    <option value="">Todos</option>
                    {consultingRooms.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                  </select>
                </div>
                <Button type="submit" size="sm" className="h-8">Ver</Button>
              </form>
            </CardContent>
          </Card>

      {view === "dia" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {formatDate(date, "es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Se muestra el rango horario en que trabaja el médico (desde Crear Agenda Propia o horario semanal). Clic en &quot;Asignar&quot; para cargar un turno en ese horario.
            </p>
          </CardHeader>
          <CardContent>
            {doctorId && slotsForDay.length === 0 ? (
              <p className="text-muted-foreground py-4">
                Este médico no tiene horario definido para este día. Use <strong>Crear Agenda Propia</strong> para generar disponibilidad o configure el horario semanal del médico.
              </p>
            ) : (
            <div className="space-y-2">
              {(slotsForDay.length > 0 ? slotsForDay : DEFAULT_SLOTS).map((slotTime) => {
                const rows = appointmentsByTime.get(slotTime) || [];
                return (
                  <div
                    key={slotTime}
                    className="flex items-center gap-4 py-2 px-3 rounded-lg border border-border/50 hover:bg-muted/30"
                  >
                    <div className="w-16 shrink-0 font-medium text-muted-foreground">{slotTime}</div>
                    <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
                      {rows.map((row) => (
                        <div key={row.appointment.id} className="flex items-center gap-2 flex-wrap">
                          <User className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium">
                            {row.patient ? capitalizeWords(`${row.patient.firstName} ${row.patient.lastName}`) : "—"}
                          </span>
                          <StatusBadge status={row.appointment.status} isOverbooking={row.appointment.isOverbooking} />
                          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1" onClick={() => setEditAppointment({ id: row.appointment.id, status: row.appointment.status, isOverbooking: row.appointment.isOverbooking })}>
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </Button>
                          <fetcher.Form method="post" className="inline">
                            <input type="hidden" name="_intent" value={INTENT_DELETE} />
                            <input type="hidden" name="appointmentId" value={row.appointment.id} />
                            <Button type="submit" variant="ghost" size="sm" className="h-8 gap-1 text-destructive hover:text-destructive" disabled={fetcher.state !== "idle"}>
                              <Trash2 className="h-3.5 w-3.5" />
                              Eliminar
                            </Button>
                          </fetcher.Form>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1 h-9"
                        onClick={() => setAssignSlot(slotTime)}
                      >
                        <CalendarPlus className="h-4 w-4" />
                        Agendar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </CardContent>
        </Card>
      )}

        </>
      )}

      <ResponsiveDialog
        open={agendarOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAgendarOpen(false);
            setAgendarSelectedPatient(null);
            setAgendarPatientSearch("");
            setAgendarPatientResults([]);
          }
        }}
        title="Agendar turno"
        description="Elija médico, fecha (hasta 3 meses) y horario. Puede agendar varios turnos en el mismo horario."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Médico *</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={agendarDoctorId}
              onChange={(e) => setAgendarDoctorId(e.target.value)}
            >
              <option value="">Seleccionar médico</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Fecha *</Label>
            <Input
              type="date"
              min={today}
              max={maxDateStr}
              value={agendarDate}
              onChange={(e) => setAgendarDate(e.target.value)}
              className="h-9 w-full"
            />
          </div>
          <div className="space-y-2">
            <Label>Hora *</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={agendarTime}
              onChange={(e) => setAgendarTime(e.target.value)}
            >
              <option value="">Seleccionar hora</option>
              {agendarSlots.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {agendarDoctorId && agendarDate && agendarSlots.length === 0 && (
              <p className="text-xs text-muted-foreground">Sin horarios para ese día. Configure la agenda del médico en Editar agenda.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Paciente *</Label>
            <Input
              type="text"
              placeholder="Buscar por nombre, DNI..."
              value={agendarPatientSearch}
              onChange={(e) => setAgendarPatientSearch(e.target.value)}
              className="h-9"
            />
            {agendarPatientResults.length > 0 && (
              <ul className="border rounded-md divide-y max-h-40 overflow-y-auto">
                {agendarPatientResults.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm flex justify-between items-center"
                      onClick={() => {
                        setAgendarSelectedPatient({ id: p.id, label: p.label });
                        setAgendarPatientResults([]);
                      }}
                    >
                      <span>{p.label}</span>
                      {p.documentNumber && <span className="text-muted-foreground text-xs">DNI {p.documentNumber}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {agendarSelectedPatient && (
              <p className="text-sm text-muted-foreground">Seleccionado: <strong>{agendarSelectedPatient.label}</strong></p>
            )}
            <p className="text-xs text-muted-foreground">
              ¿El paciente no existe?{" "}
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-primary underline hover:no-underline"
                onClick={() => {
                  setCreatePatientContext("agendar");
                  setCreatePatientOpen(true);
                }}
              >
                Crear nuevo paciente
              </Button>
            </p>
          </div>
          <fetcher.Form method="post" className="space-y-2">
            <input type="hidden" name="_intent" value={INTENT_CREATE} />
            <input type="hidden" name="appointmentDate" value={agendarDate} />
            <input type="hidden" name="appointmentTime" value={agendarTime} />
            <input type="hidden" name="patientId" value={agendarSelectedPatient?.id ?? ""} />
            <input type="hidden" name="doctorId" value={agendarDoctorId} />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="sobreTurno" value="1" className="rounded border-input" />
              <span className="text-sm">Sobre turno</span>
            </label>
            <div className="space-y-2">
              <Label>Tipo de turno</Label>
              <select name="appointmentTypeId" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="">—</option>
                {appointmentTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setAgendarOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={!agendarDoctorId || !agendarDate || !agendarTime || !agendarSelectedPatient?.id || fetcher.state !== "idle"}>
                {fetcher.state !== "idle" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creando...</> : "Crear turno"}
              </Button>
            </div>
          </fetcher.Form>
        </div>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={!!editAppointment}
        onOpenChange={(open) => { if (!open) setEditAppointment(null); }}
        title="Editar"
        description="Cambie el estado del turno."
      >
        {editAppointment && (
          <fetcher.Form method="post" className="space-y-4">
            <input type="hidden" name="_intent" value={INTENT_UPDATE} />
            <input type="hidden" name="appointmentId" value={editAppointment.id} />
            <div className="space-y-2">
              <Label>Estado</Label>
              <select
                name="estado"
                value={editEstado}
                onChange={(e) => setEditEstado(e.target.value)}
                className={cn(
                  "flex h-10 w-full rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                  ESTADO_OPTIONS.find((o) => o.value === editEstado)?.selectClass ?? "border-input bg-transparent"
                )}
              >
                {ESTADO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setEditAppointment(null)}>Cancelar</Button>
              <Button type="submit" disabled={fetcher.state !== "idle"}>
                {fetcher.state !== "idle" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando...</> : "Guardar"}
              </Button>
            </div>
          </fetcher.Form>
        )}
      </ResponsiveDialog>

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
              <p className="text-xs text-muted-foreground">
                ¿El paciente no existe?{" "}
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-primary underline hover:no-underline"
                  onClick={() => {
                    setCreatePatientContext("assign");
                    setCreatePatientOpen(true);
                  }}
                >
                  Crear nuevo paciente
                </Button>
              </p>
            </div>

            <fetcher.Form method="post" className="space-y-4">
              <input type="hidden" name="_intent" value={INTENT_CREATE} />
              <input type="hidden" name="appointmentDate" value={date} />
              <input type="hidden" name="appointmentTime" value={assignSlot} />
              <input type="hidden" name="patientId" value={selectedPatient?.id ?? ""} />
              {doctorId && <input type="hidden" name="doctorId" value={doctorId} />}
              {consultingRoomId && <input type="hidden" name="consultingRoomId" value={consultingRoomId} />}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="sobreTurno" value="1" className="rounded border-input" />
                <span className="text-sm">Sobre turno</span>
              </label>
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

      <ResponsiveDialog
        open={createPatientOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreatePatientOpen(false);
            setCreatePatientContext(null);
          }
        }}
        title="Crear paciente"
        description="Complete los datos del nuevo paciente. Se asignará al turno al guardar."
      >
        <CreatePatientForm method="post" className="space-y-4">
          <input type="hidden" name="_intent" value={INTENT_CREATE_PATIENT} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cp-firstName">Nombre *</Label>
              <Input id="cp-firstName" name="firstName" required placeholder="Nombre" className="h-9" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp-lastName">Apellido *</Label>
              <Input id="cp-lastName" name="lastName" required placeholder="Apellido" className="h-9" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cp-documentType">Tipo documento</Label>
              <select
                id="cp-documentType"
                name="documentType"
                defaultValue="DNI"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="DNI">DNI</option>
                <option value="LC">LC</option>
                <option value="LE">LE</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp-documentNumber">Número documento *</Label>
              <Input id="cp-documentNumber" name="documentNumber" required placeholder="12345678" className="h-9" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp-birthDate">Fecha de nacimiento</Label>
            <Input id="cp-birthDate" name="birthDate" type="date" className="h-9" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp-insuranceCompany">Obra social</Label>
            <Input id="cp-insuranceCompany" name="insuranceCompany" placeholder="Opcional" className="h-9" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp-insuranceNumber">Número de afiliado</Label>
            <Input id="cp-insuranceNumber" name="insuranceNumber" placeholder="Opcional" className="h-9" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp-phone">Teléfono</Label>
            <Input id="cp-phone" name="phone" type="tel" placeholder="Opcional" className="h-9" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp-email">Email</Label>
            <Input id="cp-email" name="email" type="email" placeholder="Opcional" className="h-9" />
          </div>
          {createPatientFetcher.data && (createPatientFetcher.data as { success?: boolean }).success === false && (createPatientFetcher.data as { error?: string }).error && (
            <p className="text-sm text-destructive">{(createPatientFetcher.data as { error: string }).error}</p>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => { setCreatePatientOpen(false); setCreatePatientContext(null); }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createPatientFetcher.state !== "idle"}>
              {createPatientFetcher.state !== "idle" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creando...</> : "Crear paciente"}
            </Button>
          </div>
        </CreatePatientForm>
      </ResponsiveDialog>
    </div>
  );
}
