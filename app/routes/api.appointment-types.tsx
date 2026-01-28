import type { Route } from "./+types/api.appointment-types";
import { requireAuth } from "~/lib/middleware";
import { getAllAppointmentTypes } from "~/lib/appointment-types.server";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);

  const appointmentTypes = await getAllAppointmentTypes({ limit: 100 });

  return appointmentTypes;
}
