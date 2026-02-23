import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteLoaderData,
} from "react-router";
import * as React from "react";

import type { Route } from "./+types/root";
import "./app.css";

// Polyfill para Buffer en el navegador (necesario para la librería xlsx)
if (typeof window !== "undefined" && typeof (globalThis as any).Buffer === "undefined") {
  // Polyfill simple de Buffer para el navegador
  const BufferPolyfill = class {
    static from(data: any, encoding?: string): Uint8Array {
      if (typeof data === "string") {
        const encoder = new TextEncoder();
        return encoder.encode(data);
      }
      if (Array.isArray(data)) {
        return new Uint8Array(data);
      }
      if (data instanceof ArrayBuffer) {
        return new Uint8Array(data);
      }
      return new Uint8Array(0);
    }
    static isBuffer(obj: any): boolean {
      return obj instanceof Uint8Array;
    }
  };
  (globalThis as any).Buffer = BufferPolyfill;
  (window as any).Buffer = BufferPolyfill;
}

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap",
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  // Leer el tema desde las cookies
  const cookieHeader = request.headers.get("Cookie");
  const themeCookie = cookieHeader
    ?.split(";")
    .find((c) => c.trim().startsWith("theme="))
    ?.split("=")[1]
    ?.trim();

  // Si no existe la cookie, usar "light" por defecto (no podemos detectar la preferencia del sistema en SSR)
  const theme = themeCookie === "dark" ? "dark" : "light";

  const forwardedHost = request.headers.get("X-Forwarded-Host");
  const forwardedProto = request.headers.get("X-Forwarded-Proto");
  const origin = forwardedHost && forwardedProto
    ? `${forwardedProto}://${forwardedHost}`
    : new URL(request.url).origin;
  return { theme, origin };
}

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: "Consultorio - Sistema de Gestión" },
    { name: "description", content: "Sistema de gestión de consultorio médico" },
  ];
}

function OgAndTwitterMeta() {
  const data = useRouteLoaderData<typeof loader>("root");
  const origin = data?.origin ?? "";
  const imageUrl = origin ? `${origin}/clinica.png` : "/clinica.png";
  return (
    <>
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Consultorio - Sistema de Gestión" />
      <meta property="og:description" content="Sistema de gestión de consultorio médico" />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:secure_url" content={imageUrl} />
      <meta property="og:url" content={origin} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Consultorio - Sistema de Gestión" />
      <meta name="twitter:description" content="Sistema de gestión de consultorio médico" />
      <meta name="twitter:image" content={imageUrl} />
    </>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <OgAndTwitterMeta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { theme } = useLoaderData<typeof loader>();
  
  // Aplicar la clase del tema al elemento html inmediatamente (SSR + hidratación del cliente)
  React.useLayoutEffect(() => {
    const html = document.documentElement;
    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [theme]);
  
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "¡Oops!";
  let details = "Ocurrió un error inesperado.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "La página solicitada no se pudo encontrar."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
