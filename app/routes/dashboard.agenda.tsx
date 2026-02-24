import { Outlet } from "react-router";
import type { Route } from "./+types/dashboard.agenda";
import { requireAuth } from "~/lib/middleware";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  return {};
}

/**
 * Layout para la sección Agenda. Las rutas hijas (Agenda de Turnos, Crear, Editar, etc.)
 * se renderizan en <Outlet />.
 */
export default function AgendaLayout() {
  return <Outlet />;
}
