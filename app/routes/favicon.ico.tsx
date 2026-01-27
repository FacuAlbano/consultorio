import type { Route } from "./+types/favicon.ico";

/**
 * Ruta para manejar el favicon.ico
 * Devuelve un 204 (No Content) para evitar errores en la consola
 */
export async function loader() {
  // Devolver un 204 No Content para que el navegador no muestre error
  return new Response(null, {
    status: 204,
    headers: {
      "Content-Type": "image/x-icon",
    },
  });
}
