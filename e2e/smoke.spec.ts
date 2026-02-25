import { test, expect } from "@playwright/test";

/**
 * Smoke E2E: recorre rutas principales y comprueba que no haya error 500
 * ni página en blanco/rota. Las rutas que requieren login pueden redirigir
 * a /login (302/200), eso se considera OK.
 *
 * Ejecutar con la app corriendo: npm run dev (en otra terminal)
 *   npm run test:e2e
 */

const RUTAS = [
  { path: "/", name: "Inicio" },
  { path: "/login", name: "Login" },
  { path: "/dashboard", name: "Dashboard" },
  { path: "/dashboard/agenda", name: "Agenda" },
  { path: "/dashboard/medicos", name: "Médicos" },
  { path: "/dashboard/pool-atencion", name: "Pool de atención" },
  { path: "/dashboard/listados/turnos", name: "Listado turnos" },
  { path: "/dashboard/administracion/agenda/consultorio", name: "Consultorios" },
  { path: "/dashboard/administracion/web/institucion", name: "Institución" },
  { path: "/dashboard/administracion/pacientes/obras-sociales", name: "Obras sociales" },
];

for (const { path, name } of RUTAS) {
  test(`ruta ${name} (${path}) responde y no está rota`, async ({ page }) => {
    const res = await page.goto(path, { waitUntil: "domcontentloaded", timeout: 15000 });
    expect(res?.status()).toBeLessThan(500);

    await expect(page.locator("body")).toBeVisible();

    const title = await page.title();
    expect(title?.length).toBeGreaterThan(0);
  });
}

test("página de login muestra formulario o contenido", async ({ page }) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).toBeVisible();
  const hasFormOrHeading = await page.locator("form, h1, h2, [role='heading']").first().isVisible().catch(() => false);
  expect(hasFormOrHeading).toBeTruthy();
});
