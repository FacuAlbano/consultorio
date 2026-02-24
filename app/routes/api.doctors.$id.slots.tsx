import type { Route } from "./+types/api.doctors.$id.slots";
import { requireAuth } from "~/lib/middleware";
import { getAvailableSlotsForDoctorAndDate } from "~/lib/doctor-agenda.server";
import { isValidUUID } from "~/lib/utils";

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireAuth(request);
  const { id } = params;
  const url = new URL(request.url);
  const date = url.searchParams.get("date") || "";

  if (!id || !isValidUUID(id)) {
    return Response.json({ error: "Médico inválido" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "Fecha inválida (use YYYY-MM-DD)" }, { status: 400 });
  }

  const slots = await getAvailableSlotsForDoctorAndDate(id, date);
  return Response.json({ slots });
}
