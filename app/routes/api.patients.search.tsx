import type { Route } from "./+types/api.patients.search";
import { searchPatients } from "~/lib/patients.server";
import { requireAuthApi } from "~/lib/middleware";

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

  if (query.length < 2) {
    return Response.json({ patients: [] });
  }

  let searchOptions: Parameters<typeof searchPatients>[0] = {
    query,
    limit: 10, // Limitar a 10 resultados para autocompletado
    filter: filter as "all" | "name" | "document" | "hc" | "insurance",
  };

  const patients = await searchPatients(searchOptions);

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
