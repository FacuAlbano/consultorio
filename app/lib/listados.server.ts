/**
 * Lógica centralizada de loaders y actions para listados del dashboard.
 * Tipos válidos: control | agenda | turnos | pacientes | pacientes-atendidos |
 * pacientes-os | pacientes-no-atendidos | turnos-anulados | gestion-disponibilidad
 */

import { requireAuth } from "~/lib/middleware";
import { getAppointments, getAppointmentById, createAppointment, updateAppointment, cancelAppointment, deleteAppointment } from "~/lib/appointments.server";
import { getPatientsCount, searchPatients, getAllPatients, getPatientById, createPatient, updatePatient, deletePatient, getPatientByDocument } from "~/lib/patients.server";
import { getAllDoctors } from "~/lib/doctors.server";
import { getAllInsuranceCompanies } from "~/lib/insurance-companies.server";
import { getAllConsultingRooms } from "~/lib/consulting-rooms.server";
import { getAllAppointmentTypes } from "~/lib/appointment-types.server";
import { db } from "~/db/client";
import { doctorUnavailableDays } from "~/db/schema";
import { gte, sql } from "drizzle-orm";
import { getTodayLocalISO } from "~/lib/utils";
import type { Patient } from "~/db/schema";

export const LISTADO_TIPOS = [
  "control",
  "agenda",
  "turnos",
  "pacientes",
  "pacientes-atendidos",
  "pacientes-os",
  "pacientes-no-atendidos",
  "turnos-anulados",
  "gestion-disponibilidad",
] as const;

export type ListadoTipo = (typeof LISTADO_TIPOS)[number];

export function isValidListadoTipo(tipo: string): tipo is ListadoTipo {
  return LISTADO_TIPOS.includes(tipo as ListadoTipo);
}

const INTENTS_PACIENTES = { create: "create", update: "update", delete: "delete" } as const;
const INTENTS_TURNOS = { create: "create", update: "update", cancel: "cancel", delete: "delete" } as const;

export async function loadListado(request: Request, tipo: ListadoTipo) {
  await requireAuth(request);
  const url = new URL(request.url);

  switch (tipo) {
    case "control": {
      const today = getTodayLocalISO();
      const [turnosHoy, totalPacientes] = await Promise.all([
        getAppointments({ date: today, limit: 500 }),
        getPatientsCount(),
      ]);
      const turnosProgramados = turnosHoy.filter((t) => t.appointment.status === "scheduled").length;
      const turnosAtendidos = turnosHoy.filter((t) => t.appointment.status === "attended").length;
      const turnosCancelados = turnosHoy.filter((t) => t.appointment.status === "cancelled").length;
      const noAsistieron = turnosHoy.filter((t) => t.appointment.status === "no_show").length;
      return {
        turnosHoy: turnosHoy.length,
        turnosProgramados,
        turnosAtendidos,
        turnosCancelados,
        noAsistieron,
        totalPacientes,
      };
    }

    case "agenda": {
      const date = url.searchParams.get("date") || getTodayLocalISO();
      const doctorId = url.searchParams.get("doctorId") || "";
      if (!doctorId) {
        return { appointments: [], doctors: await getAllDoctors({ limit: 100 }), date, doctorId: "" };
      }
      const appointments = await getAppointments({ date, doctorId, limit: 200 });
      const doctors = await getAllDoctors({ limit: 100 });
      return { appointments, doctors, date, doctorId };
    }

    case "turnos": {
      const date = url.searchParams.get("date") || "";
      const doctorId = url.searchParams.get("doctorId") || "";
      const status = url.searchParams.get("status") || "";
      const appointmentId = url.searchParams.get("appointment") || "";
      const [appointments, doctors, consultingRooms, appointmentTypes, appointmentToEdit, patients] = await Promise.all([
        getAppointments({
          date: date || undefined,
          doctorId: doctorId || undefined,
          status: status || undefined,
          limit: 200,
        }),
        getAllDoctors({ limit: 100 }),
        getAllConsultingRooms({ limit: 50 }),
        getAllAppointmentTypes({ limit: 50 }),
        appointmentId && /^[0-9a-f-]{36}$/i.test(appointmentId) ? getAppointmentById(appointmentId) : Promise.resolve(null),
        getAllPatients({ limit: 200 }),
      ]);
      return {
        appointments,
        doctors,
        date,
        doctorId,
        status,
        consultingRooms,
        appointmentTypes,
        appointmentToEdit,
        patients,
      };
    }

    case "pacientes": {
      const query = url.searchParams.get("q") || "";
      const filter = (url.searchParams.get("filter") as "all" | "name" | "document" | "hc" | "insurance") || "all";
      const patientId = url.searchParams.get("patient") || "";
      let patients: Patient[];
      if (query.trim().length >= (filter === "document" ? 1 : 2)) {
        patients = await searchPatients({ query: query.trim(), limit: 100, filter });
      } else {
        patients = await getAllPatients({ limit: 100 });
      }
      const insuranceCompanies = await getAllInsuranceCompanies({ limit: 200 });
      const patientToEdit =
        patientId && /^[0-9a-f-]{36}$/i.test(patientId) ? await getPatientById(patientId) : null;
      return { patients, query, filter, insuranceCompanies, patientToEdit };
    }

    case "pacientes-atendidos": {
      const date = url.searchParams.get("date") || "";
      const doctorId = url.searchParams.get("doctorId") || "";
      const appointments = await getAppointments({
        status: "attended",
        date: date || undefined,
        doctorId: doctorId || undefined,
        limit: 200,
      });
      const doctors = await getAllDoctors({ limit: 100 });
      return { appointments, doctors, date, doctorId };
    }

    case "pacientes-os": {
      const insuranceCompany = url.searchParams.get("insuranceCompany") || "";
      const date = url.searchParams.get("date") || "";
      const [appointmentsForStats, insuranceCompanies] = await Promise.all([
        getAppointments({
          status: "attended",
          insuranceCompany: insuranceCompany || undefined,
          date: date || undefined,
          limit: 2000,
        }),
        getAllInsuranceCompanies({ limit: 200 }),
      ]);
      const appointments = appointmentsForStats.slice(0, 200);
      const statsByOS: { obraSocial: string; cantidad: number }[] = [];
      const map = new Map<string, number>();
      for (const { patient } of appointmentsForStats) {
        const os = (patient as { insuranceCompany?: string })?.insuranceCompany ?? "Sin obra social";
        map.set(os, (map.get(os) ?? 0) + 1);
      }
      map.forEach((cantidad, obraSocial) => statsByOS.push({ obraSocial, cantidad }));
      statsByOS.sort((a, b) => b.cantidad - a.cantidad);
      const totalAtendidos = statsByOS.reduce((acc, r) => acc + r.cantidad, 0);
      const top3 = statsByOS.slice(0, 3);
      const top3Sum = top3.reduce((acc, r) => acc + r.cantidad, 0);
      const top3Percent = totalAtendidos > 0 ? Math.round((top3Sum / totalAtendidos) * 100) : 0;
      return {
        appointments,
        insuranceCompanies,
        insuranceCompany,
        date,
        statsByOS,
        statsSummary: { totalAtendidos, cantidadOS: statsByOS.length, top3Percent },
      };
    }

    case "pacientes-no-atendidos": {
      const date = url.searchParams.get("date") || "";
      const doctorId = url.searchParams.get("doctorId") || "";
      const appointments = await getAppointments({
        status: "no_show",
        date: date || undefined,
        doctorId: doctorId || undefined,
        limit: 200,
      });
      const doctors = await getAllDoctors({ limit: 100 });
      return { appointments, doctors, date, doctorId };
    }

    case "turnos-anulados": {
      const date = url.searchParams.get("date") || "";
      const dateFrom = url.searchParams.get("dateFrom") || "";
      const dateTo = url.searchParams.get("dateTo") || "";
      const doctorId = url.searchParams.get("doctorId") || "";
      const options: Parameters<typeof getAppointments>[0] = {
        status: "cancelled",
        doctorId: doctorId || undefined,
        limit: 500,
      };
      if (date) options.date = date;
      else {
        if (dateFrom) options.dateFrom = dateFrom;
        if (dateTo) options.dateTo = dateTo;
      }
      const appointments = await getAppointments(options);
      const doctors = await getAllDoctors({ limit: 100 });
      const total = appointments.length;
      const byDoctor: { doctorName: string; count: number }[] = [];
      const byDoctorMap = new Map<string, number>();
      for (const { doctor } of appointments) {
        const name = doctor ? `${doctor.firstName} ${doctor.lastName}` : "Sin médico";
        byDoctorMap.set(name, (byDoctorMap.get(name) ?? 0) + 1);
      }
      byDoctorMap.forEach((count, doctorName) => byDoctor.push({ doctorName, count }));
      byDoctor.sort((a, b) => b.count - a.count);
      return {
        appointments,
        doctors,
        date,
        dateFrom,
        dateTo,
        doctorId,
        reportSummary: { total, byDoctor },
      };
    }

    case "gestion-disponibilidad": {
      const doctors = await getAllDoctors({ limit: 100 });
      const today = getTodayLocalISO();
      const totalCounts = await db
        .select({
          doctorId: doctorUnavailableDays.doctorId,
          unavailableCount: sql<number>`COUNT(*)::int`,
        })
        .from(doctorUnavailableDays)
        .groupBy(doctorUnavailableDays.doctorId);
      const futureCounts = await db
        .select({
          doctorId: doctorUnavailableDays.doctorId,
          futureUnavailable: sql<number>`COUNT(*)::int`,
        })
        .from(doctorUnavailableDays)
        .where(gte(doctorUnavailableDays.date, today))
        .groupBy(doctorUnavailableDays.doctorId);
      const byId: Record<string, { doctorId: string; unavailableCount: number; futureUnavailable: number }> = {};
      for (const item of totalCounts) {
        byId[item.doctorId] = { doctorId: item.doctorId, unavailableCount: item.unavailableCount, futureUnavailable: 0 };
      }
      for (const item of futureCounts) {
        if (byId[item.doctorId]) byId[item.doctorId].futureUnavailable = item.futureUnavailable;
      }
      return { doctors, byId };
    }

    default:
      throw new Response("Tipo de listado no válido", { status: 400 });
  }
}

export async function actionListado(request: Request, tipo: ListadoTipo) {
  await requireAuth(request);
  const formData = await request.formData();

  switch (tipo) {
    case "pacientes": {
      const intent = (formData.get("_intent") as string) || "";
      if (intent === INTENTS_PACIENTES.create) {
        const firstName = (formData.get("firstName") as string)?.trim();
        const lastName = (formData.get("lastName") as string)?.trim();
        const documentNumber = (formData.get("documentNumber") as string)?.trim();
        const documentType = (formData.get("documentType") as string) || "DNI";
        if (!firstName || !lastName || !documentNumber) {
          return { success: false, error: "Nombre, apellido y DNI son obligatorios" };
        }
        const existing = await getPatientByDocument(documentNumber);
        if (existing) return { success: false, error: "Ya existe un paciente con ese número de documento" };
        const result = await createPatient({
          firstName,
          lastName,
          documentNumber,
          documentType,
          phone: (formData.get("phone") as string)?.trim() || null,
          email: (formData.get("email") as string)?.trim() || null,
          medicalRecordNumber: (formData.get("medicalRecordNumber") as string)?.trim() || null,
          insuranceCompany: (formData.get("insuranceCompany") as string)?.trim() || null,
          insuranceNumber: (formData.get("insuranceNumber") as string)?.trim() || null,
        });
        if (!result.success) return { success: false, error: "Error al crear el paciente" };
        return { success: true, createdId: result.data!.id };
      }
      if (intent === INTENTS_PACIENTES.update) {
        const id = formData.get("patientId") as string;
        if (!id) return { success: false, error: "ID de paciente no proporcionado" };
        const firstName = (formData.get("firstName") as string)?.trim();
        const lastName = (formData.get("lastName") as string)?.trim();
        const documentNumber = (formData.get("documentNumber") as string)?.trim();
        const documentType = (formData.get("documentType") as string) || "DNI";
        if (!firstName || !lastName || !documentNumber) {
          return { success: false, error: "Nombre, apellido y DNI son obligatorios" };
        }
        const result = await updatePatient(id, {
          firstName,
          lastName,
          documentType,
          documentNumber,
          phone: (formData.get("phone") as string)?.trim() || null,
          email: (formData.get("email") as string)?.trim() || null,
          medicalRecordNumber: (formData.get("medicalRecordNumber") as string)?.trim() || null,
          insuranceCompany: (formData.get("insuranceCompany") as string)?.trim() || null,
          insuranceNumber: (formData.get("insuranceNumber") as string)?.trim() || null,
        });
        if (!result.success) return { success: false, error: result.error };
        return { success: true };
      }
      if (intent === INTENTS_PACIENTES.delete) {
        const id = formData.get("patientId") as string;
        if (!id) return { success: false, error: "ID no proporcionado" };
        const result = await deletePatient(id);
        if (!result.success) return { success: false, error: result.error };
        return { success: true, deleted: true };
      }
      return { success: false, error: "Acción no válida" };
    }

    case "pacientes-no-atendidos": {
      if (formData.get("intent") !== "updateNoShow") return { success: false, error: "Acción no válida" };
      const appointmentId = formData.get("appointmentId") as string;
      const noShowReason = (formData.get("noShowReason") as string) || null;
      const noShowFollowUp = (formData.get("noShowFollowUp") as string) || null;
      if (!appointmentId) return { success: false, error: "ID de turno requerido" };
      return updateAppointment(appointmentId, { noShowReason, noShowFollowUp });
    }

    case "turnos": {
      const intent = (formData.get("_intent") as string) || "";
      if (intent === INTENTS_TURNOS.create) {
        const patientId = formData.get("patientId") as string;
        const doctorId = (formData.get("doctorId") as string) || undefined;
        const consultingRoomId = (formData.get("consultingRoomId") as string) || undefined;
        const appointmentTypeId = (formData.get("appointmentTypeId") as string) || undefined;
        const appointmentDate = formData.get("appointmentDate") as string;
        const appointmentTime = formData.get("appointmentTime") as string;
        const notes = (formData.get("notes") as string)?.trim() || undefined;
        if (!patientId || !appointmentDate || !appointmentTime) {
          return { success: false, error: "Paciente, fecha y hora son obligatorios" };
        }
        const result = await createAppointment({
          patientId,
          doctorId: doctorId || null,
          consultingRoomId: consultingRoomId || null,
          appointmentTypeId: appointmentTypeId || null,
          appointmentDate,
          appointmentTime,
          notes,
          status: "scheduled",
          isOverbooking: false,
        });
        if (!result.success) return { success: false, error: result.error };
        return { success: true, createdId: result.data!.id };
      }
      if (intent === INTENTS_TURNOS.update) {
        const appointmentId = formData.get("appointmentId") as string;
        if (!appointmentId) return { success: false, error: "ID de turno no proporcionado" };
        const patientId = formData.get("patientId") as string;
        const doctorId = (formData.get("doctorId") as string) || undefined;
        const consultingRoomId = (formData.get("consultingRoomId") as string) || undefined;
        const appointmentTypeId = (formData.get("appointmentTypeId") as string) || undefined;
        const appointmentDate = formData.get("appointmentDate") as string;
        const appointmentTime = formData.get("appointmentTime") as string;
        const notes = (formData.get("notes") as string)?.trim() || undefined;
        if (!appointmentDate || !appointmentTime) return { success: false, error: "Fecha y hora son obligatorios" };
        const result = await updateAppointment(appointmentId, {
          patientId: patientId || undefined,
          doctorId: doctorId || null,
          consultingRoomId: consultingRoomId || null,
          appointmentTypeId: appointmentTypeId || null,
          appointmentDate,
          appointmentTime,
          notes,
        });
        if (!result.success) return { success: false, error: result.error };
        return { success: true };
      }
      if (intent === INTENTS_TURNOS.cancel) {
        const appointmentId = formData.get("appointmentId") as string;
        const notes = (formData.get("notes") as string)?.trim() || undefined;
        if (!appointmentId) return { success: false, error: "ID de turno no proporcionado" };
        const result = await cancelAppointment(appointmentId, notes);
        if (!result.success) return { success: false, error: result.error };
        return { success: true, cancelled: true };
      }
      if (intent === INTENTS_TURNOS.delete) {
        const appointmentId = formData.get("appointmentId") as string;
        if (!appointmentId) return { success: false, error: "ID de turno no proporcionado" };
        const result = await deleteAppointment(appointmentId);
        if (!result.success) return { success: false, error: result.error };
        return { success: true, deleted: true };
      }
      return { success: false, error: "Acción no válida" };
    }

    default:
      return { success: false, error: "Acción no válida para este listado" };
  }
}
