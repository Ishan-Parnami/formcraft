import { pgTable, uuid, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { forms } from "./form";

export const responses = pgTable("responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id")
    .notNull()
    .references(() => forms.id, { onDelete: "cascade" }),
  respondentEmail: text("respondent_email"),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent"),
  answers: jsonb("answers").notNull(),
  completionTime: integer("completion_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type SelectResponse = typeof responses.$inferSelect;
export type InsertResponse = typeof responses.$inferInsert;
