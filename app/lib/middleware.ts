import { redirect } from "react-router";
import { getSession } from "./session";
import { PATHS } from "./constants";

/**
 * Middleware para proteger rutas que requieren autenticación
 * Retorna el tokenType si el usuario está autenticado, sino redirige al login
 */
export async function requireAuth(request: Request) {
  const session = await getSession(request);
  const tokenType = session.get("tokenType");

  if (!tokenType) {
    throw redirect(PATHS.login);
  }

  return { tokenType: tokenType as string };
}

/**
 * Middleware para rutas que solo deben ser accesibles si NO estás autenticado
 * (como login, register, etc.)
 */
export async function requireGuest(request: Request) {
  const session = await getSession(request);
  const tokenType = session.get("tokenType");

  if (tokenType) {
    throw redirect(PATHS.dashboard);
  }

  return {};
}
