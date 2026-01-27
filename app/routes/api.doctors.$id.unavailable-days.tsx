import type { Route } from "./+types/api.doctors.$id.unavailable-days";
import { requireAuth } from "~/lib/middleware";
import { getDoctorUnavailableDays } from "~/lib/doctors.server";
import { isValidUUID } from "~/lib/utils";

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireAuth(request);
  const { id } = params;

  if (!id || !isValidUUID(id)) {
    return Response.json({ error: "ID inválido" }, { status: 400 });
  }

  const unavailableDays = await getDoctorUnavailableDays(id);
  return Response.json(unavailableDays);
}
