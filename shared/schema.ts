import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const stencilModels = pgTable("stencil_models", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const stencilResults = pgTable("stencil_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  modelId: varchar("model_id").references(() => stencilModels.id),
  originalImageUrl: text("original_image_url").notNull(),
  resultImageUrl: text("result_image_url").notNull(),
  modelUsed: text("model_used").notNull(),
  processingTime: text("processing_time"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const fluxProjects = pgTable("flux_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  name: text("name").notNull(),
  description: text("description"),
  prompt: text("prompt"),
  imageUrl: text("image_url"),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const geminiChats = pgTable("gemini_chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  projectId: varchar("project_id").references(() => fluxProjects.id),
  message: text("message").notNull(),
  response: text("response"),
  role: text("role").notNull(), // 'user' | 'assistant'
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertStencilModelSchema = createInsertSchema(stencilModels).omit({
  createdAt: true,
});

export const insertStencilResultSchema = createInsertSchema(stencilResults).omit({
  id: true,
  createdAt: true,
});

export const insertFluxProjectSchema = createInsertSchema(fluxProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGeminiChatSchema = createInsertSchema(geminiChats).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertStencilModel = z.infer<typeof insertStencilModelSchema>;
export type StencilModel = typeof stencilModels.$inferSelect;

export type InsertStencilResult = z.infer<typeof insertStencilResultSchema>;
export type StencilResult = typeof stencilResults.$inferSelect;

export type InsertFluxProject = z.infer<typeof insertFluxProjectSchema>;
export type FluxProject = typeof fluxProjects.$inferSelect;

export type InsertGeminiChat = z.infer<typeof insertGeminiChatSchema>;
export type GeminiChat = typeof geminiChats.$inferSelect;
