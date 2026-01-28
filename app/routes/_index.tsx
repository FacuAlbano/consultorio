import { redirect } from "react-router";
import type { Route } from "./+types/_index";
import { getSession } from "~/lib/session";
import { PATHS } from "~/lib/constants";

/**
 * Ruta raíz que redirige al dashboard si está autenticado,
 * o al login si no lo está
 */
export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  const tokenType = session.get("tokenType");

  if (tokenType) {
    // Si está autenticado, redirigir al dashboard
    return redirect(PATHS.dashboard);
  } else {
    // Si no está autenticado, redirigir al login
    return redirect(PATHS.login);
  }
}
