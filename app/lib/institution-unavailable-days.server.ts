import { db } from "~/db/client";
import { institutionUnavailableDays } from "~/db/schema";
import { eq, gte, lte, and, desc } from "drizzle-orm";
import { isValidUUID } from "~/lib/utils";

/**
 * Obtiene los días no laborables de la institución
 */
export async function getInstitutionUnavailableDays(
  startDate?: string,
  endDate?: string
) {
  let whereCondition;

  if (startDate && endDate) {
    whereCondition = and(
      gte(institutionUnavailableDays.date, startDate),
      lte(institutionUnavailableDays.date, endDate)
    );
  } else if (startDate) {
    whereCondition = gte(institutionUnavailableDays.date, startDate);
  } else if (endDate) {
    whereCondition = lte(institutionUnavailableDays.date, endDate);
  }

  const results = await db
    .select()
    .from(institutionUnavailableDays)
    .where(whereCondition)
    .orderBy(desc(institutionUnavailableDays.date));

  return results;
}

/**
 * Agrega un día no laborable para la institución
 */
export async function addInstitutionUnavailableDay(
  date: string,
  reason?: string
) {
  try {
    const [newUnavailableDay] = await db
      .insert(institutionUnavailableDays)
      .values({
        date,
        reason,
      })
      .returning();

    return { success: true, data: newUnavailableDay };
  } catch (error: any) {
    // Manejar errores de restricción única (día duplicado)
    if (error?.code === "23505") {
      return { success: false, error: "Este día ya está marcado como no laborable" };
    }
    
    console.error("Error al agregar día no laborable:", error);
    return { success: false, error: "Error al agregar el día no laborable. Por favor, intente nuevamente." };
  }
}

/**
 * Elimina un día no laborable
 */
export async function removeInstitutionUnavailableDay(id: string) {
  if (!isValidUUID(id)) {
    return { success: false, error: "ID inválido" };
  }

  try {
    const [deletedDay] = await db
      .delete(institutionUnavailableDays)
      .where(eq(institutionUnavailableDays.id, id))
      .returning();

    if (!deletedDay) {
      return { success: false, error: "Día no laborable no encontrado" };
    }

    return { success: true };
  } catch (error: any) {
    // Manejar errores de clave foránea
    if (error?.code === "23503") {
      return { success: false, error: "No se puede eliminar el día no laborable porque tiene datos relacionados" };
    }
    
    console.error("Error al eliminar día no laborable:", error);
    return { success: false, error: "Error al eliminar el día no laborable. Por favor, intente nuevamente." };
  }
}
