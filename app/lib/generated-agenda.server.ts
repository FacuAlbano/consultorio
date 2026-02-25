import { db } from "~/db/client";
import { generatedAgendaBlocks } from "~/db/schema";
import { eq, and, gte, lte, asc, inArray } from "drizzle-orm";
import { isValidUUID } from "~/lib/utils";

export type MorningAfternoonBlock = {
  startTime: string; // "HH:MM"
  endTime: string;
  durationMinutes: number;
  forWebBooking: boolean;
  availableOnSave: boolean;
};

export type GenerateAgendaInput = {
  doctorId: string;
  appointmentTypeId?: string | null;
  dateFrom: string;
  dateTo: string;
  daysOfWeek: number[]; // 1=lunes .. 7=domingo, vacío = todos
  morning: MorningAfternoonBlock | null;
  afternoon: MorningAfternoonBlock | null;
};

/** Día de la semana (1-7) para una fecha ISO */
function getDayOfWeek(dateStr: string): number {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  return day === 0 ? 7 : day;
}

function normTime(t: string): string {
  const s = String(t).trim().slice(0, 5);
  const [h, m] = s.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "";
  const hh = Math.min(23, Math.max(0, h));
  const mm = Math.min(59, Math.max(0, m));
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`;
}

/**
 * Genera bloques de agenda para el rango de fechas y días de la semana indicados.
 * Inserta en generated_agenda_blocks. Si ya existen bloques para (doctorId, date, period), los reemplaza.
 */
export async function generateAgendaBlocks(input: GenerateAgendaInput): Promise<{ success: boolean; count: number; error?: string }> {
  const { doctorId, appointmentTypeId, dateFrom, dateTo, daysOfWeek, morning, afternoon } = input;
  if (!isValidUUID(doctorId)) return { success: false, count: 0, error: "Médico inválido" };
  if (!morning && !afternoon) return { success: false, count: 0, error: "Indique al menos Mañana o Tarde" };
  if (!dateFrom || !dateTo) return { success: false, count: 0, error: "Fecha Desde y Fecha Hasta son obligatorias" };
  if (dateFrom > dateTo) return { success: false, count: 0, error: "Fecha Desde debe ser anterior a Fecha Hasta" };
  
  const daysDiff = Math.floor((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > 180) return { success: false, count: 0, error: "El rango de fechas no puede ser mayor a 180 días" };

  const start = new Date(dateFrom + "T12:00:00");
  const end = new Date(dateTo + "T12:00:00");
  let count = 0;
  const toInsert: typeof generatedAgendaBlocks.$inferInsert[] = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    const dow = getDayOfWeek(dateStr);
    if (daysOfWeek.length > 0 && !daysOfWeek.includes(dow)) continue;

    if (morning && morning.startTime && morning.endTime && morning.durationMinutes > 0) {
      const startNorm = normTime(morning.startTime);
      const endNorm = normTime(morning.endTime);
      if (startNorm && endNorm && startNorm < endNorm) {
        toInsert.push({
          doctorId,
          appointmentTypeId: appointmentTypeId || null,
          date: dateStr,
          period: "morning",
          startTime: startNorm,
          endTime: endNorm,
          durationMinutes: String(Math.min(120, Math.max(5, morning.durationMinutes))),
          forWebBooking: morning.forWebBooking,
          availableOnSave: morning.availableOnSave,
        });
        count++;
      }
    }
    if (afternoon && afternoon.startTime && afternoon.endTime && afternoon.durationMinutes > 0) {
      const startNorm = normTime(afternoon.startTime);
      const endNorm = normTime(afternoon.endTime);
      if (startNorm && endNorm && startNorm < endNorm) {
        toInsert.push({
          doctorId,
          appointmentTypeId: appointmentTypeId || null,
          date: dateStr,
          period: "afternoon",
          startTime: startNorm,
          endTime: endNorm,
          durationMinutes: String(Math.min(120, Math.max(5, afternoon.durationMinutes))),
          forWebBooking: afternoon.forWebBooking,
          availableOnSave: afternoon.availableOnSave,
        });
        count++;
      }
    }
  }

  if (toInsert.length === 0) return { success: false, count: 0, error: "No hay días en el rango que coincidan con los filtros" };

  const deleteConditions = toInsert.map(row => 
    and(
      eq(generatedAgendaBlocks.doctorId, row.doctorId),
      eq(generatedAgendaBlocks.date, row.date),
      eq(generatedAgendaBlocks.period, row.period)
    )
  );
  
  await db.transaction(async (tx) => {
    for (const condition of deleteConditions) {
      await tx.delete(generatedAgendaBlocks).where(condition);
    }
    
    await tx.insert(generatedAgendaBlocks).values(toInsert);
  });

  return { success: true, count };
}

export type ListAgendaBlocksFilters = {
  doctorId?: string;
  dateFrom?: string;
  dateTo?: string;
  timeFrom?: string;
  timeTo?: string;
  appointmentTypeId?: string;
  forWebBooking?: boolean;
  availableOnSave?: boolean;
};

/**
 * Lista bloques de agenda generada con filtros opcionales
 */
export async function listGeneratedAgendaBlocks(filters: ListAgendaBlocksFilters = {}) {
  const { doctorId, dateFrom, dateTo, timeFrom, timeTo, appointmentTypeId } = filters;
  const conditions = [];
  if (doctorId && isValidUUID(doctorId)) conditions.push(eq(generatedAgendaBlocks.doctorId, doctorId));
  if (dateFrom) conditions.push(gte(generatedAgendaBlocks.date, dateFrom));
  if (dateTo) conditions.push(lte(generatedAgendaBlocks.date, dateTo));
  if (appointmentTypeId && isValidUUID(appointmentTypeId)) conditions.push(eq(generatedAgendaBlocks.appointmentTypeId, appointmentTypeId));

  const { doctors, appointmentTypes } = await import("~/db/schema");
  const blocks = await db
    .select({
      block: generatedAgendaBlocks,
      doctor: {
        id: doctors.id,
        firstName: doctors.firstName,
        lastName: doctors.lastName,
      },
      appointmentType: {
        id: appointmentTypes.id,
        name: appointmentTypes.name,
      },
    })
    .from(generatedAgendaBlocks)
    .innerJoin(doctors, eq(generatedAgendaBlocks.doctorId, doctors.id))
    .leftJoin(appointmentTypes, eq(generatedAgendaBlocks.appointmentTypeId, appointmentTypes.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(generatedAgendaBlocks.date), asc(generatedAgendaBlocks.startTime));

  let result = blocks;
  if (timeFrom || timeTo) {
    const fromM = timeFrom ? timeToMinutes(timeFrom) : 0;
    const toM = timeTo ? timeToMinutes(timeTo) : 24 * 60;
    result = result.filter((r) => {
      const startM = timeToMinutes(String(r.block.startTime).slice(0, 5));
      return startM >= fromM && startM <= toM;
    });
  }
  if (filters.forWebBooking !== undefined) result = result.filter((r) => r.block.forWebBooking === filters.forWebBooking);
  if (filters.availableOnSave !== undefined) result = result.filter((r) => r.block.availableOnSave === filters.availableOnSave);
  return result;
}

function timeToMinutes(t: string): number {
  const [h, m] = String(t).slice(0, 5).split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * Devuelve los slots (HH:MM) de disponibilidad para un médico en una fecha
 * a partir de los bloques generados por "Crear Agenda Propia".
 * Si no hay bloques para esa fecha, devuelve [] (para usar luego horario semanal).
 */
export async function getSlotsFromGeneratedBlocksForDoctorAndDate(
  doctorId: string,
  dateStr: string
): Promise<string[]> {
  if (!isValidUUID(doctorId)) return [];
  const { buildSlotsBetween } = await import("~/lib/doctor-agenda.server");
  const blocks = await listGeneratedAgendaBlocks({
    doctorId,
    dateFrom: dateStr,
    dateTo: dateStr,
  });
  const allSlots: string[] = [];
  const seen = new Set<string>();
  for (const { block } of blocks) {
    const start = String(block.startTime).slice(0, 5);
    const end = String(block.endTime).slice(0, 5);
    const duration = Math.min(120, Math.max(5, Number(block.durationMinutes) || 15));
    const slots = buildSlotsBetween(start, end, duration);
    for (const s of slots) {
      if (!seen.has(s)) {
        seen.add(s);
        allSlots.push(s);
      }
    }
  }
  allSlots.sort();
  return allSlots;
}

/**
 * Actualiza forWebBooking y/o availableOnSave de un bloque
 */
export async function updateGeneratedAgendaBlock(
  blockId: string,
  data: { forWebBooking?: boolean; availableOnSave?: boolean }
): Promise<{ success: boolean; error?: string }> {
  if (!isValidUUID(blockId)) return { success: false, error: "ID inválido" };
  await db
    .update(generatedAgendaBlocks)
    .set({
      ...(data.forWebBooking !== undefined && { forWebBooking: data.forWebBooking }),
      ...(data.availableOnSave !== undefined && { availableOnSave: data.availableOnSave }),
    })
    .where(eq(generatedAgendaBlocks.id, blockId));
  return { success: true };
}

/**
 * Elimina un bloque de agenda generada por ID
 */
export async function deleteGeneratedAgendaBlock(blockId: string): Promise<{ success: boolean; error?: string }> {
  if (!isValidUUID(blockId)) return { success: false, error: "ID inválido" };
  await db.delete(generatedAgendaBlocks).where(eq(generatedAgendaBlocks.id, blockId));
  return { success: true };
}

/**
 * Elimina varios bloques por IDs
 */
export async function deleteGeneratedAgendaBlocksByIds(blockIds: string[]): Promise<{ success: boolean; deleted: number; error?: string }> {
  const validIds = blockIds.filter((id) => isValidUUID(id));
  if (validIds.length === 0) return { success: true, deleted: 0 };
  await db.delete(generatedAgendaBlocks).where(inArray(generatedAgendaBlocks.id, validIds));
  return { success: true, deleted: validIds.length };
}
