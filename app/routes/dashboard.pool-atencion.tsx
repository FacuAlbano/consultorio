import { useLoaderData, useSearchParams, Form, Link, redirect, useActionData } from "react-router";
import type { Route } from "./+types/dashboard.pool-atencion";
import { requireAuth } from "~/lib/middleware";
import { getUserInfo } from "~/lib/user-info";
import { getAppointments, markAppointmentAsAttended, updateAppointment } from "~/lib/appointments.server";
import { getAllDoctors } from "~/lib/doctors.server";
import { getConsultationIdsByAppointmentIds, getLatestConsultationIdByPatientIds } from "~/lib/medical-records.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { PatientSearchInput } from "~/components/patient-search/patient-search-input";
import { Calendar, Clock, User, Stethoscope, Search, Filter, FileText, Plus, FolderOpen } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { PATHS } from "~/lib/constants";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export async function loader({ request }: Route.LoaderArgs) {
  const { tokenType } = await requireAuth(request);
  const userInfo = getUserInfo(tokenType);

  const url = new URL(request.url);
  const today = new Date();
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const date = url.searchParams.get("date") || localDate;
  const doctorId = url.searchParams.get("doctorId") || undefined;

  // Obtener turnos del día
  const appointmentsData = await getAppointments({
    date,
    doctorId,
    limit: 200,
  });

  // Obtener lista de médicos para el filtro
  const doctors = await getAllDoctors({ limit: 100 });

  // Para cada turno: consulta vinculada al turno, o última consulta del paciente (para abrir algo al toque)
  const appointmentIds = appointmentsData.map((a) => a.appointment.id);
  const consultationIdsByAppointmentId = await getConsultationIdsByAppointmentIds(appointmentIds);
  const patientIds = [...new Set(appointmentsData.map((a) => a.patient?.id).filter(Boolean) as string[])];
  const latestConsultationIdByPatientId = await getLatestConsultationIdByPatientIds(patientIds);

  return {
    userInfo,
    appointments: appointmentsData,
    doctors,
    consultationIdsByAppointmentId,
    latestConsultationIdByPatientId,
    filters: {
      date,
      doctorId: doctorId || null,
    },
  };
}

/** Valores que puede enviar el select de estado (igual que en Agenda) */
const ESTADO_VALUES = ["scheduled", "en_lista", "attended", "cancelled", "no_show", "sobre_turno"] as const;

/** Mismos colores y estilos que calendario (agenda): badgeClass + borde = selectClass de agenda */
const ESTADO_OPTIONS = [
  { value: "scheduled", label: "En espera", pillClass: "bg-sky-500/20 border-sky-500/50 text-sky-800 dark:text-sky-200" },
  { value: "en_lista", label: "En lista", pillClass: "bg-yellow-500/20 border-yellow-500/50 text-yellow-800 dark:text-yellow-200" },
  { value: "attended", label: "Atendido", pillClass: "bg-green-600/20 border-green-600/50 text-green-800 dark:text-green-200" },
  { value: "cancelled", label: "Cancelado", pillClass: "bg-red-600/20 border-red-600/50 text-red-800 dark:text-red-200" },
  { value: "no_show", label: "No asistió", pillClass: "bg-rose-200 text-rose-900 border-rose-400 dark:bg-rose-900/60 dark:text-rose-100 dark:border-rose-700" },
  { value: "sobre_turno", label: "Sobre turno", pillClass: "bg-amber-500/20 border-amber-500/50 text-amber-800 dark:text-amber-200" },
] as const;

/** Valor a mostrar en el select según status + isOverbooking (misma lógica que Agenda getEstadoDisplay) */
function getEstadoSelectValue(status: string, isOverbooking?: boolean): string {
  if (status === "cancelled") return "cancelled";
  if (status === "attended") return "attended";
  if (status === "no_show") return "no_show";
  if (status === "en_lista") return "en_lista";
  if (status === "scheduled" && isOverbooking) return "sobre_turno";
  return "scheduled";
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const formData = await request.formData();
  const intent = formData.get("_intent");

  if (intent === "updateStatus") {
    const appointmentId = formData.get("appointmentId") as string;
    const estado = (formData.get("status") as string) || "";
    if (!appointmentId || !ESTADO_VALUES.includes(estado as (typeof ESTADO_VALUES)[number])) {
      return { success: false, error: "Datos inválidos" };
    }
    const updateData: { status: string; isOverbooking?: boolean } =
      estado === "sobre_turno"
        ? { status: "scheduled", isOverbooking: true }
        : { status: estado, isOverbooking: false };
    const result = await updateAppointment(appointmentId, updateData);
    if (!result.success) return result;
    return { success: true, statusUpdated: true };
  }

  if (intent !== "atender") return null;
  const appointmentId = formData.get("appointmentId") as string;
  const patientId = formData.get("patientId") as string;
  if (!appointmentId || !patientId) return { success: false, error: "Datos incompletos" };
  const result = await markAppointmentAsAttended(appointmentId);
  if (!result.success) return result;

  const url = new URL(request.url);
  const today = new Date();
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const poolDate = url.searchParams.get("date") || localDate;
  const poolDoctorId = url.searchParams.get("doctorId") || "";
  const returnParams = new URLSearchParams({
    returnTo: "pool",
    returnDate: poolDate,
  });
  if (poolDoctorId) returnParams.set("returnDoctorId", poolDoctorId);

  throw redirect(`${PATHS.historiaClinicaConsulta(patientId, "nueva")}?date=${encodeURIComponent(poolDate)}&appointmentId=${encodeURIComponent(appointmentId)}&${returnParams.toString()}`);
}

export default function PoolAtencion() {
  const { appointments, doctors, consultationIdsByAppointmentId, latestConsultationIdByPatientId, filters } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (actionData && "error" in actionData && actionData.success === false && actionData.error) {
      toast.error(actionData.error);
    }
    if (actionData && "statusUpdated" in actionData && actionData.success === true && actionData.statusUpdated) {
      toast.success("Estado actualizado");
    }
  }, [actionData]);
  const [selectedDate, setSelectedDate] = useState(filters.date);
  const [selectedDoctorId, setSelectedDoctorId] = useState(filters.doctorId || "");
  const statusFormRefs = useRef<Record<string, HTMLFormElement | null>>({});

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    const params = new URLSearchParams(searchParams);
    params.set("date", newDate);
    setSearchParams(params, { replace: true });
  };

  const handleDoctorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const doctorId = e.target.value;
    setSelectedDoctorId(doctorId);
    const params = new URLSearchParams(searchParams);
    if (doctorId) {
      params.set("doctorId", doctorId);
    } else {
      params.delete("doctorId");
    }
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setSelectedDate(localDate);
    setSelectedDoctorId("");
    setSearchParams({ date: localDate }, { replace: true });
  };

  const formatTime = (time: string | null) => {
    if (!time) return "-";
    return time.substring(0, 5); // HH:MM
  };

  const getStatusPillClass = (status: string) =>
    ESTADO_OPTIONS.find((o) => o.value === status)?.pillClass ?? "bg-muted text-muted-foreground border border-border";

  /** Params para que desde la consulta la flecha "atrás" vuelva al pool con los mismos filtros */
  const poolReturnSearch = `returnTo=pool&returnDate=${encodeURIComponent(filters.date)}${filters.doctorId ? `&returnDoctorId=${encodeURIComponent(filters.doctorId)}` : ""}`;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Stethoscope className="h-8 w-8" />
            Pool de Atención
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestión de turnos y atención del día
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="py-3 px-4 sm:px-6">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm font-medium text-foreground border-r border-border pr-3">Filtros</span>
            <div className="flex flex-col gap-1 min-w-[110px]">
              <label className="text-xs font-medium text-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Fecha
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="w-full h-8 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-xs font-medium text-foreground flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                Médico
              </label>
              <select
                value={selectedDoctorId}
                onChange={handleDoctorChange}
                className="w-full h-8 px-2 py-1 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Todos los médicos</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.firstName} {doctor.lastName}
                    {doctor.practice && ` - ${doctor.practice}`}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              onClick={clearFilters}
              size="sm"
              className="h-8"
            >
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Búsqueda de pacientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Búsqueda rápida de pacientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PatientSearchInput
            placeholder="Buscar paciente para ver sus turnos..."
            showFilters={false}
            showHistory={false}
          />
        </CardContent>
      </Card>

      {/* Tabla de turnos */}
      <Card>
        <CardHeader>
          <CardTitle>
            Turnos del día ({appointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay turnos programados para esta fecha</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Hora Turno</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Obra social</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Nº afiliado</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">HC/Nro. Documento</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Paciente</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Estado</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((item) => (
                    <tr
                      key={item.appointment.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {formatTime(item.appointment.appointmentTime)}
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {item.patient?.insuranceCompany || "-"}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {item.patient?.insuranceNumber || "-"}
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {item.patient?.medicalRecordNumber && (
                            <div>HC: {item.patient.medicalRecordNumber}</div>
                          )}
                          <div className="text-muted-foreground">
                            DNI: {item.patient?.documentNumber || "-"}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">
                          {item.patient ? (
                            <Link
                              to={`${PATHS.patientProfile(item.patient.id)}?date=${encodeURIComponent(item.appointment.appointmentDate)}&appointmentId=${encodeURIComponent(item.appointment.id)}&${poolReturnSearch}`}
                              className="text-primary underline-offset-4 hover:underline"
                            >
                              {item.patient.lastName}, {item.patient.firstName}
                            </Link>
                          ) : (
                            "-"
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <Form
                          method="post"
                          className="inline-block"
                          ref={(el) => {
                            statusFormRefs.current[item.appointment.id] = el;
                          }}
                        >
                          <input type="hidden" name="_intent" value="updateStatus" />
                          <input type="hidden" name="appointmentId" value={item.appointment.id} />
                          <input type="hidden" name="status" id={`status-${item.appointment.id}`} defaultValue={getEstadoSelectValue(item.appointment.status, item.appointment.isOverbooking)} />
                          <Select
                            key={`${item.appointment.id}-${item.appointment.status}-${item.appointment.isOverbooking}`}
                            value={getEstadoSelectValue(item.appointment.status, item.appointment.isOverbooking)}
                            onValueChange={(v) => {
                              const form = statusFormRefs.current[item.appointment.id];
                              const input = form?.querySelector<HTMLInputElement>(`#status-${item.appointment.id}`);
                              if (input && form) {
                                input.value = v;
                                form.requestSubmit();
                              }
                            }}
                          >
                            <SelectTrigger
                              className={cn(
                                "inline-flex w-auto min-w-[86px] rounded-full border px-3 py-1 text-xs font-medium shadow-none",
                                getStatusPillClass(getEstadoSelectValue(item.appointment.status, item.appointment.isOverbooking))
                              )}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ESTADO_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Form>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {(item.appointment.status === "scheduled" || item.appointment.status === "en_lista") && item.patient && (
                            <Form method="post" className="inline-flex">
                              <input type="hidden" name="_intent" value="atender" />
                              <input type="hidden" name="appointmentId" value={item.appointment.id} />
                              <input type="hidden" name="patientId" value={item.patient.id} />
                              <Button type="submit" size="sm" variant="default" className="min-w-[7.25rem] h-8 justify-center gap-1.5 text-xs">
                                <Stethoscope className="h-3.5 w-3.5 shrink-0" />
                                Atender
                              </Button>
                            </Form>
                          )}
                          {item.patient && (
                            <>
                              <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="min-w-[7.25rem] h-8 justify-center gap-1.5 text-xs border-slate-500/50 bg-slate-500/5 hover:bg-slate-500/15 hover:border-slate-500/70"
                                title="Ver listado de consultas del paciente"
                              >
                                <Link to={`${PATHS.historiaClinicaPaciente(item.patient.id)}?${poolReturnSearch}`}>
                                  <FileText className="h-3.5 w-3.5 shrink-0" />
                                  Historia clínica
                                </Link>
                              </Button>
                              <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="min-w-[7.25rem] h-8 justify-center gap-1.5 text-xs border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/15 hover:border-emerald-500/70 text-emerald-700 dark:text-emerald-400"
                                title="Ir a nueva consulta para escribir"
                              >
                                <Link
                                  to={`${PATHS.historiaClinicaConsulta(item.patient.id, "nueva")}?date=${encodeURIComponent(item.appointment.appointmentDate)}&appointmentId=${encodeURIComponent(item.appointment.id)}&${poolReturnSearch}`}
                                >
                                  <Plus className="h-3.5 w-3.5 shrink-0" />
                                  Nueva consulta
                                </Link>
                              </Button>
                              <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="min-w-[7.25rem] h-8 justify-center gap-1.5 text-xs border-blue-500/50 bg-blue-500/5 hover:bg-blue-500/15 hover:border-blue-500/70 text-blue-700 dark:text-blue-400"
                                title="Abrir la consulta del día o la última para ver o editar"
                              >
                                <Link
                                  to={
                                    (() => {
                                      const consultId = consultationIdsByAppointmentId[item.appointment.id] ?? latestConsultationIdByPatientId[item.patient.id];
                                      return consultId
                                        ? `${PATHS.historiaClinicaConsulta(item.patient.id, consultId)}?${poolReturnSearch}`
                                        : `${PATHS.historiaClinicaConsulta(item.patient.id, "nueva")}?date=${encodeURIComponent(item.appointment.appointmentDate)}&appointmentId=${encodeURIComponent(item.appointment.id)}&${poolReturnSearch}`;
                                    })()
                                  }
                                >
                                  <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                                  Abrir consulta
                                </Link>
                              </Button>
                            </>
                          )}
                        </div>
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
