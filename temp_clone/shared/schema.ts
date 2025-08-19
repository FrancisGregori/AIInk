import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const generatedImages = pgTable("generated_images", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  imageUrl: text("image_url").notNull(),
  imageData: text("image_data"), // Para almacenar imagen como base64
  thumbnailData: text("thumbnail_data"), // Para almacenar thumbnail como base64
  inputImageUrl: text("input_image_url"), // URL de la imagen de referencia
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  aspectRatio: text("aspect_ratio").default("match_input_image"),
  cost: text("cost"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertImageSchema = createInsertSchema(generatedImages).pick({
  prompt: true,
  imageUrl: true,
  imageData: true,
  thumbnailData: true,
  inputImageUrl: true,
  width: true,
  height: true,
  aspectRatio: true,
  cost: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertImage = z.infer<typeof insertImageSchema>;
export type GeneratedImage = typeof generatedImages.$inferSelect;
