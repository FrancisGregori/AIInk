import { 
  type UserProfile, 
  type InsertUserProfile, 
  type StencilJob, 
  type InsertStencilJob,
  type StencilStyle,
  type InsertStencilStyle,
  type FluxProject, 
  type GeminiChat, 
  type InsertFluxProject, 
  type InsertGeminiChat,
  type UsageTracking,
  type InsertUsageTracking,
  type GalleryItem,
  type InsertGalleryItem,
  users,
  userGallery,
  userProfiles,
  stencilJobs,
  stencilStyles,
  fluxProjects,
  geminiChats,
  usageTracking
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// Interface for stencil processing
export interface StencilProcessRequest {
  userId: string;
  imageUrl: string;
  style: string;
  options?: {
    quality?: number;
    transparentBg?: boolean;
  };
}

// Storage interface
export interface IStorage {
  // User profile methods
  getUserProfile(id: string): Promise<UserProfile | undefined>;
  getUserProfileByEmail(email: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | undefined>;
  
  // Replit Auth required methods
  getUser(id: string): Promise<UserProfile | undefined>;
  upsertUser(user: Partial<UserProfile>): Promise<UserProfile>;
  
  // Credit system methods
  getUserCredits(userId: string): Promise<number>;
  deductCredits(userId: string, amount: number): Promise<boolean>;
  updateUserCredits(userId: string, newCredits: number): Promise<UserProfile>;
  
  // Stencil methods
  getStencilStyles(): Promise<StencilStyle[]>;
  getStencilStyle(id: string): Promise<StencilStyle | undefined>;
  createStencilJob(job: InsertStencilJob): Promise<StencilJob>;
  updateStencilJob(id: string, updates: Partial<StencilJob>): Promise<StencilJob | undefined>;
  getStencilJob(id: string): Promise<StencilJob | undefined>;
  getStencilJobs(userId?: string): Promise<StencilJob[]>;
  getGalleryStencils(userId?: string, limit?: number): Promise<StencilJob[]>;
  
  // Flux Kontext methods
  getFluxProjects(userId?: string): Promise<FluxProject[]>;
  createFluxProject(project: InsertFluxProject): Promise<FluxProject>;
  getFluxProject(id: string): Promise<FluxProject | undefined>;
  updateFluxProject(id: string, updates: Partial<FluxProject>): Promise<FluxProject | undefined>;
  regenerateFluxProject(id: string): Promise<FluxProject | undefined>;
  deleteFluxProject(id: string): Promise<boolean>;
  
  // Gemini chat methods
  saveGeminiChat(chat: InsertGeminiChat): Promise<GeminiChat>;
  getGeminiChats(projectId?: string): Promise<GeminiChat[]>;
  
  // Usage tracking methods
  trackUsage(usage: InsertUsageTracking): Promise<UsageTracking>;
  getUserUsage(userId: string): Promise<UsageTracking[]>;
  
  // Gallery methods
  getUserGallery(userId: string, type?: string, limit?: number, offset?: number): Promise<GalleryItem[]>;
  getGalleryItemCount(userId: string, type?: string): Promise<number>;
  addToGallery(item: InsertGalleryItem): Promise<GalleryItem>;
  updateGalleryItem(id: string, updates: Partial<GalleryItem>, userId: string): Promise<GalleryItem | undefined>;
  deleteGalleryItem(id: string, userId: string): Promise<boolean>;
  toggleFavorite(id: string, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User profile methods
  async getUserProfile(id: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.id, id));
    return profile;
  }

  async getUserProfileByEmail(email: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.email, email));
    return profile;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [newProfile] = await db.insert(userProfiles).values(profile).returning();
    return newProfile;
  }

  async updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | undefined> {
    const [updated] = await db.update(userProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userProfiles.id, id))
      .returning();
    return updated;
  }

  // Replit Auth methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(user: Partial<User>): Promise<User> {
    if (!user.id) {
      throw new Error("User ID is required for upsert operation");
    }
    
    const existingUser = await this.getUser(user.id);
    
    if (existingUser) {
      const [updated] = await db.update(users)
        .set({ ...user, updatedAt: new Date() })
        .where(eq(users.id, user.id))
        .returning();
      return updated;
    } else {
      const [newUser] = await db.insert(users).values({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return newUser;
    }
  }

  // Credit system methods
  async getUserCredits(userId: string): Promise<number> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user?.credits || 0;
  }

  async deductCredits(userId: string, amount: number): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || !user.credits || user.credits < amount) {
      return false;
    }

    await db.update(users)
      .set({ 
        credits: user.credits - amount,
        creditsUsed: (user.creditsUsed || 0) + amount,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
    
    return true;
  }

  async updateUserCredits(userId: string, newCredits: number): Promise<UserProfile> {
    const [updated] = await db.update(users)
      .set({ credits: newCredits, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    
    return updated as UserProfile;
  }

  // Stencil methods
  async getStencilStyles(): Promise<StencilStyle[]> {
    return db.select().from(stencilStyles).orderBy(stencilStyles.displayOrder);
  }

  async getStencilStyle(id: string): Promise<StencilStyle | undefined> {
    const [style] = await db.select().from(stencilStyles).where(eq(stencilStyles.id, id));
    return style;
  }

  async createStencilJob(job: InsertStencilJob): Promise<StencilJob> {
    const [newJob] = await db.insert(stencilJobs).values(job).returning();
    return newJob;
  }

  async updateStencilJob(id: string, updates: Partial<StencilJob>): Promise<StencilJob | undefined> {
    const [updated] = await db.update(stencilJobs)
      .set(updates)
      .where(eq(stencilJobs.id, id))
      .returning();
    
    return updated;
  }

  async getStencilJob(id: string): Promise<StencilJob | undefined> {
    const [job] = await db.select().from(stencilJobs).where(eq(stencilJobs.id, id));
    return job;
  }

  async getStencilJobs(userId?: string): Promise<StencilJob[]> {
    if (userId) {
      return db.select().from(stencilJobs)
        .where(eq(stencilJobs.userId, userId))
        .orderBy(desc(stencilJobs.createdAt));
    }
    return db.select().from(stencilJobs).orderBy(desc(stencilJobs.createdAt));
  }

  async getGalleryStencils(userId?: string, limit?: number): Promise<StencilJob[]> {
    const defaultLimit = limit || 30;
    
    let baseQuery = userId 
      ? db.select().from(stencilJobs)
          .where(and(
            eq(stencilJobs.userId, userId),
            eq(stencilJobs.status, 'completed')
          ))
      : db.select().from(stencilJobs)
          .where(eq(stencilJobs.status, 'completed'));
    
    const result = await baseQuery
      .orderBy(desc(stencilJobs.createdAt))
      .limit(defaultLimit);
    
    return result;
  }

  // Flux Kontext methods
  async getFluxProjects(userId?: string): Promise<FluxProject[]> {
    console.log(`[STORAGE] getFluxProjects called for userId: ${userId}`);
    const startTime = Date.now();
    
    let result;
    if (userId) {
      // OPTIMIZACIÓN: Usar consulta SQL directa para mejor rendimiento
      const queryResult = await db.execute(sql`
        SELECT * FROM flux_projects 
        WHERE user_id = ${userId} 
        ORDER BY created_at DESC 
        LIMIT 50
      `);
      result = queryResult.rows as FluxProject[];
    } else {
      const queryResult = await db.execute(sql`
        SELECT * FROM flux_projects 
        ORDER BY created_at DESC 
        LIMIT 50
      `);
      result = queryResult.rows as FluxProject[];
    }
    
    const endTime = Date.now();
    console.log(`[STORAGE] DB query completed in ${endTime - startTime}ms, returning ${result.length} items`);
    return result;
  }

  async createFluxProject(project: InsertFluxProject): Promise<FluxProject> {
    const [newProject] = await db.insert(fluxProjects).values(project).returning();
    return newProject;
  }

  async getFluxProject(id: string): Promise<FluxProject | undefined> {
    const [project] = await db.select().from(fluxProjects)
      .where(eq(fluxProjects.id, id))
      .limit(1);
    return project;
  }

  async updateFluxProject(id: string, updates: Partial<FluxProject>): Promise<FluxProject | undefined> {
    const [updated] = await db.update(fluxProjects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(fluxProjects.id, id))
      .returning();
    return updated;
  }

  async regenerateFluxProject(id: string): Promise<FluxProject | undefined> {
    return this.updateFluxProject(id, { updatedAt: new Date() });
  }

  async deleteFluxProject(id: string): Promise<boolean> {
    await db.delete(fluxProjects).where(eq(fluxProjects.id, id));
    return true;
  }

  // Gemini chat methods
  async saveGeminiChat(chat: InsertGeminiChat): Promise<GeminiChat> {
    const [newChat] = await db.insert(geminiChats).values(chat).returning();
    return newChat;
  }

  async getGeminiChats(projectId?: string): Promise<GeminiChat[]> {
    if (projectId) {
      return db.select().from(geminiChats)
        .where(eq(geminiChats.projectId, projectId))
        .orderBy(desc(geminiChats.createdAt));
    }
    return db.select().from(geminiChats).orderBy(desc(geminiChats.createdAt));
  }

  // Usage tracking methods
  async trackUsage(usage: InsertUsageTracking): Promise<UsageTracking> {
    const [tracked] = await db.insert(usageTracking).values(usage).returning();
    return tracked;
  }

  async getUserUsage(userId: string): Promise<UsageTracking[]> {
    return db.select().from(usageTracking)
      .where(eq(usageTracking.userId, userId))
      .orderBy(desc(usageTracking.createdAt));
  }

  // Gallery methods - SIMPLIFICADOS PARA MEJOR PERFORMANCE
  async getUserGallery(userId: string, type?: string, limit?: number, offset?: number): Promise<GalleryItem[]> {
    const defaultLimit = limit || 100;
    const defaultOffset = offset || 0;
    
    console.log(`[DB] Fetching gallery data for user ${userId}, type: ${type || 'all'}, limit: ${defaultLimit}`);
    
    const startTime = Date.now();
    
    let baseQuery = db.select().from(userGallery);
    
    if (type && type !== 'all') {
      baseQuery = baseQuery.where(and(
        eq(userGallery.userId, userId),
        eq(userGallery.type, type)
      ));
    } else {
      baseQuery = baseQuery.where(eq(userGallery.userId, userId));
    }
    
    const result = await baseQuery
      .orderBy(desc(userGallery.createdAt))
      .limit(defaultLimit)
      .offset(defaultOffset);
    
    const duration = Date.now() - startTime;
    console.log(`Gallery query took ${duration}ms for ${result.length} items`);
    
    return result;
  }

  async getGalleryItemCount(userId: string, type?: string): Promise<number> {
    let baseQuery = db.select({ count: sql<number>`count(*)` }).from(userGallery);
    
    if (type && type !== 'all') {
      baseQuery = baseQuery.where(and(
        eq(userGallery.userId, userId),
        eq(userGallery.type, type)
      ));
    } else {
      baseQuery = baseQuery.where(eq(userGallery.userId, userId));
    }
    
    const [result] = await baseQuery;
    return Number(result.count);
  }

  async addToGallery(item: InsertGalleryItem): Promise<GalleryItem> {
    const [newItem] = await db.insert(userGallery).values(item).returning();
    return newItem;
  }

  async updateGalleryItem(id: string, updates: Partial<GalleryItem>, userId: string): Promise<GalleryItem | undefined> {
    const [existing] = await db.select().from(userGallery)
      .where(and(
        eq(userGallery.id, id),
        eq(userGallery.userId, userId)
      ));
    
    if (!existing) {
      console.warn(`[SECURITY] User ${userId} attempted to update gallery item ${id} they don't own`);
      return undefined;
    }
    
    const [updated] = await db.update(userGallery)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(userGallery.id, id),
        eq(userGallery.userId, userId)
      ))
      .returning();
    return updated;
  }

  async deleteGalleryItem(id: string, userId: string): Promise<boolean> {
    await db.delete(userGallery)
      .where(and(
        eq(userGallery.id, id),
        eq(userGallery.userId, userId)
      ));
    
    return true;
  }

  async toggleFavorite(id: string, userId: string): Promise<boolean> {
    const [item] = await db.select().from(userGallery)
      .where(and(
        eq(userGallery.id, id),
        eq(userGallery.userId, userId)
      ));
    
    if (!item) return false;

    await db.update(userGallery)
      .set({ isFavorite: !item.isFavorite, updatedAt: new Date() })
      .where(eq(userGallery.id, id));
    
    return true;
  }
}

export const storage = new DatabaseStorage();