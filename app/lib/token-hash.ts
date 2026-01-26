import { hash, verify } from "argon2";

/**
 * Hashea un token/contraseña usando Argon2
 * @param token - El token o contraseña en texto plano
 * @returns El hash del token
 */
export async function hashToken(token: string): Promise<string> {
  return await hash(token);
}

/**
 * Verifica un token/contraseña contra un hash
 * @param hashedToken - El hash almacenado en la base de datos
 * @param plainToken - El token en texto plano a verificar
 * @returns true si el token coincide, false en caso contrario
 */
export async function verifyToken(hashedToken: string, plainToken: string): Promise<boolean> {
  try {
    return await verify(hashedToken, plainToken);
  } catch (error) {
    console.error("Error al verificar token:", error);
    return false;
  }
}
