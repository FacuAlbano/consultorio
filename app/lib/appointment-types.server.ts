import { db } from "~/db/client";
import { appointmentTypes } from "~/db/schema";
import { eq, ilike, desc } from "drizzle-orm";
import { isValidUUID } from "~/lib/utils";

/**
 * Opciones para búsqueda de tipos de turnos
 */
export interface SearchAppointmentTypesOptions {
  query?: string;
  limit?: number;
  offset?: number;
}

/**
 * Busca tipos de turnos por nombre
 */
export async function searchAppointmentTypes(options: SearchAppointmentTypesOptions = {}) {
  const { query = "", limit = 20, offset = 0 } = options;

  if (!query || query.length < 2) {
    return [];
  }

  const searchTerm = `%${query}%`;

  const results = await db
    .select()
    .from(appointmentTypes)
    .where(ilike(appointmentTypes.name, searchTerm))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(appointmentTypes.createdAt));

  return results;
}

/**
 * Obtiene un tipo de turno por su ID
 */
export async function getAppointmentTypeById(id: string) {
  if (!isValidUUID(id)) {
    return null;
  }

  const [type] = await db
    .select()
    .from(appointmentTypes)
    .where(eq(appointmentTypes.id, id))
    .limit(1);

  return type || null;
}

/**
 * Obtiene todos los tipos de turnos con paginación
 */
export async function getAllAppointmentTypes(options: SearchAppointmentTypesOptions = {}) {
  const { query = "", limit = 50, offset = 0 } = options;

  if (query) {
    return searchAppointmentTypes(options);
  }

  const results = await db
    .select()
    .from(appointmentTypes)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(appointmentTypes.createdAt));

  return results;
}

/**
 * Crea un nuevo tipo de turno
 */
export async function createAppointmentType(data: typeof appointmentTypes.$inferInsert) {
  try {
    const [newType] = await db
      .insert(appointmentTypes)
      .values({
        ...data,
        updatedAt: new Date(),
      })
      .returning();

    return { success: true, data: newType };
  } catch (error: any) {
    console.error("Error al crear tipo de turno:", error);
    return { success: false, error: "Error al crear el tipo de turno. Por favor, intente nuevamente." };
  }
}

/**
 * Actualiza un tipo de turno existente
 */
export async function updateAppointmentType(
  id: string,
  data: Partial<typeof appointmentTypes.$inferInsert>
) {
  if (!isValidUUID(id)) {
    return { success: false, error: "ID de tipo de turno inválido" };
  }

  try {
    const [updatedType] = await db
      .update(appointmentTypes)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(appointmentTypes.id, id))
      .returning();

    if (!updatedType) {
      return { success: false, error: "Tipo de turno no encontrado" };
    }

    return { success: true, data: updatedType };
  } catch (error: any) {
    console.error("Error al actualizar tipo de turno:", error);
    return { success: false, error: "Error al actualizar el tipo de turno. Por favor, intente nuevamente." };
  }
}

/**
 * Elimina un tipo de turno
 */
export async function deleteAppointmentType(id: string) {
  if (!isValidUUID(id)) {
    return { success: false, error: "ID de tipo de turno inválido" };
  }

  try {
    const [deletedType] = await db
      .delete(appointmentTypes)
      .where(eq(appointmentTypes.id, id))
      .returning();

    if (!deletedType) {
      return { success: false, error: "Tipo de turno no encontrado" };
    }

    return { success: true };
  } catch (error: any) {
    // Manejar errores de clave foránea (si hay turnos asociados)
    if (error?.code === "23503") {
      return { success: false, error: "No se puede eliminar el tipo de turno porque tiene turnos asociados" };
    }
    
    console.error("Error al eliminar tipo de turno:", error);
    return { success: false, error: "Error al eliminar el tipo de turno. Por favor, intente nuevamente." };
  }
}
