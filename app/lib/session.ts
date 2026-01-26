import { createCookieSessionStorage } from "react-router";
import { PATHS } from "./constants";

// Usar process.env en contexto del servidor, fallback para HMR del lado del cliente
const getEnvVar = (key: string, defaultValue: string): string => {
  try {
    if (typeof process !== "undefined" && process.env) {
      return process.env[key] || defaultValue;
    }
  } catch {
    // Ignorar errores durante HMR
  }
  // Fallback para el lado del cliente (no debería pasar en producción, pero ayuda con HMR)
  return defaultValue;
};

const sessionSecret = getEnvVar("SESSION_SECRET", "default-secret-change-in-production");

try {
  if (sessionSecret === "default-secret-change-in-production" && typeof process !== "undefined") {
  console.warn("⚠️  Usando secreto de sesión por defecto. ¡Configura SESSION_SECRET en .env para producción!");
  }
} catch {
  // Ignorar durante HMR
}

let isProduction = false;
try {
  isProduction = typeof process !== "undefined" && process.env
    ? process.env.NODE_ENV === "production"
    : false;
} catch {
  // Ignorar durante HMR
}

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__consultorio_session",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: PATHS.root,
    sameSite: "lax",
    secrets: [sessionSecret],
    secure: isProduction,
  },
});

export async function getSession(request: Request) {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}

export async function createUserSession(tokenType: string, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set("tokenType", tokenType);
  return {
    redirect: redirectTo,
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  };
}

export async function logout(request: Request) {
  const session = await getSession(request);
  return {
    redirect: PATHS.login,
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  };
}

export async function requireAuth(request: Request) {
  const session = await getSession(request);
  const tokenType = session.get("tokenType");

  if (!tokenType) {
    throw new Response("Unauthorized", { status: 401 });
  }

  return { tokenType: tokenType as string };
}
