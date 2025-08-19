import { users, generatedImages, type User, type InsertUser, type GeneratedImage, type InsertImage } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getGeneratedImages(): Promise<GeneratedImage[]>;
  createGeneratedImage(image: InsertImage): Promise<GeneratedImage>;
  getGeneratedImage(id: number): Promise<GeneratedImage | undefined>;
  getGeneratedImageByUrl(url: string): Promise<GeneratedImage | undefined>;
  deleteGeneratedImage(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getGeneratedImages(): Promise<GeneratedImage[]> {
    const images = await db
      .select()
      .from(generatedImages)
      .orderBy(desc(generatedImages.createdAt))
      .limit(20);
    return images;
  }

  async createGeneratedImage(insertImage: InsertImage): Promise<GeneratedImage> {
    const [image] = await db
      .insert(generatedImages)
      .values({
        prompt: insertImage.prompt,
        imageUrl: insertImage.imageUrl,
        imageData: insertImage.imageData ?? null,
        thumbnailData: insertImage.thumbnailData ?? null,
        inputImageUrl: insertImage.inputImageUrl ?? null,
        width: insertImage.width,
        height: insertImage.height,
        aspectRatio: insertImage.aspectRatio ?? "match_input_image",
        cost: insertImage.cost ?? null,
      })
      .returning();
    return image;
  }

  async getGeneratedImage(id: number): Promise<GeneratedImage | undefined> {
    const [image] = await db.select().from(generatedImages).where(eq(generatedImages.id, id));
    return image || undefined;
  }

  async getGeneratedImageByUrl(url: string): Promise<GeneratedImage | undefined> {
    const [image] = await db.select().from(generatedImages).where(eq(generatedImages.imageUrl, url));
    return image || undefined;
  }

  async deleteGeneratedImage(id: number): Promise<boolean> {
    const result = await db.delete(generatedImages).where(eq(generatedImages.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
