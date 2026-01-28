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
} as const;
