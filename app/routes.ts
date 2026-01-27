import type { RouteConfig } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

// Usando la convención de routing basado en archivos
// Los archivos en app/routes/ se convertirán automáticamente en rutas
export default flatRoutes({
  // Ignorar archivos que empiezan con punto (para evitar problemas con .well-known)
  ignore: [
    "**/.DS_Store",
    "**/node_modules/**",
    "**/.well-known/**", // Ignorar completamente las rutas .well-known
  ],
}) satisfies RouteConfig;
