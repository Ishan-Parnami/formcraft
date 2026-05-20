import { pgTable, uuid, text, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./user";

export const forms = pgTable("forms", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  description: text("description"),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  isPublished: boolean("is_published").default(false),
  visibility: text("visibility").default("unlisted"),
  theme: jsonb("theme"),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const fields = pgTable("fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id")
    .notNull()
    .references(() => forms.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  label: text("label").notNull(),
  placeholder: text("placeholder"),
  description: text("description"),
  required: boolean("required").default(false),
  order: integer("order").notNull(),
  options: jsonb("options"),
  validations: jsonb("validations"),
  conditionalLogic: jsonb("conditional_logic"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type SelectForm = typeof forms.$inferSelect;
export type InsertForm = typeof forms.$inferInsert;
export type SelectField = typeof fields.$inferSelect;
export type InsertField = typeof fields.$inferInsert;
