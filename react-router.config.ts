import type { Config } from "@react-router/dev/config";

export default {
  // Opciones de configuración...
  // Renderizado del lado del servidor por defecto, para habilitar modo SPA establece esto en `false`
  ssr: true,
  // Ignorar rutas de .well-known y favicon en desarrollo
  future: {
    v3_fetcherPersist: true,
    v3_relativeSplatPath: true,
    v3_throwAbortReason: true,
  },
} satisfies Config;
