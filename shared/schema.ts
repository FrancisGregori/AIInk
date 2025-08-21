import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  
  // Subscription and credits
  subscriptionTier: varchar("subscription_tier").default("free"), // free, basic, pro, premium
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  credits: integer("credits").default(10), // Current available credits
  monthlyCredits: integer("monthly_credits").default(0), // Monthly credit allowance
  creditsUsed: integer("credits_used").default(0), // Credits used this billing period
  creditsRollover: integer("credits_rollover").default(0), // Credits rolled over from previous month
  
  // Settings
  autoTopUpEnabled: boolean("auto_top_up_enabled").default(false),
  preferredModel: varchar("preferred_model"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// User Gallery table for private designs
export const userGallery = pgTable("user_gallery", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  imageUrl: varchar("image_url").notNull(),
  thumbnailUrl: varchar("thumbnail_url"),
  type: varchar("type").notNull(), // 'stencil' or 'design'
  title: varchar("title"),
  description: text("description"),
  prompt: text("prompt"),
  style: varchar("style"), // for stencils: steven, makishi, etc
  isFavorite: boolean("is_favorite").default(false),
  metadata: jsonb("metadata"), // extra data like processing options
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("user_gallery_user_id_idx").on(table.userId),
  index("user_gallery_type_idx").on(table.type),
  index("user_gallery_created_at_idx").on(table.createdAt),
]);

export type InsertGalleryItem = typeof userGallery.$inferInsert;
export type GalleryItem = typeof userGallery.$inferSelect;

// User profiles table (for backward compatibility)
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey(),
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
