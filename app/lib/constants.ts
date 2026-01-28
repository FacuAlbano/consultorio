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
  medicos: "/dashboard/medicos",
  medicoNuevo: "/dashboard/medicos/nuevo",
  medicoProfile: (id: string) => `/dashboard/medicos/${id}`,
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
