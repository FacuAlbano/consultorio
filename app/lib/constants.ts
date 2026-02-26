/**
 * Rutas de la aplicación
 * Constantes de rutas centralizadas para evitar errores tipográficos y mantener consistencia
 */
export const PATHS = {
  root: "/",
  login: "/login",
  logout: "/logout",
  dashboard: "/dashboard",
  patientProfile: (id: string) => `/dashboard/pacientes/${id}`,
  poolAtencion: "/dashboard/pool-atencion",
  atenderSinTurno: "/dashboard/atender-sin-turno",
  /** Vista agenda: turnos, calendario y agendar */
  agenda: "/dashboard/agenda",
  /** Parámetros de vuelta a la agenda (filtros, fecha, vista) */
  agendaReturnFilters: (
    date: string,
    view?: string,
    filters?: {
      dateFrom?: string;
      dateTo?: string;
      doctorId?: string;
      consultingRoomId?: string;
      appointmentTypeId?: string;
      status?: string;
    }
  ) => {
    const p = new URLSearchParams();
    p.set("date", date);
    if (view) p.set("view", view);
    if (filters) {
      if (filters.dateFrom) p.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) p.set("dateTo", filters.dateTo);
      if (filters.doctorId) p.set("doctorId", filters.doctorId);
      if (filters.consultingRoomId) p.set("consultingRoomId", filters.consultingRoomId);
      if (filters.appointmentTypeId) p.set("appointmentTypeId", filters.appointmentTypeId);
      if (filters.status) p.set("status", filters.status);
    }
    return `/dashboard/agenda?${p.toString()}`;
  },
  /** @deprecated Use agendaReturnFilters; mantiene compatibilidad */
  agendaWithDate: (date: string, view?: string) =>
    view ? `/dashboard/agenda?date=${encodeURIComponent(date)}&view=${encodeURIComponent(view)}` : `/dashboard/agenda?date=${encodeURIComponent(date)}`,
  /** Editar agenda del médico: días y horarios de trabajo, intervalo de turnos */
  agendaEditar: "/dashboard/agenda/editar",
  /** Crear Agenda Propia: generar agenda por rango de fechas, mañana/tarde */
  agendaCrear: "/dashboard/agenda/crear",
  /** Editar Agenda: filtrar bloques y editar disponibilidad (Mostrar Turnos) */
  agendaEditarBloques: "/dashboard/agenda/editar-bloques",
  /** Eliminar Agenda: filtrar y eliminar bloques generados */
  agendaEliminar: "/dashboard/agenda/eliminar",
  medicos: "/dashboard/medicos",
  medicoNuevo: "/dashboard/medicos/nuevo",
  medicoProfile: (id: string) => `/dashboard/medicos/${id}`,
  // Listados (Etapa 5)
  listadosPacientes: "/dashboard/listados/pacientes",
  listadosControl: "/dashboard/listados/control",
  listadosAgenda: "/dashboard/listados/agenda",
  listadosGestionDisponibilidad: "/dashboard/listados/gestion-disponibilidad",
  listadosTurnos: "/dashboard/listados/turnos",
  listadosPacientesAtendidos: "/dashboard/listados/pacientes-atendidos",
  listadosPacientesOS: "/dashboard/listados/pacientes-os",
  listadosPacientesNoAtendidos: "/dashboard/listados/pacientes-no-atendidos",
  listadosTurnosAnulados: "/dashboard/listados/turnos-anulados",
  // Historia Clínica (Etapa 6)
  historiaClinica: "/dashboard/historia-clinica",
  historiaClinicaPaciente: (
    patientId: string,
    search?: {
      returnDate?: string;
      returnView?: string;
      returnDateFrom?: string;
      returnDateTo?: string;
      returnDoctorId?: string;
      returnConsultingRoomId?: string;
      returnAppointmentTypeId?: string;
      returnStatus?: string;
    }
  ) => {
    const base = `/dashboard/historia-clinica/${patientId}`;
    if (!search?.returnDate) return base;
    const p = new URLSearchParams({ returnDate: search.returnDate });
    if (search.returnView) p.set("returnView", search.returnView);
    if (search.returnDateFrom) p.set("returnDateFrom", search.returnDateFrom);
    if (search.returnDateTo) p.set("returnDateTo", search.returnDateTo);
    if (search.returnDoctorId) p.set("returnDoctorId", search.returnDoctorId);
    if (search.returnConsultingRoomId) p.set("returnConsultingRoomId", search.returnConsultingRoomId);
    if (search.returnAppointmentTypeId) p.set("returnAppointmentTypeId", search.returnAppointmentTypeId);
    if (search.returnStatus) p.set("returnStatus", search.returnStatus);
    return `${base}?${p.toString()}`;
  },
  historiaClinicaConsulta: (patientId: string, consultationId: string) =>
    `/dashboard/historia-clinica/${patientId}/consulta/${consultationId}`,
  historiaClinicaConsultaPdf: (patientId: string, consultationId: string) =>
    `/dashboard/historia-clinica/${patientId}/consulta/${consultationId}/pdf`,
  historiaClinicaPacientePdf: (patientId: string) => `/dashboard/historia-clinica/${patientId}/pdf`,
  // Administración de Recursos
  administracion: {
    consultorio: "/dashboard/administracion/agenda/consultorio",
    diasNoLaborables: "/dashboard/administracion/agenda/dias-no-laborables",
    solicitarTurno: "/dashboard/administracion/agenda/solicitar-turno",
    institucion: "/dashboard/administracion/web/institucion",
    tiposTurnos: "/dashboard/administracion/web/tipos-turnos",
    obrasSociales: "/dashboard/administracion/pacientes/obras-sociales",
    solicitarObraSocial: "/dashboard/administracion/pacientes/solicitar-obra-social",
  },
} as const;
