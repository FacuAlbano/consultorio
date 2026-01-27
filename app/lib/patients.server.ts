import { db } from "~/db/client";
import { patients } from "~/db/schema";
import { eq, and, or, like, ilike, desc } from "drizzle-orm";

/**
 * Opciones para búsqueda de pacientes
 */
export interface SearchPatientsOptions {
  query?: string;
  limit?: number;
  offset?: number;
}

/**
 * Busca pacientes por nombre, documento, HC u obra social
 * @param options Opciones de búsqueda
 * @returns Lista de pacientes que coinciden con la búsqueda
 */
export async function searchPatients(options: SearchPatientsOptions = {}) {
  const { query = "", limit = 20, offset = 0 } = options;

  if (!query || query.length < 2) {
    return [];
  }

  const searchTerm = `%${query}%`;

  const results = await db
    .select()
    .from(patients)
    .where(
      or(
        ilike(patients.firstName, searchTerm),
        ilike(patients.lastName, searchTerm),
        ilike(patients.documentNumber, searchTerm),
        ilike(patients.medicalRecordNumber, searchTerm),
        ilike(patients.insuranceCompany, searchTerm)
      )
    )
    .limit(limit)
    .offset(offset)
    .orderBy(desc(patients.createdAt));

  return results;
}

/**
 * Obtiene un paciente por su ID
 * @param id ID del paciente
 * @returns El paciente o null si no existe
 */
export async function getPatientById(id: string) {
  const [patient] = await db
    .select()
    .from(patients)
    .where(eq(patients.id, id))
    .limit(1);

  return patient || null;
}

/**
 * Obtiene un paciente por su número de documento
 * @param documentNumber Número de documento
 * @returns El paciente o null si no existe
 */
export async function getPatientByDocument(documentNumber: string) {
  const [patient] = await db
    .select()
    .from(patients)
    .where(eq(patients.documentNumber, documentNumber))
    .limit(1);

  return patient || null;
}

/**
 * Obtiene un paciente por su número de historia clínica
 * @param medicalRecordNumber Número de historia clínica
 * @returns El paciente o null si no existe
 */
export async function getPatientByMedicalRecord(medicalRecordNumber: string) {
  const [patient] = await db
    .select()
    .from(patients)
    .where(eq(patients.medicalRecordNumber, medicalRecordNumber))
    .limit(1);

  return patient || null;
}

/**
 * Obtiene todos los pacientes con paginación
 * @param options Opciones de paginación y búsqueda
 * @returns Lista de pacientes
 */
export async function getAllPatients(options: SearchPatientsOptions = {}) {
  const { query = "", limit = 50, offset = 0 } = options;

  if (query) {
    return searchPatients(options);
  }

  const results = await db
    .select()
    .from(patients)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(patients.createdAt));

  return results;
}

/**
 * Crea un nuevo paciente
 * @param data Datos del paciente
 * @returns El paciente creado
 */
export async function createPatient(data: typeof patients.$inferInsert) {
  const [newPatient] = await db
    .insert(patients)
    .values({
      ...data,
      updatedAt: new Date(),
    })
    .returning();

  return { success: true, data: newPatient };
}

/**
 * Actualiza un paciente existente
 * @param id ID del paciente
 * @param data Datos a actualizar
 * @returns El paciente actualizado
 */
export async function updatePatient(
  id: string,
  data: Partial<typeof patients.$inferInsert>
) {
  const [updatedPatient] = await db
    .update(patients)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(patients.id, id))
    .returning();

  return { success: true, data: updatedPatient };
}

/**
 * Elimina un paciente
 * @param id ID del paciente
 * @returns Resultado de la operación
 */
export async function deletePatient(id: string) {
  await db.delete(patients).where(eq(patients.id, id));
  return { success: true };
}
