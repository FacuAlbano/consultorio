// Cargar variables de entorno PRIMERO antes de cualquier importación
import { config } from "dotenv";
import { resolve } from "path";

// Cargar .env desde la raíz del proyecto
config({ path: resolve(process.cwd(), ".env") });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { tokens } from "../app/db/schema";
import { hashToken } from "../app/lib/token-hash";
import { eq } from "drizzle-orm";

// Crear cliente de base de datos
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("La variable de entorno DATABASE_URL no está configurada");
}

const client = postgres(connectionString, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
  connect_timeout: 10,
});

const db = drizzle(client);

/**
 * Script para crear un token encriptado en la base de datos
 */
async function createToken() {
  try {
    const type = "Developer";
    const passwordPlain = "falbano.106";

    // Verificar si ya existe un token con este type
    const existingToken = await db
      .select()
      .from(tokens)
      .where(eq(tokens.type, type))
      .limit(1);

    if (existingToken.length > 0) {
      console.log(`⚠️  Ya existe un token con type "${type}". Eliminando el anterior...`);
      await db.delete(tokens).where(eq(tokens.type, type));
    }

    // Hashear la contraseña
    console.log("🔐 Hasheando contraseña...");
    const hashedPassword = await hashToken(passwordPlain);

    // Insertar el token en la base de datos
    console.log("💾 Insertando token en la base de datos...");
    await db.insert(tokens).values({
      type: type,
      token: hashedPassword,
    });

    console.log("✅ Token creado exitosamente!");
    console.log(`   Type: ${type}`);
    console.log(`   Contraseña: ${passwordPlain}`);
    console.log(`   Hash: ${hashedPassword.substring(0, 50)}...`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error al crear token:", error);
    process.exit(1);
  }
}

createToken();
