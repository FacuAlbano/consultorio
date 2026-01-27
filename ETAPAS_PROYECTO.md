# Etapas del Proyecto - Sistema de Gestión de Consultorio Médico

## Etapa 1: Configuración Base y Autenticación
**Estado:** ✅ Completada

### 1.1 Configuración de Base de Datos
- [x] Conexión a Supabase PostgreSQL
- [x] Configuración de variables de entorno (.env)
- [x] Crear tabla `tokens` para autenticación
  ```typescript
  export const tokens = pgTable("tokens", {
    type: varchar("type", { length: 255 }).notNull(),
    token: varchar("token", { length: 500 }).notNull(),
  });
  ```
- [x] Ejecutar migraciones de base de datos (`npm run db:push`)

### 1.2 Sistema de Autenticación
- [x] Implementar login con tokens
- [x] Middleware de autenticación
- [x] Gestión de sesiones
- [x] Protección de rutas

---

## Etapa 2: Módulo de Inicio (Dashboard / Sistema de Gestión)
**Estado:** ⏳ Pendiente

### 2.1 Página Principal del Sistema
- [ ] Diseño con título "DIGITAL SALUD" (estilo destacado)
- [ ] Imagen de fondo con estetoscopio y elementos médicos
- [ ] Buscador principal de pacientes
  - [ ] Campo de búsqueda con placeholder "Haz tu busqueda por paciente..."
  - [ ] Búsqueda en tiempo real
  - [ ] Resultados de búsqueda
  - [ ] Acceso rápido a perfil del paciente desde resultados
- [ ] Accesos rápidos a funciones principales
  - [ ] Pool de Atención
  - [ ] Atender sin Turno
  - [ ] Gestión de Pacientes
  - [ ] Calendario
- [ ] Estadísticas generales (opcional)
  - [ ] Turnos del día
  - [ ] Pacientes pendientes
  - [ ] Resumen de actividad

### 2.2 Funcionalidades del Buscador
- [ ] Búsqueda por nombre de paciente
- [ ] Búsqueda por número de documento
- [ ] Búsqueda por número de historia clínica (HC)
- [ ] Búsqueda por obra social
- [ ] Autocompletado de resultados
- [ ] Historial de búsquedas recientes
- [ ] Filtros avanzados

---

## Etapa 3: Módulo de Médicos
**Estado:** ⏳ Pendiente

### 3.1 Pool de Atención
- [ ] Vista de turnos del día
- [ ] Tabla con columnas:
  - Hora Turno/Recepción
  - Sobre Turno
  - Médico/Práctica
  - HC/Nro. Documento
  - Paciente
  - Acciones
- [ ] Filtros por fecha (calendario)
- [ ] Filtros por médico
- [ ] Búsqueda de pacientes
- [ ] Acciones: Atender, Ver detalles, etc.

### 3.2 Atender sin Turno
- [ ] Formulario para atención sin cita previa
- [ ] Registro rápido de paciente
- [ ] Asignación de médico
- [ ] Generación de consulta

### 3.3 Gestión de Médicos
- [ ] CRUD de médicos
- [ ] Datos personales de médicos
- [ ] Días no laborables como profesional
- [ ] Foto del médico
- [ ] Plantilla de atención
- [ ] Registrar firma
- [ ] Ventana de tiempo de atención

---

## Etapa 4: Módulo de Administración de Recursos
**Estado:** ⏳ Pendiente

### 4.1 Recursos para Generación de Agenda
- [ ] Asignación de Consultorio
- [ ] Días no laborables
- [ ] Solicitar Tipo de Turno

### 4.2 Recursos para la Página Web
- [ ] Datos de Institución
- [ ] Tipos de Turnos

### 4.3 Recursos para Registro de Pacientes
- [ ] Obras Sociales de la Institución
- [ ] Solicitar Obra Social

### 4.4 Recursos para Médicos
- [ ] Datos Personales
- [ ] Días no Laborables como Profesional
- [ ] Foto
- [ ] Plantilla de Atención
- [ ] Registrar Firma
- [ ] Tipos de Turnos Asociados al Profesional
- [ ] Ventana de Tiempo de Atención

---

## Etapa 5: Módulo de Listados
**Estado:** ⏳ Pendiente

### 5.1 Control Institucional
- [ ] Reportes institucionales
- [ ] Estadísticas generales

### 5.2 Agenda del Profesional
- [ ] Vista de agenda por médico
- [ ] Calendario de turnos
- [ ] Gestión de disponibilidad

### 5.3 Facturación de Turnos Médicos
- [ ] Generación de facturas
- [ ] Control de pagos
- [ ] Reportes de facturación

### 5.4 Turnos de la Institución
- [ ] Vista general de turnos
- [ ] Filtros y búsquedas
- [ ] Gestión de turnos

### 5.5 Gestión de Pacientes
- [ ] Listado de pacientes
- [ ] Búsqueda y filtros
- [ ] Edición de datos

### 5.6 Pacientes Atendidos
- [ ] Listado de pacientes atendidos
- [ ] Filtros por fecha, médico, etc.
- [ ] Exportación de datos

### 5.7 Pacientes Atendidos por OS
- [ ] Filtro por obra social
- [ ] Reportes por obra social
- [ ] Estadísticas

### 5.8 Pacientes NO Atendidos
- [ ] Listado de inasistencias
- [ ] Motivos de no atención
- [ ] Seguimiento

### 5.9 Turnos Anulados
- [ ] Historial de turnos cancelados
- [ ] Motivos de cancelación
- [ ] Reportes

---

## Etapa 6: Módulo de Historia Clínica
**Estado:** ⏳ Pendiente

### 6.1 Gestión de Historia Clínica
- [ ] Crear/Editar historia clínica
- [ ] Vista de historial médico
- [ ] Búsqueda por HC/Nro. Documento
- [ ] Asociación con pacientes

### 6.2 Exportación a PDF
- [ ] Generar PDF de historia clínica
- [ ] Plantilla de PDF personalizable
- [ ] Incluir datos del paciente
- [ ] Incluir consultas y diagnósticos
- [ ] Incluir estudios y tratamientos
- [ ] Firma digital del médico
- [ ] Opción de descargar PDF
- [ ] Opción de imprimir directamente
- [ ] Formato profesional médico
- [ ] Incluir logo de la institución
- [ ] Fechas y timestamps
- [ ] Numeración de páginas

---

## Etapa 7: Funcionalidades Adicionales
**Estado:** ⏳ Pendiente

### 7.1 Notificaciones
- [ ] Sistema de notificaciones
- [ ] Alertas de turnos
- [ ] Recordatorios

### 7.2 Integraciones
- [ ] Integración con sistema de turnos
- [ ] Integración con obras sociales
- [ ] API para integraciones externas

### 7.3 Reportes y Estadísticas
- [ ] Dashboard con métricas
- [ ] Reportes personalizables
- [ ] Exportación de datos

### 7.4 Tutoriales y Ayuda
- [ ] Sistema de tutoriales en video
- [ ] Guías de uso de funcionalidades
- [ ] Documentación integrada

### 7.5 Comunicación del Sistema
- [ ] Notas y comunicados del sistema
- [ ] Mensajes importantes para usuarios
- [ ] Historial de comunicaciones

### 7.6 Información del Sistema
- [ ] Modal "Acerca de"
- [ ] Información de versión
- [ ] Créditos y licencias

---

## Esquema de Base de Datos Propuesto

### Tablas Principales

```typescript
// Autenticación
tokens

// Médicos
doctors
doctor_schedules
doctor_unavailable_days
doctor_signatures
doctor_photos

// Pacientes
patients
patient_insurance (obras sociales)

// Turnos
appointments
appointment_types
consulting_rooms

// Historia Clínica
medical_records
medical_consultations
diagnoses
treatments
studies

// Instituciones
institutions
insurance_companies

// Facturación
invoices
payments
```

---

## Prioridades de Desarrollo

1. **Fase 1 (Crítica):**
   - Etapa 1: Configuración Base y Autenticación
   - Etapa 3.1: Pool de Atención (funcionalidad principal)

2. **Fase 2 (Importante):**
   - Etapa 3.2: Atender sin Turno
   - Etapa 5.5: Gestión de Pacientes
   - Etapa 6.1: Gestión de Historia Clínica

3. **Fase 3 (Complementaria):**
   - Etapa 6.2: Exportación a PDF
   - Etapa 4: Administración de Recursos
   - Etapa 5: Listados completos

4. **Fase 4 (Mejoras):**
   - Etapa 7: Funcionalidades Adicionales

---

## Notas Técnicas

- **Framework:** React Router v7 con TypeScript
- **UI:** Shadcn UI + Tailwind CSS v4
- **Base de Datos:** Supabase (PostgreSQL) con Drizzle ORM
- **Autenticación:** Sistema basado en tokens
- **PDF:** Librería a definir (react-pdf, jsPDF, pdfkit, etc.)

