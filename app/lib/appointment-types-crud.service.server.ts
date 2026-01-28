import { createAppointmentType, updateAppointmentType, deleteAppointmentType } from "./appointment-types.server";
import type { appointmentTypes } from "~/db/schema";

type AppointmentTypeInsert = typeof appointmentTypes.$inferInsert;

function validateAppointmentTypeData(data: Partial<AppointmentTypeInsert>, isUpdate: boolean = false): string[] {
  const errors: string[] = [];

  if (isUpdate) {
    if ("name" in data) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push("El nombre es obligatorio");
      }
    }
    if ("duration" in data) {
      if (!data.duration || data.duration.trim().length === 0) {
        errors.push("La duración es obligatoria");
      }
    }
  } else {
    if (!data.name || data.name.trim().length === 0) {
      errors.push("El nombre es obligatorio");
    }
    if (!data.duration || data.duration.trim().length === 0) {
      errors.push("La duración es obligatoria");
    }
  }

  return errors;
}

function extractAppointmentTypeData(formData: FormData): Partial<AppointmentTypeInsert> {
  const data: Partial<AppointmentTypeInsert> = {};

  if (formData.has("name")) {
    const value = formData.get("name") as string;
    data.name = value && value.trim().length > 0 ? value.trim() : undefined;
  }
  if (formData.has("description")) {
    const value = formData.get("description") as string;
    data.description = value && value.trim().length > 0 ? value.trim() : undefined;
  }
  if (formData.has("duration")) {
    const value = formData.get("duration") as string;
    data.duration = value && value.trim().length > 0 ? value.trim() : undefined;
  }

  return data;
}

export class AppointmentTypeCRUDService {
  static async createAppointmentType({ formData }: { formData: FormData }) {
    const data = extractAppointmentTypeData(formData);
    const errors = validateAppointmentTypeData(data);

    if (errors.length > 0) {
      return { success: false, error: errors[0] };
    }

    const result = await createAppointmentType(data as AppointmentTypeInsert);

    if (!result.success) {
      return { success: false, error: result.error || "Error al crear el tipo de turno" };
    }

    return { success: true, data: result.data };
  }

  static async updateAppointmentType({
    appointmentTypeId,
    formData,
  }: {
    appointmentTypeId: string;
    formData: FormData;
  }) {
    const data = extractAppointmentTypeData(formData);
    const errors = validateAppointmentTypeData(data, true);

    if (errors.length > 0) {
      return { success: false, error: errors[0] };
    }

    const result = await updateAppointmentType(appointmentTypeId, data);

    if (!result.success) {
      return { success: false, error: result.error || "Error al actualizar el tipo de turno" };
    }

    return { success: true, data: result.data };
  }

  static async deleteAppointmentType({ appointmentTypeId }: { appointmentTypeId: string }) {
    const result = await deleteAppointmentType(appointmentTypeId);

    if (!result.success) {
      return { success: false, error: result.error || "Error al eliminar el tipo de turno" };
    }

    return { success: true };
  }
}
