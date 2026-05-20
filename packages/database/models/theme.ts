import { pgTable, uuid, text, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

export const themes = pgTable("themes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").unique().notNull(),
  slug: text("slug").unique().notNull(),
  category: text("category"),
  config: jsonb("config").notNull(),
  previewImage: text("preview_image"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const formViews = pgTable("form_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id").notNull(),
  ipHash: text("ip_hash"),
  referrer: text("referrer"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type SelectTheme = typeof themes.$inferSelect;
export type InsertTheme = typeof themes.$inferInsert;
export type SelectFormView = typeof formViews.$inferSelect;
