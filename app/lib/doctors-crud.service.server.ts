import type { FormData as ReactRouterFormData } from "react-router";
import { createDoctor, updateDoctor, deleteDoctor } from "./doctors.server";
import type { doctors } from "~/db/schema";

type DoctorInsert = typeof doctors.$inferInsert;

/**
 * Valida los datos de un médico
 */
function validateDoctorData(data: Partial<DoctorInsert>): string[] {
  const errors: string[] = [];

  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.push("El nombre es obligatorio");
  }

  if (!data.lastName || data.lastName.trim().length === 0) {
    errors.push("El apellido es obligatorio");
  }

  if (!data.documentNumber || data.documentNumber.trim().length === 0) {
    errors.push("El número de documento es obligatorio");
  }

  return errors;
}

/**
 * Extrae los datos del FormData para crear/actualizar un médico
 */
function extractDoctorData(formData: ReactRouterFormData): Partial<DoctorInsert> {
  return {
    firstName: (formData.get("firstName") as string) || undefined,
    lastName: (formData.get("lastName") as string) || undefined,
    documentNumber: (formData.get("documentNumber") as string) || undefined,
    documentType: (formData.get("documentType") as string) || "DNI",
    licenseNumber: (formData.get("licenseNumber") as string) || undefined,
    specialty: (formData.get("specialty") as string) || undefined,
    practice: (formData.get("practice") as string) || undefined,
    photoUrl: (formData.get("photoUrl") as string) || undefined,
    signatureUrl: (formData.get("signatureUrl") as string) || undefined,
    attentionTemplate: (formData.get("attentionTemplate") as string) || undefined,
    attentionWindowStart: (formData.get("attentionWindowStart") as string) || undefined,
    attentionWindowEnd: (formData.get("attentionWindowEnd") as string) || undefined,
  };
}

export class DoctorCRUDService {
  /**
   * Crea un nuevo médico
   */
  static async createDoctor({ formData }: { formData: ReactRouterFormData }) {
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
    formData: ReactRouterFormData;
  }) {
    const data = extractDoctorData(formData);
    const errors = validateDoctorData(data);

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
