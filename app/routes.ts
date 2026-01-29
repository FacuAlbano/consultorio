import type { RouteConfig } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

// Usando la convención de routing basado en archivos
// Los archivos en app/routes/ se convertirán automáticamente en rutas
export default flatRoutes({
  // Archivos de ruta a ignorar (evitar .well-known y otros)
  ignoredRouteFiles: [
    "**/.DS_Store",
    "**/node_modules/**",
    "**/.well-known/**",
  ],
}) satisfies RouteConfig;
