# Código No Utilizado - Análisis

## Funciones No Utilizadas

### 1. `removeAllDoctorAppointmentTypes`
**Archivo:** `app/lib/doctor-appointment-types.server.ts`
**Línea:** 100-110
**Razón:** Función creada pero nunca importada ni usada en ninguna ruta
**Recomendación:** Eliminar o mantener si se planea usar en el futuro

```typescript
export async function removeAllDoctorAppointmentTypes(doctorId: string) {
  // ... código
}
```

### 2. Funciones `getById` no utilizadas
Estas funciones están definidas pero nunca se importan ni usan:

- **`getConsultingRoomById`** - `app/lib/consulting-rooms.server.ts:41`
- **`getAppointmentTypeById`** - `app/lib/appointment-types.server.ts:41`
- **`getInstitutionById`** - `app/lib/institutions.server.ts:41`
- **`getInsuranceCompanyById`** - `app/lib/insurance-companies.server.ts:50`

**Recomendación:** Mantenerlas - son útiles para futuras funcionalidades (edición, detalles, etc.)

### 3. `getPatientByMedicalRecord`
**Archivo:** `app/lib/patients.server.ts`
**Línea:** 111
**Razón:** Función definida pero nunca importada ni usada
**Recomendación:** Mantener - puede ser útil para búsquedas por número de historia clínica

## Funciones Utilizadas Correctamente

✅ Todas las funciones de búsqueda (`search*`) se usan en las rutas de administración
✅ Todas las funciones CRUD se usan correctamente
✅ `getPatientByDocument` se usa en `dashboard.atender-sin-turno.tsx`
✅ Todas las funciones de appointments se usan
✅ Todas las funciones de doctors se usan

## Recomendaciones

### ✅ Eliminado:
1. ~~`removeAllDoctorAppointmentTypes`~~ - **ELIMINADO** - No se usaba y no era necesario (se eliminan uno por uno)

### Mantener (pueden ser útiles):
1. Funciones `getById` - Útiles para futuras funcionalidades de edición/detalles
2. `getPatientByMedicalRecord` - Útil para búsquedas avanzadas

## Resumen

- ✅ **1 función eliminada:** `removeAllDoctorAppointmentTypes`
- **4 funciones** `getById` que no se usan pero son útiles mantener (para futuras funcionalidades)
- **1 función** de búsqueda que no se usa pero es útil mantener (`getPatientByMedicalRecord`)

**Estado:** Código limpio - Solo quedan funciones útiles para futuras funcionalidades
