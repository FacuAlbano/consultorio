import { db } from "~/db/client";
import { institutions } from "~/db/schema";
import { eq, ilike, desc } from "drizzle-orm";
import { isValidUUID } from "~/lib/utils";

/**
 * Opciones para búsqueda de instituciones
 */
export interface SearchInstitutionsOptions {
  query?: string;
  limit?: number;
  offset?: number;
}

/**
 * Busca instituciones por nombre
 */
export async function searchInstitutions(options: SearchInstitutionsOptions = {}) {
  const { query = "", limit = 20, offset = 0 } = options;

  if (!query || query.length < 2) {
    return [];
  }

  const searchTerm = `%${query}%`;

  const results = await db
    .select()
    .from(institutions)
    .where(ilike(institutions.name, searchTerm))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(institutions.createdAt));

  return results;
}

/**
 * Obtiene una institución por su ID
 */
export async function getInstitutionById(id: string) {
  if (!isValidUUID(id)) {
    return null;
  }

  const [institution] = await db
    .select()
    .from(institutions)
    .where(eq(institutions.id, id))
    .limit(1);

  return institution || null;
}

/**
 * Obtiene todas las instituciones con paginación
 */
export async function getAllInstitutions(options: SearchInstitutionsOptions = {}) {
  const { query = "", limit = 50, offset = 0 } = options;

  if (query) {
    return searchInstitutions(options);
  }

  const results = await db
    .select()
    .from(institutions)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(institutions.createdAt));

  return results;
}

/**
 * Crea una nueva institución
 */
export async function createInstitution(data: typeof institutions.$inferInsert) {
  try {
    const [newInstitution] = await db
      .insert(institutions)
      .values({
        ...data,
        updatedAt: new Date(),
      })
      .returning();

    return { success: true, data: newInstitution };
  } catch (error: any) {
    console.error("Error al crear institución:", error);
    return { success: false, error: "Error al crear la institución. Por favor, intente nuevamente." };
  }
}

/**
 * Actualiza una institución existente
 */
export async function updateInstitution(
  id: string,
  data: Partial<typeof institutions.$inferInsert>
) {
  if (!isValidUUID(id)) {
    return { success: false, error: "ID de institución inválido" };
  }

  try {
    const [updatedInstitution] = await db
      .update(institutions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(institutions.id, id))
      .returning();

    if (!updatedInstitution) {
      return { success: false, error: "Institución no encontrada" };
    }

    return { success: true, data: updatedInstitution };
  } catch (error: any) {
    console.error("Error al actualizar institución:", error);
    return { success: false, error: "Error al actualizar la institución. Por favor, intente nuevamente." };
  }
}

/**
 * Elimina una institución
 */
export async function deleteInstitution(id: string) {
  if (!isValidUUID(id)) {
    return { success: false, error: "ID de institución inválido" };
  }

  try {
    const [deletedInstitution] = await db
      .delete(institutions)
      .where(eq(institutions.id, id))
      .returning();

    if (!deletedInstitution) {
      return { success: false, error: "Institución no encontrada" };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error al eliminar institución:", error);
    return { success: false, error: "Error al eliminar la institución. Por favor, intente nuevamente." };
  }
}
