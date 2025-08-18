import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User profiles table (linked to Supabase Auth)
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey(), // This matches Supabase Auth user ID
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  subscriptionTier: varchar("subscription_tier").default("free"),
  monthlyCredits: integer("monthly_credits").default(10),
  creditsUsed: integer("credits_used").default(0),
  totalJobsProcessed: integer("total_jobs_processed").default(0),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Stencil jobs table (for tracking image processing)
export const stencilJobs = pgTable("stencil_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  originalImageUrl: text("original_image_url").notNull(),
  processedImageUrl: text("processed_image_url"),
  style: varchar("style").notNull(), // Steven, Makishi, Darwin, Adrian
  status: varchar("status").notNull().default("pending"), // pending, processing, completed, failed
  comfyDeployRunId: varchar("comfy_deploy_run_id"),
  processingOptions: jsonb("processing_options"), // quality, transparentBg, etc.
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Stencil styles/models configuration
export const stencilStyles = pgTable("stencil_styles", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  comfyDeployWorkflowId: varchar("comfy_deploy_workflow_id"),
  loraModel: varchar("lora_model"),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  previewImageUrl: text("preview_image_url"),
});

// Flux projects table (for design editor)
export const fluxProjects = pgTable("flux_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  prompt: text("prompt"),
  imageUrl: text("image_url"),
  settings: jsonb("settings"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Gemini chat messages table
export const geminiChats = pgTable("gemini_chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  projectId: varchar("project_id").references(() => fluxProjects.id),
  role: text("role").notNull(), // 'user' | 'assistant'
  message: text("message").notNull(),
  response: text("response"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Usage tracking table
export const usageTracking = pgTable("usage_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  actionType: varchar("action_type").notNull(), // stencil_conversion, flux_generation, gemini_chat
  creditsUsed: integer("credits_used").default(1),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Insert schemas
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertStencilJobSchema = createInsertSchema(stencilJobs).omit({
  id: true,
  createdAt: true,
});

export const insertStencilStyleSchema = createInsertSchema(stencilStyles);

export const insertFluxProjectSchema = createInsertSchema(fluxProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGeminiChatSchema = createInsertSchema(geminiChats).omit({
  id: true,
  createdAt: true,
});

export const insertUsageTrackingSchema = createInsertSchema(usageTracking).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;

export type InsertStencilJob = z.infer<typeof insertStencilJobSchema>;
export type StencilJob = typeof stencilJobs.$inferSelect;

export type InsertStencilStyle = z.infer<typeof insertStencilStyleSchema>;
export type StencilStyle = typeof stencilStyles.$inferSelect;

export type InsertFluxProject = z.infer<typeof insertFluxProjectSchema>;
export type FluxProject = typeof fluxProjects.$inferSelect;

export type InsertGeminiChat = z.infer<typeof insertGeminiChatSchema>;
export type GeminiChat = typeof geminiChats.$inferSelect;

export type InsertUsageTracking = z.infer<typeof insertUsageTrackingSchema>;
export type UsageTracking = typeof usageTracking.$inferSelect;
