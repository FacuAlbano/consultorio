import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";
import * as React from "react";

import type { Route } from "./+types/root";
import "./app.css";

// Polyfill for Buffer in browser (needed for xlsx library)
if (typeof window !== "undefined" && typeof (globalThis as any).Buffer === "undefined") {
  // Simple Buffer polyfill for browser
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
  // Read theme from cookies
  const cookieHeader = request.headers.get("Cookie");
  const themeCookie = cookieHeader
    ?.split(";")
    .find((c) => c.trim().startsWith("theme="))
    ?.split("=")[1]
    ?.trim();

  // If no cookie exists, default to "light" (we can't detect system preference in SSR)
  const theme = themeCookie === "dark" ? "dark" : "light";

  return { theme };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
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
  
  // Apply theme class to html element immediately (SSR + client hydration)
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
