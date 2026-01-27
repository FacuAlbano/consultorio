import { db } from "~/db/client";
import { doctors, doctorUnavailableDays } from "~/db/schema";
import { eq, or, ilike, desc, and, gte, lte } from "drizzle-orm";
import { isValidUUID } from "~/lib/utils";

/**
 * Opciones para búsqueda de médicos
 */
export interface SearchDoctorsOptions {
  query?: string;
  limit?: number;
  offset?: number;
}

/**
 * Busca médicos por nombre, documento o matrícula
 * @param options Opciones de búsqueda
 * @returns Lista de médicos que coinciden con la búsqueda
 */
export async function searchDoctors(options: SearchDoctorsOptions = {}) {
  const { query = "", limit = 20, offset = 0 } = options;

  if (!query || query.length < 2) {
    return [];
  }

  const searchTerm = `%${query}%`;

  const results = await db
    .select()
    .from(doctors)
    .where(
      or(
        ilike(doctors.firstName, searchTerm),
        ilike(doctors.lastName, searchTerm),
        ilike(doctors.documentNumber, searchTerm),
        ilike(doctors.licenseNumber, searchTerm),
        ilike(doctors.specialty, searchTerm),
        ilike(doctors.practice, searchTerm)
      )
    )
    .limit(limit)
    .offset(offset)
    .orderBy(desc(doctors.createdAt));

  return results;
}

/**
 * Obtiene un médico por su ID
 * @param id ID del médico
 * @returns El médico o null si no existe
 */
export async function getDoctorById(id: string) {
  if (!isValidUUID(id)) {
    return null;
  }

  const [doctor] = await db
    .select()
    .from(doctors)
    .where(eq(doctors.id, id))
    .limit(1);

  return doctor || null;
}

/**
 * Obtiene todos los médicos con paginación
 * @param options Opciones de paginación y búsqueda
 * @returns Lista de médicos
 */
export async function getAllDoctors(options: SearchDoctorsOptions = {}) {
  const { query = "", limit = 50, offset = 0 } = options;

  if (query) {
    return searchDoctors(options);
  }

  const results = await db
    .select()
    .from(doctors)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(doctors.createdAt));

  return results;
}

/**
 * Crea un nuevo médico
 * @param data Datos del médico
 * @returns El médico creado
 */
export async function createDoctor(data: typeof doctors.$inferInsert) {
  const [newDoctor] = await db
    .insert(doctors)
    .values({
      ...data,
      updatedAt: new Date(),
    })
    .returning();

  return { success: true, data: newDoctor };
}

/**
 * Actualiza un médico existente
 * @param id ID del médico
 * @param data Datos a actualizar
 * @returns El médico actualizado o error si no existe
 */
export async function updateDoctor(
  id: string,
  data: Partial<typeof doctors.$inferInsert>
) {
  if (!isValidUUID(id)) {
    return { success: false, error: "ID de médico inválido" };
  }

  const [updatedDoctor] = await db
    .update(doctors)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(doctors.id, id))
    .returning();

  if (!updatedDoctor) {
    return { success: false, error: "Médico no encontrado" };
  }

  return { success: true, data: updatedDoctor };
}

/**
 * Elimina un médico
 * @param id ID del médico
 * @returns Resultado de la operación
 */
export async function deleteDoctor(id: string) {
  if (!isValidUUID(id)) {
    return { success: false, error: "ID de médico inválido" };
  }

  const [deletedDoctor] = await db
    .delete(doctors)
    .where(eq(doctors.id, id))
    .returning();

  if (!deletedDoctor) {
    return { success: false, error: "Médico no encontrado" };
  }

  return { success: true };
}

/**
 * Obtiene los días no laborables de un médico
 * @param doctorId ID del médico
 * @param startDate Fecha de inicio (opcional)
 * @param endDate Fecha de fin (opcional)
 * @returns Lista de días no laborables
 */
export async function getDoctorUnavailableDays(
  doctorId: string,
  startDate?: string,
  endDate?: string
) {
  if (!isValidUUID(doctorId)) {
    return [];
  }

  let whereCondition = eq(doctorUnavailableDays.doctorId, doctorId);

  if (startDate && endDate) {
    whereCondition = and(
      eq(doctorUnavailableDays.doctorId, doctorId),
      gte(doctorUnavailableDays.date, startDate),
      lte(doctorUnavailableDays.date, endDate)
    ) as typeof whereCondition;
  } else if (startDate) {
    whereCondition = and(
      eq(doctorUnavailableDays.doctorId, doctorId),
      gte(doctorUnavailableDays.date, startDate)
    ) as typeof whereCondition;
  } else if (endDate) {
    whereCondition = and(
      eq(doctorUnavailableDays.doctorId, doctorId),
      lte(doctorUnavailableDays.date, endDate)
    ) as typeof whereCondition;
  }

  const results = await db
    .select()
    .from(doctorUnavailableDays)
    .where(whereCondition)
    .orderBy(desc(doctorUnavailableDays.date));

  return results;
}

/**
 * Agrega un día no laborable para un médico
 * @param doctorId ID del médico
 * @param date Fecha del día no laborable
 * @param reason Motivo (opcional)
 * @returns El día no laborable creado
 */
export async function addDoctorUnavailableDay(
  doctorId: string,
  date: string,
  reason?: string
) {
  if (!isValidUUID(doctorId)) {
    return { success: false, error: "ID de médico inválido" };
  }

  const [newUnavailableDay] = await db
    .insert(doctorUnavailableDays)
    .values({
      doctorId,
      date,
      reason,
    })
    .returning();

  return { success: true, data: newUnavailableDay };
}

/**
 * Elimina un día no laborable
 * @param id ID del día no laborable
 * @returns Resultado de la operación
 */
export async function removeDoctorUnavailableDay(id: string) {
  if (!isValidUUID(id)) {
    return { success: false, error: "ID inválido" };
  }

  const [deletedDay] = await db
    .delete(doctorUnavailableDays)
    .where(eq(doctorUnavailableDays.id, id))
    .returning();

  if (!deletedDay) {
    return { success: false, error: "Día no laborable no encontrado" };
  }

  return { success: true };
}
