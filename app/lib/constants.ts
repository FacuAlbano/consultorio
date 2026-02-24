/**
 * Rutas de la aplicación
 * Constantes de rutas centralizadas para evitar errores tipográficos y mantener consistencia
 */
export const PATHS = {
  root: "/",
  login: "/login",
  logout: "/logout",
  dashboard: "/dashboard",
  patientProfile: (id: string) => `/pacientes/${id}`,
  poolAtencion: "/dashboard/pool-atencion",
  atenderSinTurno: "/dashboard/atender-sin-turno",
  /** Vista día con slots cada 15 min para armar la agenda y asignar pacientes */
  agenda: "/dashboard/agenda",
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
  historiaClinicaPaciente: (patientId: string) => `/dashboard/historia-clinica/${patientId}`,
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
