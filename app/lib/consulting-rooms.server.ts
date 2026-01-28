import { db } from "~/db/client";
import { consultingRooms } from "~/db/schema";
import { eq, ilike, desc } from "drizzle-orm";
import { isValidUUID } from "~/lib/utils";

/**
 * Opciones para búsqueda de consultorios
 */
export interface SearchConsultingRoomsOptions {
  query?: string;
  limit?: number;
  offset?: number;
}

/**
 * Busca consultorios por nombre
 */
export async function searchConsultingRooms(options: SearchConsultingRoomsOptions = {}) {
  const { query = "", limit = 20, offset = 0 } = options;

  if (!query || query.length < 2) {
    return [];
  }

  const searchTerm = `%${query}%`;

  const results = await db
    .select()
    .from(consultingRooms)
    .where(ilike(consultingRooms.name, searchTerm))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(consultingRooms.createdAt));

  return results;
}

/**
 * Obtiene un consultorio por su ID
 */
export async function getConsultingRoomById(id: string) {
  if (!isValidUUID(id)) {
    return null;
  }

  const [room] = await db
    .select()
    .from(consultingRooms)
    .where(eq(consultingRooms.id, id))
    .limit(1);

  return room || null;
}

/**
 * Obtiene todos los consultorios con paginación
 */
export async function getAllConsultingRooms(options: SearchConsultingRoomsOptions = {}) {
  const { query = "", limit = 50, offset = 0 } = options;

  if (query) {
    return searchConsultingRooms(options);
  }

  const results = await db
    .select()
    .from(consultingRooms)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(consultingRooms.createdAt));

  return results;
}

/**
 * Crea un nuevo consultorio
 */
export async function createConsultingRoom(data: typeof consultingRooms.$inferInsert) {
  try {
    const [newRoom] = await db
      .insert(consultingRooms)
      .values({
        ...data,
        updatedAt: new Date(),
      })
      .returning();

    return { success: true, data: newRoom };
  } catch (error: any) {
    console.error("Error al crear consultorio:", error);
    return { success: false, error: "Error al crear el consultorio. Por favor, intente nuevamente." };
  }
}

/**
 * Actualiza un consultorio existente
 */
export async function updateConsultingRoom(
  id: string,
  data: Partial<typeof consultingRooms.$inferInsert>
) {
  if (!isValidUUID(id)) {
    return { success: false, error: "ID de consultorio inválido" };
  }

  try {
    const [updatedRoom] = await db
      .update(consultingRooms)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(consultingRooms.id, id))
      .returning();

    if (!updatedRoom) {
      return { success: false, error: "Consultorio no encontrado" };
    }

    return { success: true, data: updatedRoom };
  } catch (error: any) {
    console.error("Error al actualizar consultorio:", error);
    return { success: false, error: "Error al actualizar el consultorio. Por favor, intente nuevamente." };
  }
}

/**
 * Elimina un consultorio
 */
export async function deleteConsultingRoom(id: string) {
  if (!isValidUUID(id)) {
    return { success: false, error: "ID de consultorio inválido" };
  }

  try {
    const [deletedRoom] = await db
      .delete(consultingRooms)
      .where(eq(consultingRooms.id, id))
      .returning();

    if (!deletedRoom) {
      return { success: false, error: "Consultorio no encontrado" };
    }

    return { success: true };
  } catch (error: any) {
    // Manejar errores de clave foránea (si hay turnos asociados)
    if (error?.code === "23503") {
      return { success: false, error: "No se puede eliminar el consultorio porque tiene turnos asociados" };
    }
    
    console.error("Error al eliminar consultorio:", error);
    return { success: false, error: "Error al eliminar el consultorio. Por favor, intente nuevamente." };
  }
}
