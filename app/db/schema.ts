import { pgTable, varchar, uuid, text, timestamp, boolean, date, time, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Esquema base para la aplicación consultorio

// Tabla de tokens para autenticación
export const tokens = pgTable("tokens", {
  type: varchar("type", { length: 255 }).notNull(),
  token: varchar("token", { length: 500 }).notNull(),
});

// Tabla de pacientes
export const patients = pgTable(
  "patients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Datos personales
    firstName: varchar("first_name", { length: 255 }).notNull(),
    lastName: varchar("last_name", { length: 255 }).notNull(),
    documentNumber: varchar("document_number", { length: 50 }).notNull().unique(),
    documentType: varchar("document_type", { length: 20 }).notNull().default("DNI"), // DNI, LC, LE, etc.
    birthDate: date("birth_date"),
    gender: varchar("gender", { length: 20 }), // M, F, Otro
    // Contacto
    phone: varchar("phone", { length: 50 }),
    email: varchar("email", { length: 255 }),
    address: text("address"),
    // Historia clínica
    medicalRecordNumber: varchar("medical_record_number", { length: 50 }), // Número de HC
    // Obra social
    insuranceCompany: varchar("insurance_company", { length: 255 }), // Nombre de la obra social
    insuranceNumber: varchar("insurance_number", { length: 100 }), // Número de afiliado
    // Metadatos
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // Índices para búsquedas rápidas
    documentNumberIdx: index("patients_document_number_idx").on(table.documentNumber),
    medicalRecordNumberIdx: index("patients_medical_record_number_idx").on(table.medicalRecordNumber),
    firstNameIdx: index("patients_first_name_idx").on(table.firstName),
    lastNameIdx: index("patients_last_name_idx").on(table.lastName),
    insuranceCompanyIdx: index("patients_insurance_company_idx").on(table.insuranceCompany),
    // Índice compuesto para búsqueda por nombre completo
    fullNameIdx: index("patients_full_name_idx").on(table.firstName, table.lastName),
  })
);

// Tabla de consultorios
export const consultingRooms = pgTable("consulting_rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabla de tipos de turnos
export const appointmentTypes = pgTable("appointment_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  duration: time("duration").notNull(), // Duración del turno (ej: 30 minutos)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabla de médicos
export const doctors = pgTable(
  "doctors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Datos personales
    firstName: varchar("first_name", { length: 255 }).notNull(),
    lastName: varchar("last_name", { length: 255 }).notNull(),
    documentNumber: varchar("document_number", { length: 50 }).notNull().unique(),
    documentType: varchar("document_type", { length: 20 }).notNull().default("DNI"),
    // Información profesional
    licenseNumber: varchar("license_number", { length: 100 }), // Matrícula profesional
    specialty: varchar("specialty", { length: 255 }), // Especialidad médica
    practice: varchar("practice", { length: 255 }), // Práctica o área de trabajo
    // Configuración
    photoUrl: text("photo_url"), // URL o path de la foto
    signatureUrl: text("signature_url"), // URL o path de la firma
    attentionTemplate: text("attention_template"), // Plantilla de atención
    attentionWindowStart: time("attention_window_start"), // Hora inicio ventana de atención
    attentionWindowEnd: time("attention_window_end"), // Hora fin ventana de atención
    // Metadatos
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    documentNumberIdx: index("doctors_document_number_idx").on(table.documentNumber),
    firstNameIdx: index("doctors_first_name_idx").on(table.firstName),
    lastNameIdx: index("doctors_last_name_idx").on(table.lastName),
    fullNameIdx: index("doctors_full_name_idx").on(table.firstName, table.lastName),
  })
);

// Tabla de días no laborables de médicos
export const doctorUnavailableDays = pgTable("doctor_unavailable_days", {
  id: uuid("id").defaultRandom().primaryKey(),
  doctorId: uuid("doctor_id").notNull().references(() => doctors.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  reason: text("reason"), // Motivo del día no laborable
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  doctorIdIdx: index("doctor_unavailable_days_doctor_id_idx").on(table.doctorId),
  dateIdx: index("doctor_unavailable_days_date_idx").on(table.date),
  doctorDateUniqueIdx: uniqueIndex("doctor_unavailable_days_doctor_date_unique_idx").on(table.doctorId, table.date),
}));

// Tabla de turnos
export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Relaciones
    patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    doctorId: uuid("doctor_id").references(() => doctors.id, { onDelete: "set null" }),
    consultingRoomId: uuid("consulting_room_id").references(() => consultingRooms.id, { onDelete: "set null" }),
    appointmentTypeId: uuid("appointment_type_id").references(() => appointmentTypes.id, { onDelete: "set null" }),
    // Información del turno
    appointmentDate: date("appointment_date").notNull(),
    appointmentTime: time("appointment_time").notNull(),
    receptionTime: time("reception_time"), // Hora de recepción
    isOverbooking: boolean("is_overbooking").default(false).notNull(), // Sobre turno
    status: varchar("status", { length: 50 }).notNull().default("scheduled"), // scheduled, attended, cancelled, no_show
    notes: text("notes"), // Notas adicionales
    // Metadatos
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    patientIdIdx: index("appointments_patient_id_idx").on(table.patientId),
    doctorIdIdx: index("appointments_doctor_id_idx").on(table.doctorId),
    appointmentDateIdx: index("appointments_appointment_date_idx").on(table.appointmentDate),
    statusIdx: index("appointments_status_idx").on(table.status),
  })
);

// Relaciones de Drizzle
export const doctorsRelations = relations(doctors, ({ many }) => ({
  unavailableDays: many(doctorUnavailableDays),
  appointments: many(appointments),
}));

export const patientsRelations = relations(patients, ({ many }) => ({
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  doctor: one(doctors, {
    fields: [appointments.doctorId],
    references: [doctors.id],
  }),
  consultingRoom: one(consultingRooms, {
    fields: [appointments.consultingRoomId],
    references: [consultingRooms.id],
  }),
  appointmentType: one(appointmentTypes, {
    fields: [appointments.appointmentTypeId],
    references: [appointmentTypes.id],
  }),
}));

// Inferencia de tipos desde los esquemas de Drizzle
export type Token = typeof tokens.$inferSelect;
export type TokenInsert = typeof tokens.$inferInsert;

export type Patient = typeof patients.$inferSelect;
export type PatientInsert = typeof patients.$inferInsert;

export type Doctor = typeof doctors.$inferSelect;
export type DoctorInsert = typeof doctors.$inferInsert;

export type ConsultingRoom = typeof consultingRooms.$inferSelect;
export type ConsultingRoomInsert = typeof consultingRooms.$inferInsert;

export type AppointmentType = typeof appointmentTypes.$inferSelect;
export type AppointmentTypeInsert = typeof appointmentTypes.$inferInsert;

export type Appointment = typeof appointments.$inferSelect;
export type AppointmentInsert = typeof appointments.$inferInsert;

export type DoctorUnavailableDay = typeof doctorUnavailableDays.$inferSelect;
export type DoctorUnavailableDayInsert = typeof doctorUnavailableDays.$inferInsert;
