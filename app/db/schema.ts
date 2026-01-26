import { pgTable, varchar, uuid, text, timestamp, boolean, date, time, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Esquema base para la aplicación consultorio

// Tabla de tokens para autenticación
export const tokens = pgTable("tokens", {
  type: varchar("type", { length: 255 }).notNull(),
  token: varchar("token", { length: 500 }).notNull(),
});

// Inferencia de tipos desde los esquemas de Drizzle
export type Token = typeof tokens.$inferSelect;
export type TokenInsert = typeof tokens.$inferInsert;
