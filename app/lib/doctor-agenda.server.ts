import { db } from "~/db/client";
import { doctors, doctorWeeklySchedule, doctorUnavailableDays } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { isValidUUID } from "~/lib/utils";

const DAYS_OF_WEEK = ["1", "2", "3", "4", "5", "6", "7"] as const; // 1=lunes .. 7=domingo

export type DaySchedule = {
  dayOfWeek: string;
  startTime: string; // "HH:MM" o "HH:MM:SS"
  endTime: string;
};

/**
 * Obtiene la agenda semanal de un médico (qué días trabaja y horario)
 */
export async function getDoctorWeeklySchedule(doctorId: string): Promise<DaySchedule[]> {
  if (!isValidUUID(doctorId)) return [];
  const rows = await db
    .select({
      dayOfWeek: doctorWeeklySchedule.dayOfWeek,
      startTime: doctorWeeklySchedule.startTime,
      endTime: doctorWeeklySchedule.endTime,
    })
    .from(doctorWeeklySchedule)
    .where(eq(doctorWeeklySchedule.doctorId, doctorId));
  return rows.map((r) => ({
    dayOfWeek: r.dayOfWeek,
    startTime: String(r.startTime).slice(0, 5),
    endTime: String(r.endTime).slice(0, 5),
  }));
}

/**
 * Intervalo de turnos en minutos del médico (default 15)
 */
export async function getDoctorSlotDurationMinutes(doctorId: string): Promise<number> {
  if (!isValidUUID(doctorId)) return 15;
  const [doc] = await db
    .select({ slotDurationMinutes: doctors.slotDurationMinutes })
    .from(doctors)
    .where(eq(doctors.id, doctorId))
    .limit(1);
  if (!doc?.slotDurationMinutes) return 15;
  const n = Number(doc.slotDurationMinutes);
  return Number.isFinite(n) && n >= 5 && n <= 120 ? n : 15;
}

/**
 * Guarda la agenda semanal del médico. Reemplaza toda la configuración.
 */
export async function setDoctorWeeklySchedule(
  doctorId: string,
  schedules: DaySchedule[],
  slotDurationMinutes: number
): Promise<{ success: boolean; error?: string }> {
  if (!isValidUUID(doctorId)) return { success: false, error: "Médico inválido" };
  const slot = Math.min(120, Math.max(5, Math.round(slotDurationMinutes)));
  
  const validSchedules = [];
  for (const s of schedules) {
    const day = DAYS_OF_WEEK.includes(s.dayOfWeek as any) ? s.dayOfWeek : null;
    if (!day) continue;
    const start = normTime(s.startTime);
    const end = normTime(s.endTime);
    if (!start || !end || start >= end) continue;
    validSchedules.push({
      dayOfWeek: day,
      startTime: start + (start.length === 5 ? ":00" : ""),
      endTime: end + (end.length === 5 ? ":00" : ""),
    });
  }
  
  if (validSchedules.length === 0) {
    return { success: false, error: "No hay horarios válidos. Verifique que la hora de inicio sea menor a la hora de fin." };
  }
  
  await db.update(doctors).set({ slotDurationMinutes: String(slot), updatedAt: new Date() }).where(eq(doctors.id, doctorId));
  await db.delete(doctorWeeklySchedule).where(eq(doctorWeeklySchedule.doctorId, doctorId));
  
  for (const schedule of validSchedules) {
    await db.insert(doctorWeeklySchedule).values({
      doctorId,
      ...schedule,
    });
  }
  
  return { success: true };
}

function normTime(t: string): string {
  const s = String(t).trim().slice(0, 8);
  const match = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return "";
  const h = Math.min(23, Math.max(0, parseInt(match[1], 10)));
  const m = Math.min(59, Math.max(0, parseInt(match[2], 10)));
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Dado una fecha ISO (YYYY-MM-DD), devuelve día de semana 1-7 (lunes=1, domingo=7)
 */
function getDayOfWeekFromDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay(); // 0=domingo .. 6=sábado
  return String(day === 0 ? 7 : day);
}

/**
 * Verifica si el médico tiene ese día como no laborable (fecha concreta)
 */
export async function isDoctorUnavailableOnDate(doctorId: string, dateStr: string): Promise<boolean> {
  if (!isValidUUID(doctorId)) return true;
  const condition = and(
    eq(doctorUnavailableDays.doctorId, doctorId),
    eq(doctorUnavailableDays.date, dateStr)
  );
  const [row] = await db
    .select({ id: doctorUnavailableDays.id })
    .from(doctorUnavailableDays)
    .where(condition)
    .limit(1);
  return !!row;
}

/**
 * Genera los slots de hora (HH:MM) para un médico en una fecha.
 * Usa la agenda semanal y excluye días no laborables del médico.
 */
export async function getAvailableSlotsForDoctorAndDate(
  doctorId: string,
  dateStr: string
): Promise<string[]> {
  const unavailable = await isDoctorUnavailableOnDate(doctorId, dateStr);
  if (unavailable) return [];
  const dayOfWeek = getDayOfWeekFromDate(dateStr);
  const scheduleRows = await db
    .select({ startTime: doctorWeeklySchedule.startTime, endTime: doctorWeeklySchedule.endTime })
    .from(doctorWeeklySchedule)
    .where(
      and(eq(doctorWeeklySchedule.doctorId, doctorId), eq(doctorWeeklySchedule.dayOfWeek, dayOfWeek))
    )
    .limit(1);
  if (scheduleRows.length === 0) return [];
  const start = String(scheduleRows[0].startTime).slice(0, 5);
  const end = String(scheduleRows[0].endTime).slice(0, 5);
  const interval = await getDoctorSlotDurationMinutes(doctorId);
  return buildSlotsBetween(start, end, interval);
}

/**
 * Slots que el médico trabaja en esa fecha: primero desde bloques generados (Crear Agenda Propia),
 * si no hay, desde la agenda semanal. Así la vista Día muestra todo el rango horario con o sin turnos.
 */
export async function getSlotsForDoctorAndDate(
  doctorId: string,
  dateStr: string
): Promise<string[]> {
  const { getSlotsFromGeneratedBlocksForDoctorAndDate } = await import("~/lib/generated-agenda.server");
  const fromBlocks = await getSlotsFromGeneratedBlocksForDoctorAndDate(doctorId, dateStr);
  if (fromBlocks.length > 0) return fromBlocks;
  return getAvailableSlotsForDoctorAndDate(doctorId, dateStr);
}

export function buildSlotsBetween(start: string, end: string, intervalMinutes: number): string[] {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let startM = sh * 60 + sm;
  const endM = eh * 60 + em;
  const slots: string[] = [];
  while (startM < endM) {
    const h = Math.floor(startM / 60);
    const m = startM % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    startM += intervalMinutes;
  }
  return slots;
}
