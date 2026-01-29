import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Valida si una cadena es un UUID válido
 * @param uuid String a validar
 * @returns true si es un UUID válido, false en caso contrario
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Calcula la edad en años a partir de la fecha de nacimiento
 * @param birthDate Fecha de nacimiento (string ISO, Date o null)
 * @returns Edad en años o null si no hay fecha
 */
export function calculateAge(birthDate: string | Date | null | undefined): number | null {
  if (!birthDate) return null;
  const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}