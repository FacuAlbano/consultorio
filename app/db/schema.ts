import { pgTable, varchar, uuid, text, timestamp, boolean, date, time, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Base schema for consultorio app
// This is a starting point - you can expand it based on your needs

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("user"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  createdAtIdx: index("users_created_at_idx").on(table.createdAt),
}));

// Type inference from Drizzle schemas
export type User = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
