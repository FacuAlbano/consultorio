import { useLoaderData, useSearchParams } from "react-router";
import type { Route } from "./+types/dashboard.pool-atencion";
import { requireAuth } from "~/lib/middleware";
import { getUserInfo } from "~/lib/user-info";
import { getAppointments } from "~/lib/appointments.server";
import { getAllDoctors } from "~/lib/doctors.server";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { PatientSearchInput } from "~/components/patient-search/patient-search-input";
import { Calendar, Clock, User, Stethoscope, Search, Filter } from "lucide-react";
import { useState } from "react";

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

  return {
    userInfo,
    appointments: appointmentsData,
    doctors,
    filters: {
      date,
      doctorId: doctorId || null,
    },
  };
}

export default function PoolAtencion() {
  const { appointments, doctors, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(filters.date);
  const [selectedDoctorId, setSelectedDoctorId] = useState(filters.doctorId || "");

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

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      scheduled: { label: "Programado", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      attended: { label: "Atendido", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      cancelled: { label: "Cancelado", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
      no_show: { label: "No asistió", className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
    };

    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

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

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Fecha
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Médico
              </label>
              <select
                value={selectedDoctorId}
                onChange={handleDoctorChange}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                Limpiar filtros
              </Button>
            </div>
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
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Hora Recepción</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Sobre Turno</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Médico/Práctica</th>
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
                        {formatTime(item.appointment.receptionTime)}
                      </td>
                      <td className="p-3">
                        {item.appointment.isOverbooking ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                            Sí
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {item.doctor ? (
                          <div>
                            <div className="font-medium">
                              {item.doctor.firstName} {item.doctor.lastName}
                            </div>
                            {item.doctor.practice && (
                              <div className="text-sm text-muted-foreground">
                                {item.doctor.practice}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
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
                          {item.patient?.firstName} {item.patient?.lastName}
                        </div>
                      </td>
                      <td className="p-3">
                        {getStatusBadge(item.appointment.status)}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          {item.appointment.status === "scheduled" && (
                            <Button
                              size="sm"
                              variant="default"
                              className="text-xs"
                            >
                              Atender
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            Ver
                          </Button>
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
