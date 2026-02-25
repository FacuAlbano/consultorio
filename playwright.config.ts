import { defineConfig, devices } from "@playwright/test";

/**
 * Configuración de Playwright para tests E2E.
 * Ver https://playwright.dev/docs/test-configuration
 *
 * Ejecutar con la app corriendo (npm run dev en otra terminal):
 *   npx playwright test
 *   npx playwright test --ui
 *
 * O con servidor construido:
 *   npm run build && npm run start   # en otra terminal
 *   BASE_URL=http://localhost:3000 npx playwright test
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  timeout: 15000,
  expect: { timeout: 5000 },
});
