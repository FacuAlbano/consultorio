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
 * Obtiene la fecha actual en formato YYYY-MM-DD en la zona horaria local
 * @returns Fecha actual en formato ISO (YYYY-MM-DD)
 */
export function getTodayLocalISO(): string {
  return new Date().toLocaleDateString('en-CA');
}

/**
 * Calcula la edad en años a partir de la fecha de nacimiento
 * @param birthDate Fecha de nacimiento (string ISO, Date o null)
 * @returns Edad en años o null si no hay fecha
 */
export function calculateAge(birthDate: string | Date | null | undefined): number | null {
  if (!birthDate) return null;
  
  let birth: Date;
  if (typeof birthDate === "string") {
    // Parsear manualmente para evitar problemas de zona horaria
    const parts = birthDate.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      birth = new Date(year, month - 1, day);
    } else {
      birth = new Date(birthDate);
    }
  } else {
    birth = birthDate;
  }
  
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}