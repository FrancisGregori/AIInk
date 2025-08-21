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
  type InsertUsageTracking
} from "@shared/schema";
import { randomUUID } from "crypto";

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

// Modify the interface with required CRUD methods
export interface IStorage {
  // User profile methods
  getUserProfile(id: string): Promise<UserProfile | undefined>;
  getUserProfileByEmail(email: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | undefined>;
  
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
  updateFluxProject(id: string, updates: Partial<FluxProject>): Promise<FluxProject | undefined>;
  regenerateFluxProject(id: string): Promise<FluxProject | undefined>;
  deleteFluxProject(id: string): Promise<boolean>;
  
  // Gemini chat methods
  saveGeminiChat(chat: InsertGeminiChat): Promise<GeminiChat>;
  getGeminiChats(projectId?: string): Promise<GeminiChat[]>;
  
  // Usage tracking methods
  trackUsage(usage: InsertUsageTracking): Promise<UsageTracking>;
  getUserUsage(userId: string): Promise<UsageTracking[]>;
}

export class MemStorage implements IStorage {
  private userProfiles: Map<string, UserProfile>;
  private stencilStyles: Map<string, StencilStyle>;
  private stencilJobs: Map<string, StencilJob>;
  private fluxProjects: Map<string, FluxProject>;
  private geminiChats: Map<string, GeminiChat>;
  private usageTracking: Map<string, UsageTracking>;

  constructor() {
    this.userProfiles = new Map();
    this.stencilStyles = new Map();
    this.stencilJobs = new Map();
    this.fluxProjects = new Map();
    this.geminiChats = new Map();
    this.usageTracking = new Map();
    
    this.initializeStencilStyles();
    this.initializeSampleData();
  }

  // Initialize stencil styles (Steven, Makishi, Darwin, Adrian)
  private initializeStencilStyles() {
    const styles: StencilStyle[] = [
      {
        id: "steven",
        name: "Steven",
        description: "Estilo profesional con líneas definidas y sombreado detallado",
        comfyDeployWorkflowId: "steven-stencil-workflow", // TODO: Replace with actual workflow ID
        loraModel: "steven-lora-v1",
        isActive: true,
        displayOrder: 1,
        previewImageUrl: "https://via.placeholder.com/200x200/000000/FFFFFF?text=Steven",
      },
      {
        id: "makishi",
        name: "Makishi",
        description: "Estilo artístico japonés con trazos fluidos y elegantes",
        comfyDeployWorkflowId: "makishi-stencil-workflow", // TODO: Replace with actual workflow ID
        loraModel: "makishi-lora-v1",
        isActive: true,
        displayOrder: 2,
        previewImageUrl: "https://via.placeholder.com/200x200/000000/FFFFFF?text=Makishi",
      },
      {
        id: "darwin",
        name: "Darwin",
        description: "Estilo realista con alto contraste y detalles precisos",
        comfyDeployWorkflowId: "darwin-stencil-workflow", // TODO: Replace with actual workflow ID
        loraModel: "darwin-lora-v1",
        isActive: true,
        displayOrder: 3,
        previewImageUrl: "https://via.placeholder.com/200x200/000000/FFFFFF?text=Darwin",
      },
      {
        id: "adrian",
        name: "Adrian",
        description: "Estilo moderno con geometría y patrones abstractos",
        comfyDeployWorkflowId: "adrian-stencil-workflow", // TODO: Replace with actual workflow ID
        loraModel: "adrian-lora-v1",
        isActive: true,
        displayOrder: 4,
        previewImageUrl: "https://via.placeholder.com/200x200/000000/FFFFFF?text=Adrian",
      },
    ];

    styles.forEach(style => this.stencilStyles.set(style.id, style));
  }

  // Initialize sample data for demonstration
  private initializeSampleData() {
    // Sample user profile
    const demoUser: UserProfile = {
      id: "demo-user",
      email: "demo@example.com",
      displayName: "Usuario Demo",
      avatarUrl: null,
      subscriptionTier: "free",
      monthlyCredits: 10,
      creditsUsed: 3,
      totalJobsProcessed: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userProfiles.set(demoUser.id, demoUser);

    // Sample flux projects
    const sampleProjects: FluxProject[] = [
      {
        id: randomUUID(),
        userId: "demo-user",
        name: "Logo Corporativo",
        description: "Logo moderno para empresa de tecnología",
        prompt: "Create a modern, minimalist logo for a tech company",
        imageUrl: "https://via.placeholder.com/512x512/000000/FFFFFF?text=Logo",
        settings: { style: "modern", colors: ["#000000", "#FFFFFF"] },
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        userId: "demo-user",
        name: "Poster Musical",
        description: "Poster para evento de música electrónica",
        prompt: "Design a vibrant poster for an electronic music event",
        imageUrl: "https://via.placeholder.com/512x512/333333/FFFFFF?text=Music",
        settings: { style: "vibrant", colors: ["#333333", "#CCCCCC"] },
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleProjects.forEach(project => this.fluxProjects.set(project.id, project));

    // Sample completed stencil jobs
    const sampleJobs: StencilJob[] = [
      {
        id: randomUUID(),
        userId: "demo-user",
        originalImageUrl: "https://via.placeholder.com/400x400/CCCCCC/000000?text=Original",
        processedImageUrl: "https://via.placeholder.com/400x400/000000/FFFFFF?text=Stencil",
        style: "steven",
        status: "completed",
        comfyDeployRunId: "run-001",
        processingOptions: { quality: 90, transparentBg: false },
        errorMessage: null,
        startedAt: new Date(Date.now() - 120000),
        completedAt: new Date(Date.now() - 60000),
        createdAt: new Date(Date.now() - 120000),
      },
      {
        id: randomUUID(),
        userId: "demo-user",
        originalImageUrl: "https://via.placeholder.com/400x400/EEEEEE/333333?text=Tattoo",
        processedImageUrl: "https://via.placeholder.com/400x400/000000/FFFFFF?text=Darwin",
        style: "darwin",
        status: "completed",
        comfyDeployRunId: "run-002",
        processingOptions: { quality: 100, transparentBg: true },
        errorMessage: null,
        startedAt: new Date(Date.now() - 240000),
        completedAt: new Date(Date.now() - 180000),
        createdAt: new Date(Date.now() - 240000),
      },
    ];

    sampleJobs.forEach(job => this.stencilJobs.set(job.id, job));
  }

  // User profile methods
  async getUserProfile(id: string): Promise<UserProfile | undefined> {
    return this.userProfiles.get(id);
  }

  async getUserProfileByEmail(email: string): Promise<UserProfile | undefined> {
    return Array.from(this.userProfiles.values()).find(
      (profile) => profile.email === email
    );
  }

  async createUserProfile(insertProfile: InsertUserProfile): Promise<UserProfile> {
    const profile: UserProfile = {
      id: insertProfile.id,
      email: insertProfile.email,
      displayName: insertProfile.displayName || null,
      avatarUrl: insertProfile.avatarUrl || null,
      subscriptionTier: insertProfile.subscriptionTier || "free",
      monthlyCredits: insertProfile.monthlyCredits || 10,
      creditsUsed: insertProfile.creditsUsed || 0,
      totalJobsProcessed: insertProfile.totalJobsProcessed || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userProfiles.set(profile.id, profile);
    return profile;
  }

  async updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | undefined> {
    const profile = this.userProfiles.get(id);
    if (!profile) return undefined;
    
    const updated = { ...profile, ...updates, updatedAt: new Date() };
    this.userProfiles.set(id, updated);
    return updated;
  }

  // Stencil methods
  async getStencilStyles(): Promise<StencilStyle[]> {
    return Array.from(this.stencilStyles.values())
      .filter(style => style.isActive)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  async getStencilStyle(id: string): Promise<StencilStyle | undefined> {
    return this.stencilStyles.get(id);
  }

  async createStencilJob(insertJob: InsertStencilJob): Promise<StencilJob> {
    const id = randomUUID();
    const job: StencilJob = {
      id,
      userId: insertJob.userId,
      originalImageUrl: insertJob.originalImageUrl,
      processedImageUrl: insertJob.processedImageUrl || null,
      style: insertJob.style,
      status: "pending",
      comfyDeployRunId: insertJob.comfyDeployRunId || null,
      processingOptions: insertJob.processingOptions || null,
      errorMessage: null,
      startedAt: null,
      completedAt: null,
      createdAt: new Date(),
    };
    this.stencilJobs.set(id, job);
    return job;
  }

  async updateStencilJob(id: string, updates: Partial<StencilJob>): Promise<StencilJob | undefined> {
    const job = this.stencilJobs.get(id);
    if (!job) return undefined;
    
    const updated = { ...job, ...updates };
    this.stencilJobs.set(id, updated);
    return updated;
  }

  async getStencilJob(id: string): Promise<StencilJob | undefined> {
    return this.stencilJobs.get(id);
  }

  async getStencilJobs(userId?: string): Promise<StencilJob[]> {
    const jobs = Array.from(this.stencilJobs.values());
    return userId 
      ? jobs.filter(job => job.userId === userId)
      : jobs;
  }

  async getGalleryStencils(userId?: string, limit: number = 20): Promise<StencilJob[]> {
    const jobs = Array.from(this.stencilJobs.values())
      .filter(job => job.status === "completed")
      .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0));
    
    const filtered = userId 
      ? jobs.filter(job => job.userId === userId)
      : jobs;
    
    return filtered.slice(0, limit);
  }

  // Flux projects methods
  async getFluxProjects(userId?: string): Promise<FluxProject[]> {
    const projects = Array.from(this.fluxProjects.values());
    return userId 
      ? projects.filter(p => p.userId === userId)
      : projects;
  }

  async createFluxProject(insertProject: InsertFluxProject): Promise<FluxProject> {
    // Simulate project creation delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const id = randomUUID();
    const project: FluxProject = {
      id,
      name: insertProject.name,
      description: insertProject.description || null,
      userId: insertProject.userId,
      prompt: insertProject.prompt || null,
      imageUrl: insertProject.imageUrl || "https://via.placeholder.com/512x512/000080/FFFFFF?text=New+Design",
      settings: insertProject.settings || null,
      isPublic: insertProject.isPublic || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.fluxProjects.set(id, project);
    return project;
  }

  async updateFluxProject(id: string, updates: Partial<FluxProject>): Promise<FluxProject | undefined> {
    const project = this.fluxProjects.get(id);
    if (!project) return undefined;

    const updatedProject = { 
      ...project, 
      ...updates, 
      updatedAt: new Date() 
    };
    
    this.fluxProjects.set(id, updatedProject);
    return updatedProject;
  }

  async regenerateFluxProject(id: string): Promise<FluxProject | undefined> {
    const project = this.fluxProjects.get(id);
    if (!project) return undefined;

    // Simulate regeneration with new image
    const updatedProject = {
      ...project,
      imageUrl: `https://via.placeholder.com/512x512/${Math.floor(Math.random()*16777215).toString(16)}/FFFFFF?text=Regenerated`,
      updatedAt: new Date(),
    };

    this.fluxProjects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteFluxProject(id: string): Promise<boolean> {
    const existed = this.fluxProjects.has(id);
    if (existed) {
      this.fluxProjects.delete(id);
    }
    return existed;
  }

  // Gemini chat methods
  async saveGeminiChat(insertChat: InsertGeminiChat): Promise<GeminiChat> {
    const id = randomUUID();
    const chat: GeminiChat = {
      id,
      userId: insertChat.userId,
      role: insertChat.role,
      message: insertChat.message,
      projectId: insertChat.projectId || null,
      response: insertChat.response || null,
      createdAt: new Date(),
    };

    this.geminiChats.set(id, chat);
    return chat;
  }

  async getGeminiChats(projectId?: string): Promise<GeminiChat[]> {
    const chats = Array.from(this.geminiChats.values());
    return projectId
      ? chats.filter(chat => chat.projectId === projectId)
      : chats;
  }

  // Usage tracking methods
  async trackUsage(insertUsage: InsertUsageTracking): Promise<UsageTracking> {
    const id = randomUUID();
    const usage: UsageTracking = {
      id,
      userId: insertUsage.userId,
      actionType: insertUsage.actionType,
      metadata: insertUsage.metadata || null,
      creditsUsed: insertUsage.creditsUsed || 1,
      createdAt: new Date(),
    };

    this.usageTracking.set(id, usage);
    
    // Update user credits
    const profile = await this.getUserProfile(insertUsage.userId);
    if (profile && profile.creditsUsed !== null) {
      await this.updateUserProfile(insertUsage.userId, {
        creditsUsed: profile.creditsUsed + (insertUsage.creditsUsed || 1),
      });
    }
    
    return usage;
  }

  async getUserUsage(userId: string): Promise<UsageTracking[]> {
    return Array.from(this.usageTracking.values())
      .filter(usage => usage.userId === userId)
      .sort((a, b) => {
        const aTime = a.createdAt ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      });
  }
}

export const storage = new MemStorage();