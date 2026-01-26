import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Instancia del cliente de base de datos
 * Utiliza la variable de entorno DATABASE_URL para conectarse a PostgreSQL
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("La variable de entorno DATABASE_URL no está configurada");
}

// Crear el cliente de postgres
// Supabase requiere SSL; agregamos la opción correspondiente
// Configurar timeouts para prevenir errores de statement timeout
// max: número máximo de conexiones en el pool (por defecto: 10)
// idle_timeout: cuánto tiempo puede estar inactiva una conexión antes de cerrarse (por defecto: 0 = nunca)
// max_lifetime: tiempo máximo de vida de una conexión (por defecto: 0 = para siempre)
// 
// IMPORTANTE: Supabase tiene un statement_timeout por defecto de 60 segundos.
// Si estás experimentando errores de "canceling statement due to statement timeout":
// 1. Aumenta el statement_timeout en el panel de Supabase:
//    - Ve a Settings > Database > Connection Pooling
//    - O ejecuta: ALTER DATABASE your_db SET statement_timeout = '120s';
// 2. Optimiza consultas lentas (asegúrate de que se usen índices)
// 3. Usa paginación para grandes conjuntos de datos
// 4. Verifica problemas de consultas N+1
const client = postgres(connectionString, {
  ssl: 'require',
  max: 10, // Número máximo de conexiones en el pool
  idle_timeout: 20, // Cerrar conexiones inactivas después de 20 segundos
  max_lifetime: 60 * 30, // Cerrar conexiones después de 30 minutos
  connect_timeout: 10, // Timeout de conexión en segundos (10 segundos)
});

// Crear la instancia de drizzle
export const db = drizzle(client, { schema });
