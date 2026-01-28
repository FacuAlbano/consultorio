import { db } from "~/db/client";
import { insuranceCompanies } from "~/db/schema";
import { eq, ilike, desc, and, or } from "drizzle-orm";
import { isValidUUID } from "~/lib/utils";

/**
 * Opciones para búsqueda de obras sociales
 */
export interface SearchInsuranceCompaniesOptions {
  query?: string;
  limit?: number;
  offset?: number;
  isActive?: boolean;
}

/**
 * Busca obras sociales por nombre o código
 */
export async function searchInsuranceCompanies(options: SearchInsuranceCompaniesOptions = {}) {
  const { query = "", limit = 20, offset = 0, isActive } = options;

  const conditions = [];

  if (query && query.length >= 2) {
    const searchTerm = `%${query}%`;
    conditions.push(
      or(
        ilike(insuranceCompanies.name, searchTerm),
        ilike(insuranceCompanies.code, searchTerm)
      )
    );
  }

  if (isActive !== undefined) {
    conditions.push(eq(insuranceCompanies.isActive, isActive));
  }

  const results = await db
    .select()
    .from(insuranceCompanies)
    .where(conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(insuranceCompanies.createdAt));

  return results;
}

/**
 * Obtiene una obra social por su ID
 */
export async function getInsuranceCompanyById(id: string) {
  if (!isValidUUID(id)) {
    return null;
  }

  const [company] = await db
    .select()
    .from(insuranceCompanies)
    .where(eq(insuranceCompanies.id, id))
    .limit(1);

  return company || null;
}

/**
 * Obtiene todas las obras sociales con paginación
 */
export async function getAllInsuranceCompanies(options: SearchInsuranceCompaniesOptions = {}) {
  const { query = "", limit = 50, offset = 0, isActive } = options;

  if (query || isActive !== undefined) {
    return searchInsuranceCompanies(options);
  }

  const results = await db
    .select()
    .from(insuranceCompanies)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(insuranceCompanies.createdAt));

  return results;
}

/**
 * Crea una nueva obra social
 */
export async function createInsuranceCompany(data: typeof insuranceCompanies.$inferInsert) {
  try {
    const [newCompany] = await db
      .insert(insuranceCompanies)
      .values({
        ...data,
        isActive: data.isActive ?? true,
        updatedAt: new Date(),
      })
      .returning();

    return { success: true, data: newCompany };
  } catch (error: any) {
    console.error("Error al crear obra social:", error);
    return { success: false, error: "Error al crear la obra social. Por favor, intente nuevamente." };
  }
}

/**
 * Actualiza una obra social existente
 */
export async function updateInsuranceCompany(
  id: string,
  data: Partial<typeof insuranceCompanies.$inferInsert>
) {
  if (!isValidUUID(id)) {
    return { success: false, error: "ID de obra social inválido" };
  }

  try {
    const [updatedCompany] = await db
      .update(insuranceCompanies)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(insuranceCompanies.id, id))
      .returning();

    if (!updatedCompany) {
      return { success: false, error: "Obra social no encontrada" };
    }

    return { success: true, data: updatedCompany };
  } catch (error: any) {
    console.error("Error al actualizar obra social:", error);
    return { success: false, error: "Error al actualizar la obra social. Por favor, intente nuevamente." };
  }
}

/**
 * Elimina una obra social
 */
export async function deleteInsuranceCompany(id: string) {
  if (!isValidUUID(id)) {
    return { success: false, error: "ID de obra social inválido" };
  }

  try {
    const [deletedCompany] = await db
      .delete(insuranceCompanies)
      .where(eq(insuranceCompanies.id, id))
      .returning();

    if (!deletedCompany) {
      return { success: false, error: "Obra social no encontrada" };
    }

    return { success: true };
  } catch (error: any) {
    // Manejar errores de clave foránea (si hay pacientes asociados)
    if (error?.code === "23503") {
      return { success: false, error: "No se puede eliminar la obra social porque tiene pacientes asociados" };
    }
    
    console.error("Error al eliminar obra social:", error);
    return { success: false, error: "Error al eliminar la obra social. Por favor, intente nuevamente." };
  }
}
