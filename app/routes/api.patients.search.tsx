import type { Route } from "./+types/api.patients.search";
import { searchPatients } from "~/lib/patients.server";
import { requireAuthApi } from "~/lib/middleware";
import { calculateAge } from "~/lib/utils";

/**
 * API route para búsqueda de pacientes
 * Retorna resultados en formato JSON para autocompletado
 * Requiere autenticación
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Verificar autenticación
  await requireAuthApi(request);

  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const filter = url.searchParams.get("filter") || "all";

  // Búsqueda por DNI: permitir desde 1 carácter cuando el filtro es documento
  const minLength = filter === "document" ? 1 : 2;
  if (query.trim().length < minLength) {
    return Response.json({ patients: [] });
  }

  let searchOptions: Parameters<typeof searchPatients>[0] = {
    query,
    limit: 10, // Limitar a 10 resultados para autocompletado
    filter: filter as "all" | "name" | "document" | "hc" | "insurance",
  };

  const patients = await searchPatients(searchOptions);

  // Formatear resultados para el autocompletado (incluir datos filiatorios: edad, teléfono)
  const formattedResults = patients.map((patient) => {
    const age = calculateAge(patient.birthDate);
    return {
      id: patient.id,
      label: `${patient.firstName} ${patient.lastName}`,
      documentNumber: patient.documentNumber,
      medicalRecordNumber: patient.medicalRecordNumber,
      insuranceCompany: patient.insuranceCompany,
      insuranceNumber: patient.insuranceNumber,
      birthDate: patient.birthDate,
      age: age ?? undefined,
      phone: patient.phone ?? undefined,
      fullInfo: `${patient.firstName} ${patient.lastName} - DNI: ${patient.documentNumber}${patient.medicalRecordNumber ? ` - HC: ${patient.medicalRecordNumber}` : ""}`,
    };
  });

  return Response.json({ patients: formattedResults });
}
