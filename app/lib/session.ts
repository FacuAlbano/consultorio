import { createCookieSessionStorage } from "react-router";
import { PATHS } from "./constants";

// Use process.env in server context, fallback for client-side HMR
const getEnvVar = (key: string, defaultValue: string): string => {
  try {
    if (typeof process !== "undefined" && process.env) {
      return process.env[key] || defaultValue;
    }
  } catch {
    // Ignore errors during HMR
  }
  // Fallback for client-side (shouldn't happen in production, but helps with HMR)
  return defaultValue;
};

const sessionSecret = getEnvVar("SESSION_SECRET", "default-secret-change-in-production");

try {
  if (sessionSecret === "default-secret-change-in-production" && typeof process !== "undefined") {
  console.warn("⚠️  Using default session secret. Set SESSION_SECRET in .env for production!");
  }
} catch {
  // Ignore during HMR
}

let isProduction = false;
try {
  isProduction = typeof process !== "undefined" && process.env
    ? process.env.NODE_ENV === "production"
    : false;
} catch {
  // Ignore during HMR
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

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set("userId", userId);
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
  const userId = session.get("userId");

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  return { userId: userId as string };
}
