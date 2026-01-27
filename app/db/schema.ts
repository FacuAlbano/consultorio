import { pgTable, varchar, uuid, text, timestamp, boolean, date, time, index } from "drizzle-orm/pg-core";
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

// Inferencia de tipos desde los esquemas de Drizzle
export type Token = typeof tokens.$inferSelect;
export type TokenInsert = typeof tokens.$inferInsert;

export type Patient = typeof patients.$inferSelect;
export type PatientInsert = typeof patients.$inferInsert;
