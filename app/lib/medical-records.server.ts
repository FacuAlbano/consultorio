import { db } from "~/db/client";
import {
  medicalConsultations,
  diagnoses,
  treatments,
  studies,
  patients,
  doctors,
} from "~/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { isValidUUID } from "~/lib/utils";

export interface GetConsultationsOptions {
  patientId: string;
  limit?: number;
  offset?: number;
}

export async function getConsultationsByPatientId(options: GetConsultationsOptions) {
  const { patientId, limit = 50, offset = 0 } = options;
  if (!isValidUUID(patientId)) return [];

  const list = await db
    .select({
      consultation: medicalConsultations,
      doctor: {
        id: doctors.id,
        firstName: doctors.firstName,
        lastName: doctors.lastName,
      },
    })
    .from(medicalConsultations)
    .leftJoin(doctors, eq(medicalConsultations.doctorId, doctors.id))
    .where(eq(medicalConsultations.patientId, patientId))
    .orderBy(desc(medicalConsultations.consultationDate))
    .limit(limit)
    .offset(offset);

  return list;
}

export async function getConsultationById(id: string) {
  if (!isValidUUID(id)) return null;

  const [row] = await db
    .select({
      consultation: medicalConsultations,
      patient: {
        id: patients.id,
        firstName: patients.firstName,
        lastName: patients.lastName,
        documentNumber: patients.documentNumber,
        medicalRecordNumber: patients.medicalRecordNumber,
        birthDate: patients.birthDate,
      },
      doctor: {
        id: doctors.id,
        firstName: doctors.firstName,
        lastName: doctors.lastName,
        signatureUrl: doctors.signatureUrl,
      },
    })
    .from(medicalConsultations)
    .innerJoin(patients, eq(medicalConsultations.patientId, patients.id))
    .leftJoin(doctors, eq(medicalConsultations.doctorId, doctors.id))
    .where(eq(medicalConsultations.id, id));

  if (!row) return null;

  const [diagList, treatList, studyList] = await Promise.all([
    db.select().from(diagnoses).where(eq(diagnoses.medicalConsultationId, id)).orderBy(diagnoses.id),
    db.select().from(treatments).where(eq(treatments.medicalConsultationId, id)).orderBy(treatments.id),
    db.select().from(studies).where(eq(studies.medicalConsultationId, id)).orderBy(studies.id),
  ]);

  return {
    ...row,
    diagnoses: diagList,
    treatments: treatList,
    studies: studyList,
  };
}

export interface CreateConsultationInput {
  patientId: string;
  doctorId?: string | null;
  appointmentId?: string | null;
  consultationDate: string;
  reason?: string | null;
  notes?: string | null;
}

export async function createConsultation(input: CreateConsultationInput) {
  if (!isValidUUID(input.patientId)) {
    return { success: false as const, error: "ID de paciente inválido" };
  }

  try {
    const [inserted] = await db
      .insert(medicalConsultations)
      .values({
        patientId: input.patientId,
        doctorId: input.doctorId || null,
        appointmentId: input.appointmentId || null,
        consultationDate: input.consultationDate,
        reason: input.reason || null,
        notes: input.notes || null,
      })
      .returning();

    return { success: true as const, data: inserted };
  } catch (err) {
    console.error("createConsultation:", err);
    return { success: false as const, error: "Error al crear la consulta" };
  }
}

export async function updateConsultation(
  id: string,
  input: Partial<CreateConsultationInput>
) {
  if (!isValidUUID(id)) return { success: false as const, error: "ID inválido" };

  try {
    const [updated] = await db
      .update(medicalConsultations)
      .set({
        ...(input.consultationDate && { consultationDate: input.consultationDate }),
        ...(input.doctorId !== undefined && { doctorId: input.doctorId || null }),
        ...(input.appointmentId !== undefined && { appointmentId: input.appointmentId || null }),
        ...(input.reason !== undefined && { reason: input.reason || null }),
        ...(input.notes !== undefined && { notes: input.notes || null }),
        updatedAt: new Date(),
      })
      .where(eq(medicalConsultations.id, id))
      .returning();

    if (!updated) return { success: false as const, error: "Consulta no encontrada" };
    return { success: true as const, data: updated };
  } catch (err) {
    console.error("updateConsultation:", err);
    return { success: false as const, error: "Error al actualizar" };
  }
}

export async function deleteConsultation(id: string) {
  if (!isValidUUID(id)) return { success: false as const, error: "ID inválido" };

  const [deleted] = await db
    .delete(medicalConsultations)
    .where(eq(medicalConsultations.id, id))
    .returning();

  return deleted ? { success: true as const } : { success: false as const, error: "Consulta no encontrada" };
}

// Diagnósticos
export async function addDiagnosis(medicalConsultationId: string, data: { code?: string; name: string; description?: string }) {
  if (!isValidUUID(medicalConsultationId)) return { success: false as const, error: "ID inválido" };
  const [inserted] = await db.insert(diagnoses).values({
    medicalConsultationId,
    code: data.code || null,
    name: data.name,
    description: data.description || null,
  }).returning();
  return inserted ? { success: true as const, data: inserted } : { success: false as const, error: "Error al crear" };
}

export async function updateDiagnosis(id: string, data: { code?: string; name?: string; description?: string }) {
  if (!isValidUUID(id)) return { success: false as const, error: "ID inválido" };
  const [updated] = await db.update(diagnoses).set(data).where(eq(diagnoses.id, id)).returning();
  return updated ? { success: true as const, data: updated } : { success: false as const, error: "No encontrado" };
}

export async function deleteDiagnosis(id: string) {
  if (!isValidUUID(id)) return { success: false as const, error: "ID inválido" };
  const [deleted] = await db.delete(diagnoses).where(eq(diagnoses.id, id)).returning();
  return deleted ? { success: true as const } : { success: false as const, error: "No encontrado" };
}

// Tratamientos
export async function addTreatment(medicalConsultationId: string, description: string) {
  if (!isValidUUID(medicalConsultationId)) return { success: false as const, error: "ID inválido" };
  const [inserted] = await db.insert(treatments).values({ medicalConsultationId, description }).returning();
  return inserted ? { success: true as const, data: inserted } : { success: false as const, error: "Error al crear" };
}

export async function updateTreatment(id: string, description: string) {
  if (!isValidUUID(id)) return { success: false as const, error: "ID inválido" };
  const [updated] = await db.update(treatments).set({ description }).where(eq(treatments.id, id)).returning();
  return updated ? { success: true as const, data: updated } : { success: false as const, error: "No encontrado" };
}

export async function deleteTreatment(id: string) {
  if (!isValidUUID(id)) return { success: false as const, error: "ID inválido" };
  const [deleted] = await db.delete(treatments).where(eq(treatments.id, id)).returning();
  return deleted ? { success: true as const } : { success: false as const, error: "No encontrado" };
}

// Estudios
export async function addStudy(medicalConsultationId: string, data: { description: string; result?: string }) {
  if (!isValidUUID(medicalConsultationId)) return { success: false as const, error: "ID inválido" };
  const [inserted] = await db.insert(studies).values({
    medicalConsultationId,
    description: data.description,
    result: data.result || null,
  }).returning();
  return inserted ? { success: true as const, data: inserted } : { success: false as const, error: "Error al crear" };
}

export async function updateStudy(id: string, data: { description?: string; result?: string }) {
  if (!isValidUUID(id)) return { success: false as const, error: "ID inválido" };
  const [updated] = await db.update(studies).set(data).where(eq(studies.id, id)).returning();
  return updated ? { success: true as const, data: updated } : { success: false as const, error: "No encontrado" };
}

export async function deleteStudy(id: string) {
  if (!isValidUUID(id)) return { success: false as const, error: "ID inválido" };
  const [deleted] = await db.delete(studies).where(eq(studies.id, id)).returning();
  return deleted ? { success: true as const } : { success: false as const, error: "No encontrado" };
}
