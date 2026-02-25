import { redirect } from "react-router";
import type { Route } from "./+types/pacientes.$id";
import { requireAuth } from "~/lib/middleware";
import { PATHS } from "~/lib/constants";

/** Redirige /pacientes/:id al perfil dentro del dashboard (mismo layout y botón volver) */
export async function loader({ request, params }: Route.LoaderArgs) {
  await requireAuth(request);
  const { id } = params;
  if (!id) throw new Response("ID de paciente no proporcionado", { status: 400 });
  throw redirect(PATHS.patientProfile(id));
}

export default function PacientesIdRedirect() {
  return null;
}