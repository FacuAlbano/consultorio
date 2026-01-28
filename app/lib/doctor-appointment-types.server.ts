import { db } from "~/db/client";
import { doctorAppointmentTypes, doctors, appointmentTypes } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { isValidUUID } from "~/lib/utils";

/**
 * Obtiene los tipos de turnos asociados a un médico
 */
export async function getDoctorAppointmentTypes(doctorId: string) {
  if (!isValidUUID(doctorId)) {
    return [];
  }

  const results = await db
    .select({
      id: doctorAppointmentTypes.id,
      doctorId: doctorAppointmentTypes.doctorId,
      appointmentTypeId: doctorAppointmentTypes.appointmentTypeId,
      appointmentType: {
        id: appointmentTypes.id,
        name: appointmentTypes.name,
        description: appointmentTypes.description,
        duration: appointmentTypes.duration,
      },
    })
    .from(doctorAppointmentTypes)
    .innerJoin(appointmentTypes, eq(doctorAppointmentTypes.appointmentTypeId, appointmentTypes.id))
    .where(eq(doctorAppointmentTypes.doctorId, doctorId));

  return results;
}

/**
 * Asocia un tipo de turno a un médico
 */
export async function addDoctorAppointmentType(doctorId: string, appointmentTypeId: string) {
  if (!isValidUUID(doctorId)) {
    return { success: false, error: "ID de médico inválido" };
  }

  if (!isValidUUID(appointmentTypeId)) {
    return { success: false, error: "ID de tipo de turno inválido" };
  }

  try {
    const [newRelation] = await db
      .insert(doctorAppointmentTypes)
      .values({
        doctorId,
        appointmentTypeId,
      })
      .returning();

    return { success: true, data: newRelation };
  } catch (error: any) {
    // Manejar errores de restricción única (relación duplicada)
    if (error?.code === "23505") {
      return { success: false, error: "Este tipo de turno ya está asociado al médico" };
    }
    
    // Manejar errores de clave foránea
    if (error?.code === "23503") {
      if (error?.constraint?.includes("doctor_id") || error?.message?.includes("doctor_id")) {
        return { success: false, error: "El médico seleccionado no existe" };
      }
      if (error?.constraint?.includes("appointment_type_id") || error?.message?.includes("appointment_type_id")) {
        return { success: false, error: "El tipo de turno seleccionado no existe" };
      }
      return { success: false, error: "Uno de los datos seleccionados no es válido" };
    }
    
    console.error("Error al asociar tipo de turno al médico:", error);
    return { success: false, error: "Error al asociar el tipo de turno. Por favor, intente nuevamente." };
  }
}

/**
 * Elimina la asociación entre un médico y un tipo de turno
 */
export async function removeDoctorAppointmentType(id: string) {
  if (!isValidUUID(id)) {
    return { success: false, error: "ID inválido" };
  }

  const [deletedRelation] = await db
    .delete(doctorAppointmentTypes)
    .where(eq(doctorAppointmentTypes.id, id))
    .returning();

  if (!deletedRelation) {
    return { success: false, error: "Asociación no encontrada" };
  }

  return { success: true };
}

