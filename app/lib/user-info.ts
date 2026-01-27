/**
 * Información del usuario para mostrar en la UI
 */
export interface UserInfo {
  userName: string;
  institutionName: string;
  clinicName: string;
}

/**
 * Obtiene la información del usuario basada en el tokenType
 * Por ahora retorna valores por defecto, pero puede extenderse para
 * obtener información de una tabla de usuarios en el futuro
 * 
 * @param tokenType Tipo de token del usuario autenticado
 * @returns Información del usuario
 */
export function getUserInfo(tokenType: string | null | undefined): UserInfo {
  // Si no hay tokenType, retornar valores por defecto genéricos
  if (!tokenType) {
    return {
      userName: "Usuario",
      institutionName: "Institución",
      clinicName: "Consultorio",
    };
  }

  // Por ahora, usar valores genéricos basados en el tokenType
  // En el futuro, esto puede consultar una tabla de usuarios
  // para obtener información específica de cada usuario
  
  // Mapeo básico (puede extenderse según necesidades)
  const userInfoMap: Record<string, UserInfo> = {
    // Ejemplo: si el tokenType es "Developer", usar estos valores
    // "Developer": {
    //   userName: "Nombre Usuario",
    //   institutionName: "Nombre Institución",
    //   clinicName: "Nombre Clínica",
    // },
  };

  // Si hay un mapeo específico, usarlo; sino, valores por defecto
  return userInfoMap[tokenType] || {
    userName: tokenType, // Usar el tokenType como nombre por defecto
    institutionName: "Institución",
    clinicName: "Consultorio",
  };
}
