import type { RouteConfig } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

// Using file-based routing convention
// Files in app/routes/ will automatically become routes
export default flatRoutes() satisfies RouteConfig;
