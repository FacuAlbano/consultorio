import { createInstitution, updateInstitution, deleteInstitution } from "./institutions.server";
import type { institutions } from "~/db/schema";

type InstitutionInsert = typeof institutions.$inferInsert;

function validateInstitutionData(data: Partial<InstitutionInsert>, isUpdate: boolean = false): string[] {
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

function extractInstitutionData(formData: FormData): Partial<InstitutionInsert> {
  const data: Partial<InstitutionInsert> = {};

  if (formData.has("name")) {
    const value = formData.get("name") as string;
    data.name = value && value.trim().length > 0 ? value.trim() : undefined;
  }
  if (formData.has("description")) {
    const value = formData.get("description") as string;
    data.description = value && value.trim().length > 0 ? value.trim() : undefined;
  }
  if (formData.has("address")) {
    const value = formData.get("address") as string;
    data.address = value && value.trim().length > 0 ? value.trim() : undefined;
  }
  if (formData.has("phone")) {
    const value = formData.get("phone") as string;
    data.phone = value && value.trim().length > 0 ? value.trim() : undefined;
  }
  if (formData.has("email")) {
    const value = formData.get("email") as string;
    data.email = value && value.trim().length > 0 ? value.trim() : undefined;
  }
  if (formData.has("website")) {
    const value = formData.get("website") as string;
    data.website = value && value.trim().length > 0 ? value.trim() : undefined;
  }
  if (formData.has("logoUrl")) {
    const value = formData.get("logoUrl") as string;
    data.logoUrl = value && value.trim().length > 0 ? value.trim() : undefined;
  }

  return data;
}

export class InstitutionCRUDService {
  static async createInstitution({ formData }: { formData: FormData }) {
    const data = extractInstitutionData(formData);
    const errors = validateInstitutionData(data);

    if (errors.length > 0) {
      return { success: false, error: errors[0] };
    }

    const result = await createInstitution(data as InstitutionInsert);

    if (!result.success) {
      return { success: false, error: result.error || "Error al crear la institución" };
    }

    return { success: true, data: result.data };
  }

  static async updateInstitution({
    institutionId,
    formData,
  }: {
    institutionId: string;
    formData: FormData;
  }) {
    const data = extractInstitutionData(formData);
    const errors = validateInstitutionData(data, true);

    if (errors.length > 0) {
      return { success: false, error: errors[0] };
    }

    const result = await updateInstitution(institutionId, data);

    if (!result.success) {
      return { success: false, error: result.error || "Error al actualizar la institución" };
    }

    return { success: true, data: result.data };
  }

  static async deleteInstitution({ institutionId }: { institutionId: string }) {
    const result = await deleteInstitution(institutionId);

    if (!result.success) {
      return { success: false, error: result.error || "Error al eliminar la institución" };
    }

    return { success: true };
  }
}
