import { db } from "~/db/client";
import { appointments, patients, doctors, consultingRooms, appointmentTypes } from "~/db/schema";
import { eq, and, gte, lte, desc, asc, or, ilike } from "drizzle-orm";
import { isValidUUID } from "~/lib/utils";

/**
 * Opciones para búsqueda de turnos
 */
export interface SearchAppointmentsOptions {
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  doctorId?: string;
  patientId?: string;
  status?: string;
  insuranceCompany?: string; // Filtro por obra social del paciente (5.7)
  limit?: number;
  offset?: number;
}

/**
 * Obtiene turnos con información relacionada
 * @param options Opciones de búsqueda
 * @returns Lista de turnos con datos relacionados
 */
export async function getAppointments(options: SearchAppointmentsOptions = {}) {
  const {
    date,
    dateFrom,
    dateTo,
    doctorId,
    patientId,
    status,
    insuranceCompany,
    limit = 100,
    offset = 0,
  } = options;

  let whereConditions = [];

  if (date) {
    whereConditions.push(eq(appointments.appointmentDate, date));
  } else {
    if (dateFrom) whereConditions.push(gte(appointments.appointmentDate, dateFrom));
    if (dateTo) whereConditions.push(lte(appointments.appointmentDate, dateTo));
  }

  if (doctorId && isValidUUID(doctorId)) {
    whereConditions.push(eq(appointments.doctorId, doctorId));
  }

  if (patientId && isValidUUID(patientId)) {
    whereConditions.push(eq(appointments.patientId, patientId));
  }

  if (status) {
    whereConditions.push(eq(appointments.status, status));
  }

  if (insuranceCompany) {
    whereConditions.push(eq(patients.insuranceCompany, insuranceCompany));
  }

  const whereCondition = whereConditions.length > 0
    ? and(...whereConditions)
    : undefined;

  const results = await db
    .select({
      appointment: appointments,
      patient: {
        id: patients.id,
        firstName: patients.firstName,
        lastName: patients.lastName,
        documentNumber: patients.documentNumber,
        medicalRecordNumber: patients.medicalRecordNumber,
        insuranceCompany: patients.insuranceCompany,
      },
      doctor: {
        id: doctors.id,
        firstName: doctors.firstName,
        lastName: doctors.lastName,
        practice: doctors.practice,
      },
      consultingRoom: {
        id: consultingRooms.id,
        name: consultingRooms.name,
      },
      appointmentType: {
        id: appointmentTypes.id,
        name: appointmentTypes.name,
        duration: appointmentTypes.duration,
      },
    })
    .from(appointments)
    .leftJoin(patients, eq(appointments.patientId, patients.id))
    .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
    .leftJoin(consultingRooms, eq(appointments.consultingRoomId, consultingRooms.id))
    .leftJoin(appointmentTypes, eq(appointments.appointmentTypeId, appointmentTypes.id))
    .where(whereCondition)
    .orderBy(asc(appointments.appointmentTime), asc(appointments.appointmentDate))
    .limit(limit)
    .offset(offset);

  return results;
}

/**
 * Obtiene un turno por su ID
 * @param id ID del turno
 * @returns El turno con datos relacionados o null si no existe
 */
export async function getAppointmentById(id: string) {
  if (!isValidUUID(id)) {
    return null;
  }

  const [result] = await db
    .select({
      appointment: appointments,
      patient: {
        id: patients.id,
        firstName: patients.firstName,
        lastName: patients.lastName,
        documentNumber: patients.documentNumber,
        medicalRecordNumber: patients.medicalRecordNumber,
      },
      doctor: {
        id: doctors.id,
        firstName: doctors.firstName,
        lastName: doctors.lastName,
        practice: doctors.practice,
      },
      consultingRoom: {
        id: consultingRooms.id,
        name: consultingRooms.name,
      },
      appointmentType: {
        id: appointmentTypes.id,
        name: appointmentTypes.name,
        duration: appointmentTypes.duration,
      },
    })
    .from(appointments)
    .leftJoin(patients, eq(appointments.patientId, patients.id))
    .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
    .leftJoin(consultingRooms, eq(appointments.consultingRoomId, consultingRooms.id))
    .leftJoin(appointmentTypes, eq(appointments.appointmentTypeId, appointmentTypes.id))
    .where(eq(appointments.id, id))
    .limit(1);

  return result || null;
}

/**
 * Crea un nuevo turno
 * @param data Datos del turno
 * @returns El turno creado o error si falla
 */
export async function createAppointment(data: typeof appointments.$inferInsert) {
  try {
    const [newAppointment] = await db
      .insert(appointments)
      .values({
        ...data,
        updatedAt: new Date(),
      })
      .returning();

    return { success: true, data: newAppointment };
  } catch (error: any) {
    // Manejar errores de restricción única
    if (error?.code === "23505") {
      return { success: false, error: "Ya existe un turno con estos datos" };
    }
    
    // Manejar errores de clave foránea (referencias inválidas)
    if (error?.code === "23503") {
      if (error?.constraint?.includes("doctor_id") || error?.message?.includes("doctor_id")) {
        return { success: false, error: "El médico seleccionado no existe" };
      }
      if (error?.constraint?.includes("patient_id") || error?.message?.includes("patient_id")) {
        return { success: false, error: "El paciente seleccionado no existe" };
      }
      if (error?.constraint?.includes("consulting_room_id") || error?.message?.includes("consulting_room_id")) {
        return { success: false, error: "El consultorio seleccionado no existe" };
      }
      if (error?.constraint?.includes("appointment_type_id") || error?.message?.includes("appointment_type_id")) {
        return { success: false, error: "El tipo de turno seleccionado no existe" };
      }
      return { success: false, error: "Uno de los datos seleccionados no es válido" };
    }
    
    // Otros errores de base de datos
    console.error("Error al crear turno:", error);
    return { success: false, error: "Error al crear el turno. Por favor, intente nuevamente." };
  }
}

/**
 * Actualiza un turno existente
 * @param id ID del turno
 * @param data Datos a actualizar
 * @returns El turno actualizado o error si no existe
 */
export async function updateAppointment(
  id: string,
  data: Partial<typeof appointments.$inferInsert>
) {
  if (!isValidUUID(id)) {
    return { success: false, error: "ID de turno inválido" };
  }

  try {
    const [updatedAppointment] = await db
      .update(appointments)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, id))
      .returning();

    if (!updatedAppointment) {
      return { success: false, error: "Turno no encontrado" };
    }

    return { success: true, data: updatedAppointment };
  } catch (error: any) {
    // Manejar errores de restricción única
    if (error?.code === "23505") {
      return { success: false, error: "Ya existe un turno con estos datos" };
    }
    
    // Manejar errores de clave foránea (referencias inválidas)
    if (error?.code === "23503") {
      if (error?.constraint?.includes("doctor_id") || error?.message?.includes("doctor_id")) {
        return { success: false, error: "El médico seleccionado no existe" };
      }
      if (error?.constraint?.includes("patient_id") || error?.message?.includes("patient_id")) {
        return { success: false, error: "El paciente seleccionado no existe" };
      }
      if (error?.constraint?.includes("consulting_room_id") || error?.message?.includes("consulting_room_id")) {
        return { success: false, error: "El consultorio seleccionado no existe" };
      }
      if (error?.constraint?.includes("appointment_type_id") || error?.message?.includes("appointment_type_id")) {
        return { success: false, error: "El tipo de turno seleccionado no existe" };
      }
      return { success: false, error: "Uno de los datos seleccionados no es válido" };
    }
    
    // Otros errores de base de datos
    console.error("Error al actualizar turno:", error);
    return { success: false, error: "Error al actualizar el turno. Por favor, intente nuevamente." };
  }
}

/**
 * Elimina un turno
 * @param id ID del turno
 * @returns Resultado de la operación
 */
export async function deleteAppointment(id: string) {
  if (!isValidUUID(id)) {
    return { success: false, error: "ID de turno inválido" };
  }

  const [deletedAppointment] = await db
    .delete(appointments)
    .where(eq(appointments.id, id))
    .returning();

  if (!deletedAppointment) {
    return { success: false, error: "Turno no encontrado" };
  }

  return { success: true };
}

/**
 * Marca un turno como atendido
 * @param id ID del turno
 * @param receptionTime Hora de recepción (opcional)
 * @returns El turno actualizado
 */
export async function markAppointmentAsAttended(
  id: string,
  receptionTime?: string
) {
  if (!isValidUUID(id)) {
    return { success: false, error: "ID de turno inválido" };
  }

  const updateData: Partial<typeof appointments.$inferInsert> = {
    status: "attended",
    updatedAt: new Date(),
  };

  if (receptionTime) {
    updateData.receptionTime = receptionTime;
  }

  return updateAppointment(id, updateData);
}

/**
 * Marca un turno como cancelado
 * @param id ID del turno
 * @param notes Notas sobre la cancelación (opcional)
 * @returns El turno actualizado
 */
export async function cancelAppointment(id: string, notes?: string) {
  if (!isValidUUID(id)) {
    return { success: false, error: "ID de turno inválido" };
  }

  const updateData: Partial<typeof appointments.$inferInsert> = {
    status: "cancelled",
    updatedAt: new Date(),
  };

  if (notes) {
    updateData.notes = notes;
  }

  return updateAppointment(id, updateData);
}
