import { createDoctor, updateDoctor, deleteDoctor } from "./doctors.server";
import type { doctors } from "~/db/schema";

type DoctorInsert = typeof doctors.$inferInsert;

/**
 * Valida los datos de un médico
 * @param data Datos del médico a validar
 * @param isUpdate Si es true, solo valida los campos presentes (actualización parcial)
 */
function validateDoctorData(data: Partial<DoctorInsert>, isUpdate: boolean = false): string[] {
  const errors: string[] = [];

  // En actualizaciones parciales, solo validar los campos que están presentes
  if (isUpdate) {
    // Si firstName está presente en el objeto (fue incluido en el FormData), debe ser válido
    // Usamos 'in' operator para verificar si la propiedad existe, no solo si tiene valor
    if ("firstName" in data) {
      if (!data.firstName || data.firstName.trim().length === 0) {
        errors.push("El nombre es obligatorio");
      }
    }

    // Si lastName está presente en el objeto (fue incluido en el FormData), debe ser válido
    if ("lastName" in data) {
      if (!data.lastName || data.lastName.trim().length === 0) {
        errors.push("El apellido es obligatorio");
      }
    }

    // Si documentNumber está presente en el objeto (fue incluido en el FormData), debe ser válido
    if ("documentNumber" in data) {
      if (!data.documentNumber || data.documentNumber.trim().length === 0) {
        errors.push("El número de documento es obligatorio");
      }
    }
  } else {
    // En creación, todos los campos obligatorios deben estar presentes
    if (!data.firstName || data.firstName.trim().length === 0) {
      errors.push("El nombre es obligatorio");
    }

    if (!data.lastName || data.lastName.trim().length === 0) {
      errors.push("El apellido es obligatorio");
    }

    if (!data.documentNumber || data.documentNumber.trim().length === 0) {
      errors.push("El número de documento es obligatorio");
    }
  }

  return errors;
}

/**
 * Extrae los datos del FormData para crear/actualizar un médico
 * Solo incluye campos que están presentes en el FormData para permitir actualizaciones parciales
 * Los campos vacíos se convierten en undefined para permitir limpiar campos opcionales
 * 
 * IMPORTANTE: Solo incluye campos que están explícitamente presentes en el FormData.
 * Si un campo no está en el FormData, no se incluye en el objeto retornado (no se establece como undefined).
 */
function extractDoctorData(formData: FormData): Partial<DoctorInsert> {
  const data: Partial<DoctorInsert> = {};

  // Solo incluir campos que están presentes en el FormData
  // Convertir cadenas vacías a undefined para permitir limpiar campos opcionales
  // Si un campo no está presente, simplemente no se incluye (no se establece como undefined)
  if (formData.has("firstName")) {
    const value = formData.get("firstName") as string;
    data.firstName = value && value.trim().length > 0 ? value.trim() : undefined;
  }
  if (formData.has("lastName")) {
    const value = formData.get("lastName") as string;
    data.lastName = value && value.trim().length > 0 ? value.trim() : undefined;
  }
  if (formData.has("documentNumber")) {
    const value = formData.get("documentNumber") as string;
    data.documentNumber = value && value.trim().length > 0 ? value.trim() : undefined;
  }
  if (formData.has("documentType")) {
    data.documentType = (formData.get("documentType") as string) || "DNI";
  } else if (formData.has("firstName") || formData.has("lastName") || formData.has("documentNumber")) {
    // Si hay campos de identificación, establecer documentType por defecto
    data.documentType = "DNI";
  }
  if (formData.has("licenseNumber")) {
    const value = formData.get("licenseNumber") as string;
    data.licenseNumber = value && value.trim().length > 0 ? value.trim() : undefined;
  }
  if (formData.has("specialty")) {
    const value = formData.get("specialty") as string;
    data.specialty = value && value.trim().length > 0 ? value.trim() : undefined;
  }
  if (formData.has("practice")) {
    const value = formData.get("practice") as string;
    data.practice = value && value.trim().length > 0 ? value.trim() : undefined;
  }
  if (formData.has("photoUrl")) {
    const value = formData.get("photoUrl") as string;
    data.photoUrl = value && value.trim().length > 0 ? value.trim() : undefined;
  }
  if (formData.has("signatureUrl")) {
    const value = formData.get("signatureUrl") as string;
    data.signatureUrl = value && value.trim().length > 0 ? value.trim() : undefined;
  }
  if (formData.has("attentionTemplate")) {
    const value = formData.get("attentionTemplate") as string;
    data.attentionTemplate = value && value.trim().length > 0 ? value.trim() : undefined;
  }
  if (formData.has("attentionWindowStart")) {
    const value = formData.get("attentionWindowStart") as string;
    data.attentionWindowStart = value && value.trim().length > 0 ? value.trim() : undefined;
  }
  if (formData.has("attentionWindowEnd")) {
    const value = formData.get("attentionWindowEnd") as string;
    data.attentionWindowEnd = value && value.trim().length > 0 ? value.trim() : undefined;
  }

  return data;
}

export class DoctorCRUDService {
  /**
   * Crea un nuevo médico
   */
  static async createDoctor({ formData }: { formData: FormData }) {
    const data = extractDoctorData(formData);
    const errors = validateDoctorData(data);

    if (errors.length > 0) {
      return { success: false, error: errors[0] };
    }

    const result = await createDoctor(data as DoctorInsert);

    if (!result.success) {
      return { success: false, error: "Error al crear el médico" };
    }

    return { success: true, data: result.data };
  }

  /**
   * Actualiza un médico existente
   */
  static async updateDoctor({
    doctorId,
    formData,
  }: {
    doctorId: string;
    formData: FormData;
  }) {
    const data = extractDoctorData(formData);
    // En actualizaciones, solo validar los campos presentes (actualización parcial)
    const errors = validateDoctorData(data, true);

    if (errors.length > 0) {
      return { success: false, error: errors[0] };
    }

    const result = await updateDoctor(doctorId, data);

    if (!result.success) {
      return { success: false, error: result.error || "Error al actualizar el médico" };
    }

    return { success: true, data: result.data };
  }

  /**
   * Elimina un médico
   */
  static async deleteDoctor({ doctorId }: { doctorId: string }) {
    const result = await deleteDoctor(doctorId);

    if (!result.success) {
      return { success: false, error: result.error || "Error al eliminar el médico" };
    }

    return { success: true };
  }
}
