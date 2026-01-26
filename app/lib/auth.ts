import { db } from "~/db/client";
import { users } from "~/db/schema";
import { eq } from "drizzle-orm";
import { verify } from "argon2";

/**
 * Verifica las credenciales del usuario
 * Retorna el usuario si las credenciales son válidas, null en caso contrario
 */
export async function verifyCredentials(email: string, password: string) {
  try {
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (userResult.length === 0) {
      return null;
    }

    const user = userResult[0];

    if (!user.active) {
      return null;
    }

    const isValid = await verify(user.passwordHash, password);
    
    if (!isValid) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error verifying credentials:", error);
    return null;
  }
}
