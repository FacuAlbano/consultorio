# Tests E2E (Playwright)

## Cómo ejecutar

1. **Instalar navegadores** (solo la primera vez):
   ```bash
   npx playwright install
   ```

2. **Arrancar la app** en otra terminal:
   ```bash
   npm run dev
   ```

3. **Ejecutar tests**:
   ```bash
   npm run test:e2e
   ```
   O con interfaz: `npm run test:e2e:ui`

Si la app corre en otro puerto:
```bash
BASE_URL=http://localhost:3000 npm run test:e2e
```

## Qué hace el smoke E2E

- Visita cada ruta principal (/, /login, /dashboard, agenda, médicos, listados, administración, etc.).
- Comprueba que la respuesta no sea error 500 y que la página tenga contenido (body visible, título).
- Si algo falla, el reporte indica qué ruta y en qué navegador.

Reporte HTML tras fallos: `npx playwright show-report playwright-report`
