# Guía de testing – Consultorio

Esta guía explica cómo ejecutar los tests del proyecto y qué detecta cada uno. Úsala cuando agregues nuevas funcionalidades para verificar que todo siga funcionando.

---

## 1. Resumen rápido

| Comando | Qué hace | Cuándo usarlo |
|--------|----------|----------------|
| `npm run test:smoke` | Typecheck + build | Antes de hacer commit o deploy |
| `npm run test:smoke:urls` | Lo anterior + pide las URLs principales | Con la app corriendo en otra terminal |
| `npm run test:e2e` | Playwright abre el navegador y visita rutas | Probar que las páginas carguen sin errores |
| `npm run test:e2e:ui` | Igual pero con interfaz gráfica | Depurar tests o ver qué hace cada uno |

---

## 2. Paso a paso para hacer los testeos

### 2.1 Smoke test (typecheck + build)

**Qué hace:** Verifica que el código compile (TypeScript sin errores) y que el build de producción termine bien.

```bash
npm run test:smoke
```

**Salida esperada:**
- `✓ Typecheck OK` → No hay errores de tipos.
- `✓ Build OK` → El build de Vite (cliente + servidor) terminó.
- Al final: `=== Smoke OK ===`

**Si falla:** Verás errores de TypeScript (archivo y línea) o errores del build. Hay que corregirlos antes de seguir.

**Avisos que pueden aparecer (y no hacen fallar el script):**
- `Error when using sourcemap for reporting an error` (calendar.tsx) → Aviso de source maps, se puede ignorar.
- `"Filter", "Image" and "List" are imported ... but never used` → Imports no usados de lucide-react; opcional limpiarlos.
- `(!) ... is dynamically imported ... but also statically imported` → Avisos de Vite sobre chunks; no impiden que el smoke pase.

---

### 2.2 Smoke test con URLs

**Qué hace:** Todo lo del smoke anterior y además hace **peticiones HTTP** a las rutas principales. Comprueba que el servidor responda (200, 302, etc.) y no devuelva 500.

**Requisito:** La app debe estar corriendo (por ejemplo con `npm run dev` en otra terminal).

**Pasos:**

1. En una terminal:
   ```bash
   npm run dev
   ```
   Debe quedar en `http://localhost:5173/` (o el puerto que indique).

2. En **otra** terminal:
   ```bash
   npm run test:smoke:urls
   ```

**Salida esperada (ejemplo):**
```
▶ Probando URLs (http://localhost:5173)...

  ✓ / → 302
  ✓ /login → 200
  ✓ /dashboard → 302
  ✓ /dashboard/agenda → 302
  ...
  ✓ Todas las URLs respondieron OK

=== Smoke OK ===
```

**Qué significan los códigos:**
- **200** → Página cargada correctamente.
- **302** → Redirección (ej. de `/dashboard` a `/login` si no hay sesión). Se considera OK.
- **500** → Error del servidor; el script falla y lista la URL que dio 500.

**Si la app corre en otro puerto:**
```bash
BASE_URL=http://localhost:3000 node scripts/smoke.mjs --urls
```

---

### 2.3 Tests E2E con Playwright

**Qué hace:** Abre un navegador (Chromium, Firefox, WebKit), visita las rutas definidas en `e2e/smoke.spec.ts` y comprueba que:
- La respuesta no sea error 500.
- El `body` sea visible.
- La página tenga título.

**Requisito:** La app corriendo (por ejemplo `npm run dev`).

**Primera vez:** instalar navegadores de Playwright:
```bash
npx playwright install
```

**Ejecutar todos los tests:**
```bash
npm run test:e2e
```

**Ejecutar con interfaz (recomendado para ver qué hace cada test):**
```bash
npm run test:e2e:ui
```

**Salida típica:** `33 passed` (11 rutas × 3 navegadores + 1 test de login). Si algo falla, Playwright indica qué ruta y en qué navegador.

**Ver reporte HTML después de un fallo:**
```bash
npx playwright show-report
```

---

## 3. ¿Qué encuentra y qué no encuentra?

| Problema | ¿Lo detecta el smoke / E2E? | Cómo |
|----------|-----------------------------|------|
| Errores de TypeScript | Sí | `test:smoke` hace `typecheck`; si hay errores, falla. |
| Build roto | Sí | `test:smoke` hace `build`; si falla, el script falla. |
| Rutas que devuelven 500 | Sí | `test:smoke:urls` y E2E comprueban que el status no sea 500. |
| Página en blanco o sin título | Parcial | E2E comprueba `body` visible y título; no analiza todo el contenido. |
| Error de conexión (servidor caído) | Sí (smoke:urls) | Si el servidor no está arriba, el `fetch` falla (timeout o conexión rechazada) y el script falla. |
| Bucle infinito en la app | No de forma directa | Los tests no “miden” bucles. Si una ruta entra en bucle, el test puede colgar hasta timeout; en ese caso verías que el test de esa ruta falla por timeout, no un mensaje explícito “bucle infinito”. |
| Errores de lógica (datos mal calculados, etc.) | No | Hacen comprobaciones básicas (status, body, título). No revisan lógica de negocio. |
| Errores en consola del navegador (JS) | No automático | Playwright puede configurarse para escuchar consola; en el smoke actual no lo hace. |

Resumen:
- **Conexión:** si el servidor no responde, `test:smoke:urls` falla (error de conexión/timeout).
- **Bucle infinito:** no hay un “detector de bucle”. Si una página hace un bucle y tarda mucho, el test E2E puede hacer timeout; eso te indica que “algo va mal en esa ruta”, y luego hay que depurar (p. ej. con la pestaña Network o con `test:e2e:ui`) para ver si es un bucle de requests.

---

## 4. Cuando agregues cosas nuevas

### 4.1 Nueva ruta o pantalla

Para que el smoke y E2E la tengan en cuenta:

1. **Smoke URLs**  
   Editar `scripts/smoke.mjs` y agregar la ruta al array `RUTAS_PRINCIPALES`, por ejemplo:
   ```js
   const RUTAS_PRINCIPALES = [
     "/",
     "/login",
     "/dashboard",
     "/dashboard/agenda",
     // ...
     "/dashboard/mi-nueva-ruta",  // ← agregar
   ];
   ```

2. **Playwright E2E**  
   Editar `e2e/smoke.spec.ts` y agregar un objeto en el array `RUTAS`:
   ```ts
   const RUTAS = [
     // ...
     { path: "/dashboard/mi-nueva-ruta", name: "Mi nueva pantalla" },
   ];
   ```
   No hace falta escribir un test nuevo; el bucle que recorre `RUTAS` ya generará un test por ruta.

### 4.2 Solo quiero comprobar que compila y construye

```bash
npm run test:smoke
```

No hace falta tener la app corriendo.

### 4.3 Quiero comprobar que las rutas responden (app en dev)

1. `npm run dev` en una terminal.
2. En otra: `npm run test:smoke:urls` o `npm run test:e2e` (o `test:e2e:ui`).

### 4.4 App levantada con el build (puerto 3000 u otro)

```bash
npm run build
npm run start
# En otra terminal:
BASE_URL=http://localhost:3000 npm run test:smoke:urls
# o
BASE_URL=http://localhost:3000 npm run test:e2e
```

---

## 5. Dónde está cada cosa

| Qué | Dónde |
|-----|--------|
| Script de smoke | `scripts/smoke.mjs` |
| Configuración Playwright | `playwright.config.ts` |
| Tests E2E (smoke de rutas) | `e2e/smoke.spec.ts` |
| Instrucciones cortas E2E | `e2e/README.md` |

---

## 6. Resumen de la salida que viste (terminals 12 y 13)

- **Terminal 12 (`npm run test:smoke`):**  
  Typecheck OK, build OK, y al final el mensaje de “probando URLs” no aparece porque no usaste `--urls`. El smoke pasó solo con typecheck + build.

- **Terminal 13 (`npm run test:smoke:urls`):**  
  Lo mismo que el 12 y además la fase “Probando URLs”. Cada línea tipo `✓ /dashboard/agenda → 302` significa: esa URL respondió con código 302 (redirección), que se considera correcto. “Todas las URLs respondieron OK” indica que ninguna devolvió 500 ni falló por conexión.

Los avisos (sourcemap, imports no usados, dynamic import) son warnings del build; el script no falla por ellos y puedes seguir usándolo así. Si quieres una salida más limpia, se pueden ir corrigiendo esos avisos por separado.

Si en el futuro implementas cosas nuevas, vuelve a esta guía y sigue los pasos de la sección 2 y, si añades rutas, la sección 4.1.
