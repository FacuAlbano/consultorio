import { useLoaderData, Outlet } from "react-router";
import type { Route } from "./+types/dashboard.pacientes.$id";
import { getPatientById } from "~/lib/patients.server";
import { requireAuth } from "~/lib/middleware";
import { isValidUUID } from "~/lib/utils";

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireAuth(request);
  const { id } = params;

  if (!id) {
    throw new Response("ID de paciente no proporcionado", { status: 400 });
  }

  if (!isValidUUID(id)) {
    throw new Response("ID de paciente inválido", { status: 400 });
  }

  const patient = await getPatientById(id);

  if (!patient) {
    throw new Response("Paciente no encontrado", { status: 404 });
  }

  return { patient };
}

/**
 * Layout del perfil de paciente: valida el id y renderiza la ruta hija
 * (_index = perfil, editar = formulario de edición).
 */
export default function DashboardPatientProfileLayout() {
  useLoaderData<typeof loader>();
  return <Outlet />;
}
