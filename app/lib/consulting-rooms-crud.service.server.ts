import { createConsultingRoom, updateConsultingRoom, deleteConsultingRoom } from "./consulting-rooms.server";
import type { consultingRooms } from "~/db/schema";

type ConsultingRoomInsert = typeof consultingRooms.$inferInsert;

function validateConsultingRoomData(data: Partial<ConsultingRoomInsert>, isUpdate: boolean = false): string[] {
  const errors: string[] = [];

  if (isUpdate) {
    if ("name" in data) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push("El nombre es obligatorio");
      }
    }
  } else {
    if (!data.name || data.name.trim().length === 0) {
      errors.push("El nombre es obligatorio");
    }
  }

  return errors;
}

function extractConsultingRoomData(formData: FormData): Partial<ConsultingRoomInsert> {
  const data: Partial<ConsultingRoomInsert> = {};

  if (formData.has("name")) {
    const value = formData.get("name") as string;
    data.name = value && value.trim().length > 0 ? value.trim() : undefined;
  }
  if (formData.has("description")) {
    const value = formData.get("description") as string;
    data.description = value && value.trim().length > 0 ? value.trim() : undefined;
  }

  return data;
}

export class ConsultingRoomCRUDService {
  static async createConsultingRoom({ formData }: { formData: FormData }) {
    const data = extractConsultingRoomData(formData);
    const errors = validateConsultingRoomData(data);

    if (errors.length > 0) {
      return { success: false, error: errors[0] };
    }

    const result = await createConsultingRoom(data as ConsultingRoomInsert);

    if (!result.success) {
      return { success: false, error: result.error || "Error al crear el consultorio" };
    }

    return { success: true, data: result.data };
  }

  static async updateConsultingRoom({
    consultingRoomId,
    formData,
  }: {
    consultingRoomId: string;
    formData: FormData;
  }) {
    const data = extractConsultingRoomData(formData);
    const errors = validateConsultingRoomData(data, true);

    if (errors.length > 0) {
      return { success: false, error: errors[0] };
    }

    const result = await updateConsultingRoom(consultingRoomId, data);

    if (!result.success) {
      return { success: false, error: result.error || "Error al actualizar el consultorio" };
    }

    return { success: true, data: result.data };
  }

  static async deleteConsultingRoom({ consultingRoomId }: { consultingRoomId: string }) {
    const result = await deleteConsultingRoom(consultingRoomId);

    if (!result.success) {
      return { success: false, error: result.error || "Error al eliminar el consultorio" };
    }

    return { success: true };
  }
}
