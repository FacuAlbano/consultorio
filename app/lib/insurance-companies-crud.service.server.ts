import { createInsuranceCompany, updateInsuranceCompany, deleteInsuranceCompany } from "./insurance-companies.server";
import type { insuranceCompanies } from "~/db/schema";

type InsuranceCompanyInsert = typeof insuranceCompanies.$inferInsert;

function validateInsuranceCompanyData(data: Partial<InsuranceCompanyInsert>, isUpdate: boolean = false): string[] {
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

function extractInsuranceCompanyData(formData: FormData): Partial<InsuranceCompanyInsert> {
  const data: Partial<InsuranceCompanyInsert> = {};

  if (formData.has("name")) {
    const value = formData.get("name") as string;
    data.name = value && value.trim().length > 0 ? value.trim() : undefined;
  }
  if (formData.has("code")) {
    const value = formData.get("code") as string;
    data.code = value && value.trim().length > 0 ? value.trim() : undefined;
  }
  if (formData.has("description")) {
    const value = formData.get("description") as string;
    data.description = value && value.trim().length > 0 ? value.trim() : undefined;
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
  // Los checkboxes desmarcados no se incluyen en FormData, así que isActive debe tratarse explícitamente
  data.isActive = formData.has("isActive");

  return data;
}

export class InsuranceCompanyCRUDService {
  static async createInsuranceCompany({ formData }: { formData: FormData }) {
    const data = extractInsuranceCompanyData(formData);
    const errors = validateInsuranceCompanyData(data);

    if (errors.length > 0) {
      return { success: false, error: errors[0] };
    }

    const result = await createInsuranceCompany(data as InsuranceCompanyInsert);

    if (!result.success) {
      return { success: false, error: result.error || "Error al crear la obra social" };
    }

    return { success: true, data: result.data };
  }

  static async updateInsuranceCompany({
    insuranceCompanyId,
    formData,
  }: {
    insuranceCompanyId: string;
    formData: FormData;
  }) {
    const data = extractInsuranceCompanyData(formData);
    const errors = validateInsuranceCompanyData(data, true);

    if (errors.length > 0) {
      return { success: false, error: errors[0] };
    }

    const result = await updateInsuranceCompany(insuranceCompanyId, data);

    if (!result.success) {
      return { success: false, error: result.error || "Error al actualizar la obra social" };
    }

    return { success: true, data: result.data };
  }

  static async deleteInsuranceCompany({ insuranceCompanyId }: { insuranceCompanyId: string }) {
    const result = await deleteInsuranceCompany(insuranceCompanyId);

    if (!result.success) {
      return { success: false, error: result.error || "Error al eliminar la obra social" };
    }

    return { success: true };
  }
}
