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
 * Parsea una fecha en formato YYYY-MM-DD a un objeto Date en zona horaria local
 * @param dateString Fecha en formato YYYY-MM-DD
 * @returns Objeto Date o null si el formato es inválido
 */
function parseLocalDate(dateString: string): Date | null {
  const parts = dateString.split("-");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  return new Date(year, month - 1, day);
}

/**
 * Formatea una fecha en formato YYYY-MM-DD a string localizado en zona horaria local
 * @param dateString Fecha en formato YYYY-MM-DD
 * @param locale Locale para el formato (por defecto 'es-AR')
 * @param options Opciones de formato (opcional)
 * @returns Fecha formateada como string
 */
export function formatDate(
  dateString: string,
  locale: string = "es-AR",
  options?: Intl.DateTimeFormatOptions
): string {
  const date = parseLocalDate(dateString);
  if (!date) return dateString;
  return date.toLocaleDateString(locale, options);
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
    const parsed = parseLocalDate(birthDate);
    if (parsed) {
      birth = parsed;
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