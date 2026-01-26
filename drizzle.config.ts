import type { Config } from "drizzle-kit";
import { config } from "dotenv";

// Cargar variables de entorno desde .env
config();

export default {
  schema: "./app/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
