import { type User, type InsertUser, type StencilModel, type StencilResult, type FluxProject, type GeminiChat, type InsertStencilResult, type InsertFluxProject, type InsertGeminiChat } from "@shared/schema";
import { randomUUID } from "crypto";

// Interface for stencil processing
interface StencilProcessRequest {
  imageBuffer: Buffer;
  modelId: string;
  originalName: string;
  mimeType: string;
}

// Modify the interface with required CRUD methods
export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Stencil methods
  getStencilModels(): Promise<StencilModel[]>;
  processStencil(request: StencilProcessRequest): Promise<StencilResult>;
  getStencilResults(userId?: string): Promise<StencilResult[]>;
  
  // Flux Kontext methods
  getFluxProjects(userId?: string): Promise<FluxProject[]>;
  createFluxProject(project: InsertFluxProject): Promise<FluxProject>;
  updateFluxProject(id: string, updates: Partial<FluxProject>): Promise<FluxProject | undefined>;
  regenerateFluxProject(id: string): Promise<FluxProject | undefined>;
  
  // Gemini chat methods
  saveGeminiChat(chat: InsertGeminiChat): Promise<GeminiChat>;
  getGeminiChats(projectId?: string): Promise<GeminiChat[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private stencilModels: Map<string, StencilModel>;
  private stencilResults: Map<string, StencilResult>;
  private fluxProjects: Map<string, FluxProject>;
  private geminiChats: Map<string, GeminiChat>;

  constructor() {
    this.users = new Map();
    this.stencilModels = new Map();
    this.stencilResults = new Map();
    this.fluxProjects = new Map();
    this.geminiChats = new Map();
    
    this.initializeStencilModels();
    this.initializeSampleData();
  }

  // Initialize sample stencil models
  private initializeStencilModels() {
    const models: StencilModel[] = [
      {
        id: "model-1",
        name: "Classic Stencil",
        description: "Modelo clásico para stencils tradicionales",
        active: true,
        createdAt: new Date(),
      },
      {
        id: "model-2",
        name: "High Contrast",
        description: "Mayor contraste para diseños detallados",
        active: true,
        createdAt: new Date(),
      },
      {
        id: "model-3",
        name: "Artistic Style",
        description: "Estilo artístico avanzado",
        active: true,
        createdAt: new Date(),
      },
    ];

    models.forEach(model => this.stencilModels.set(model.id, model));
  }

  // Initialize sample data for demonstration
  private initializeSampleData() {
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
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        userId: "demo-user",
        name: "Poster Musical",
        description: "Poster para evento de música electrónica",
        prompt: "Design a vibrant poster for an electronic music event",
        imageUrl: "https://via.placeholder.com/512x512/FF00FF/FFFFFF?text=Music",
        settings: { style: "vibrant", colors: ["#FF00FF", "#00FFFF"] },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleProjects.forEach(project => this.fluxProjects.set(project.id, project));
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Stencil methods
  async getStencilModels(): Promise<StencilModel[]> {
    return Array.from(this.stencilModels.values());
  }

  async processStencil(request: StencilProcessRequest): Promise<StencilResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const id = randomUUID();
    const model = this.stencilModels.get(request.modelId);
    
    // Simulate stencil processing result
    const result: StencilResult = {
      id,
      userId: "demo-user", // In real app, get from session
      modelId: request.modelId,
      originalImageUrl: "https://via.placeholder.com/512x512/CCCCCC/000000?text=Original",
      resultImageUrl: "https://via.placeholder.com/512x512/000000/FFFFFF?text=Stencil",
      modelUsed: model?.name || "Unknown Model",
      processingTime: "2.5s",
      createdAt: new Date(),
    };

    this.stencilResults.set(id, result);
    return result;
  }

  async getStencilResults(userId?: string): Promise<StencilResult[]> {
    const results = Array.from(this.stencilResults.values());
    return userId ? results.filter(r => r.userId === userId) : results;
  }

  // Flux Kontext methods
  async getFluxProjects(userId?: string): Promise<FluxProject[]> {
    const projects = Array.from(this.fluxProjects.values());
    return userId ? projects.filter(p => p.userId === userId) : projects;
  }

  async createFluxProject(insertProject: InsertFluxProject): Promise<FluxProject> {
    // Simulate project creation delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const id = randomUUID();
    const project: FluxProject = {
      id,
      name: insertProject.name,
      description: insertProject.description || null,
      userId: insertProject.userId || "demo-user",
      prompt: insertProject.prompt || null,
      imageUrl: "https://via.placeholder.com/512x512/000080/FFFFFF?text=New+Design",
      settings: insertProject.settings || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.fluxProjects.set(id, project);
    return project;
  }

  async updateFluxProject(id: string, updates: Partial<FluxProject>): Promise<FluxProject | undefined> {
    const project = this.fluxProjects.get(id);
    if (!project) return undefined;

    const updatedProject: FluxProject = {
      ...project,
      ...updates,
      updatedAt: new Date(),
    };

    this.fluxProjects.set(id, updatedProject);
    return updatedProject;
  }

  async regenerateFluxProject(id: string): Promise<FluxProject | undefined> {
    const project = this.fluxProjects.get(id);
    if (!project) return undefined;

    // Simulate regeneration delay
    await new Promise(resolve => setTimeout(resolve, 4000));

    const updatedProject: FluxProject = {
      ...project,
      imageUrl: `https://via.placeholder.com/512x512/00${Math.floor(Math.random() * 16).toString(16)}0${Math.floor(Math.random() * 16).toString(16)}${Math.floor(Math.random() * 16).toString(16)}${Math.floor(Math.random() * 16).toString(16)}/FFFFFF?text=Regenerated`,
      updatedAt: new Date(),
    };

    this.fluxProjects.set(id, updatedProject);
    return updatedProject;
  }

  // Gemini chat methods
  async saveGeminiChat(insertChat: InsertGeminiChat): Promise<GeminiChat> {
    const id = randomUUID();
    const chat: GeminiChat = {
      id,
      role: insertChat.role,
      message: insertChat.message,
      response: insertChat.response || null,
      projectId: insertChat.projectId || null,
      userId: insertChat.userId || "demo-user",
      createdAt: new Date(),
    };

    this.geminiChats.set(id, chat);
    return chat;
  }

  async getGeminiChats(projectId?: string): Promise<GeminiChat[]> {
    const chats = Array.from(this.geminiChats.values());
    return projectId ? chats.filter(c => c.projectId === projectId) : chats;
  }
}

export const storage = new MemStorage();
