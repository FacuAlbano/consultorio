import type { Route } from "./+types/api.doctors.$id.appointment-types";
import { requireAuth } from "~/lib/middleware";
import { getDoctorAppointmentTypes } from "~/lib/doctor-appointment-types.server";

export async function loader({ params, request }: Route.LoaderArgs) {
  await requireAuth(request);
  const { id } = params;

  const appointmentTypes = await getDoctorAppointmentTypes(id);

  return appointmentTypes;
}
