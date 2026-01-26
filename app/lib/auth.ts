import { db } from "~/db/client";
import { tokens } from "~/db/schema";
import { verifyToken as verifyTokenHash } from "~/lib/token-hash";

/**
 * Verifica un token de autenticación
 * Busca en todos los tokens y verifica si alguno coincide con el token ingresado
 * Retorna el token si es válido, null en caso contrario
 */
export async function verifyTokenAuth(plainToken: string) {
  try {
    // Obtener todos los tokens de la base de datos
    const allTokens = await db.select().from(tokens);

    // Verificar cada token hasta encontrar uno que coincida
    for (const tokenRecord of allTokens) {
      const isValid = await verifyTokenHash(tokenRecord.token, plainToken);
      
      if (isValid) {
        return tokenRecord;
      }
    }

    // Si no se encontró ningún token válido
    return null;
  } catch (error) {
    console.error("Error al verificar token:", error);
    return null;
  }
}
