import type { Route } from "./+types/api.patients.search";
import { searchPatients } from "~/lib/patients.server";

/**
 * API route para búsqueda de pacientes
 * Retorna resultados en formato JSON para autocompletado
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";

  if (query.length < 2) {
    return Response.json({ patients: [] });
  }

  const patients = await searchPatients({
    query,
    limit: 10, // Limitar a 10 resultados para autocompletado
  });

  // Formatear resultados para el autocompletado
  const formattedResults = patients.map((patient) => ({
    id: patient.id,
    label: `${patient.firstName} ${patient.lastName}`,
    documentNumber: patient.documentNumber,
    medicalRecordNumber: patient.medicalRecordNumber,
    insuranceCompany: patient.insuranceCompany,
    fullInfo: `${patient.firstName} ${patient.lastName} - DNI: ${patient.documentNumber}${patient.medicalRecordNumber ? ` - HC: ${patient.medicalRecordNumber}` : ""}`,
  }));

  return Response.json({ patients: formattedResults });
}
