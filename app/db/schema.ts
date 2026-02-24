import { pgTable, varchar, uuid, text, timestamp, boolean, date, time, index, uniqueIndex, numeric } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

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
    whatsapp: varchar("whatsapp", { length: 50 }), // Teléfono WhatsApp
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

// Tabla de instituciones
export const institutions = pgTable("institutions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  nameIdx: index("institutions_name_idx").on(table.name),
}));

// Tabla de obras sociales
export const insuranceCompanies = pgTable("insurance_companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }), // Código de la obra social
  description: text("description"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  nameIdx: index("insurance_companies_name_idx").on(table.name),
  codeIdx: index("insurance_companies_code_idx").on(table.code),
  isActiveIdx: index("insurance_companies_is_active_idx").on(table.isActive),
}));

// Tabla de relación médico-tipo de turno (muchos a muchos)
export const doctorAppointmentTypes = pgTable("doctor_appointment_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  doctorId: uuid("doctor_id").notNull().references(() => doctors.id, { onDelete: "cascade" }),
  appointmentTypeId: uuid("appointment_type_id").notNull().references(() => appointmentTypes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  doctorIdIdx: index("doctor_appointment_types_doctor_id_idx").on(table.doctorId),
  appointmentTypeIdIdx: index("doctor_appointment_types_appointment_type_id_idx").on(table.appointmentTypeId),
  doctorAppointmentTypeUniqueIdx: uniqueIndex("doctor_appointment_types_doctor_appointment_type_unique_idx").on(table.doctorId, table.appointmentTypeId),
}));

// Tabla de días no laborables generales (de la institución)
export const institutionUnavailableDays = pgTable("institution_unavailable_days", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: date("date").notNull(),
  reason: text("reason"), // Motivo del día no laborable
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  dateIdx: index("institution_unavailable_days_date_idx").on(table.date),
  dateUniqueIdx: uniqueIndex("institution_unavailable_days_date_unique_idx").on(table.date),
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
    noShowReason: text("no_show_reason"), // Motivo de no atención (inasistencia)
    noShowFollowUp: text("no_show_follow_up"), // Seguimiento de inasistencia
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

// Tabla de facturas (facturación de turnos)
export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    invoiceDate: date("invoice_date").notNull().default(sql`CURRENT_DATE`),
    status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, paid, cancelled
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    patientIdIdx: index("invoices_patient_id_idx").on(table.patientId),
    appointmentIdIdx: index("invoices_appointment_id_idx").on(table.appointmentId),
    statusIdx: index("invoices_status_idx").on(table.status),
    dateIdx: index("invoices_invoice_date_idx").on(table.invoiceDate),
  })
);

// Tabla de pagos (control de pagos)
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    paymentDate: date("payment_date").notNull().default(sql`CURRENT_DATE`),
    method: varchar("method", { length: 50 }), // efectivo, transferencia, tarjeta, etc.
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    invoiceIdIdx: index("payments_invoice_id_idx").on(table.invoiceId),
  })
);

// --- Historia Clínica (Etapa 6) ---

// Consultas médicas (cada visita/atención)
export const medicalConsultations = pgTable(
  "medical_consultations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
    doctorId: uuid("doctor_id").references(() => doctors.id, { onDelete: "set null" }),
    appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
    consultationDate: date("consultation_date").notNull(),
    reason: text("reason"), // Motivo de consulta
    notes: text("notes"), // Notas del profesional
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    patientIdIdx: index("medical_consultations_patient_id_idx").on(table.patientId),
    doctorIdIdx: index("medical_consultations_doctor_id_idx").on(table.doctorId),
    dateIdx: index("medical_consultations_consultation_date_idx").on(table.consultationDate),
  })
);

// Diagnósticos por consulta
export const diagnoses = pgTable(
  "diagnoses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    medicalConsultationId: uuid("medical_consultation_id").notNull().references(() => medicalConsultations.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 50 }), // CIE-10 u otro
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    consultationIdIdx: index("diagnoses_medical_consultation_id_idx").on(table.medicalConsultationId),
  })
);

// Tratamientos por consulta
export const treatments = pgTable(
  "treatments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    medicalConsultationId: uuid("medical_consultation_id").notNull().references(() => medicalConsultations.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    consultationIdIdx: index("treatments_medical_consultation_id_idx").on(table.medicalConsultationId),
  })
);

// Estudios por consulta
export const studies = pgTable(
  "studies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    medicalConsultationId: uuid("medical_consultation_id").notNull().references(() => medicalConsultations.id, { onDelete: "cascade" }),
    description: varchar("description", { length: 500 }).notNull(),
    result: text("result"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    consultationIdIdx: index("studies_medical_consultation_id_idx").on(table.medicalConsultationId),
  })
);

// Relaciones de Drizzle
export const doctorsRelations = relations(doctors, ({ many }) => ({
  unavailableDays: many(doctorUnavailableDays),
  appointments: many(appointments),
  appointmentTypes: many(doctorAppointmentTypes),
  medicalConsultations: many(medicalConsultations),
}));

export const patientsRelations = relations(patients, ({ many }) => ({
  appointments: many(appointments),
  invoices: many(invoices),
  medicalConsultations: many(medicalConsultations),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  patient: one(patients, { fields: [invoices.patientId], references: [patients.id] }),
  appointment: one(appointments, { fields: [invoices.appointmentId], references: [appointments.id] }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, { fields: [payments.invoiceId], references: [invoices.id] }),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
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
  medicalConsultations: many(medicalConsultations),
}));

export const medicalConsultationsRelations = relations(medicalConsultations, ({ one, many }) => ({
  patient: one(patients, { fields: [medicalConsultations.patientId], references: [patients.id] }),
  doctor: one(doctors, { fields: [medicalConsultations.doctorId], references: [doctors.id] }),
  appointment: one(appointments, { fields: [medicalConsultations.appointmentId], references: [appointments.id] }),
  diagnoses: many(diagnoses),
  treatments: many(treatments),
  studies: many(studies),
}));

export const diagnosesRelations = relations(diagnoses, ({ one }) => ({
  medicalConsultation: one(medicalConsultations, { fields: [diagnoses.medicalConsultationId], references: [medicalConsultations.id] }),
}));

export const treatmentsRelations = relations(treatments, ({ one }) => ({
  medicalConsultation: one(medicalConsultations, { fields: [treatments.medicalConsultationId], references: [medicalConsultations.id] }),
}));

export const studiesRelations = relations(studies, ({ one }) => ({
  medicalConsultation: one(medicalConsultations, { fields: [studies.medicalConsultationId], references: [medicalConsultations.id] }),
}));

export const appointmentTypesRelations = relations(appointmentTypes, ({ many }) => ({
  doctors: many(doctorAppointmentTypes),
  appointments: many(appointments),
}));

export const doctorAppointmentTypesRelations = relations(doctorAppointmentTypes, ({ one }) => ({
  doctor: one(doctors, {
    fields: [doctorAppointmentTypes.doctorId],
    references: [doctors.id],
  }),
  appointmentType: one(appointmentTypes, {
    fields: [doctorAppointmentTypes.appointmentTypeId],
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

export type Institution = typeof institutions.$inferSelect;
export type InstitutionInsert = typeof institutions.$inferInsert;

export type InsuranceCompany = typeof insuranceCompanies.$inferSelect;
export type InsuranceCompanyInsert = typeof insuranceCompanies.$inferInsert;

export type DoctorAppointmentType = typeof doctorAppointmentTypes.$inferSelect;
export type DoctorAppointmentTypeInsert = typeof doctorAppointmentTypes.$inferInsert;

export type InstitutionUnavailableDay = typeof institutionUnavailableDays.$inferSelect;
export type InstitutionUnavailableDayInsert = typeof institutionUnavailableDays.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type InvoiceInsert = typeof invoices.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type PaymentInsert = typeof payments.$inferInsert;

export type MedicalConsultation = typeof medicalConsultations.$inferSelect;
export type MedicalConsultationInsert = typeof medicalConsultations.$inferInsert;
export type Diagnosis = typeof diagnoses.$inferSelect;
export type DiagnosisInsert = typeof diagnoses.$inferInsert;
export type Treatment = typeof treatments.$inferSelect;
export type TreatmentInsert = typeof treatments.$inferInsert;
export type Study = typeof studies.$inferSelect;
export type StudyInsert = typeof studies.$inferInsert;
