import { type User, type InsertUser, type Igreja } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createIgreja(igreja: Omit<Igreja, "id">): Promise<Igreja>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private igrejas: Map<number, Igreja>;
  private currentUserId: number;
  private currentIgrejaId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.igrejas = new Map();
    this.currentUserId = 1;
    this.currentIgrejaId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createIgreja(igreja: Omit<Igreja, "id">): Promise<Igreja> {
    const id = this.currentIgrejaId++;
    const novaIgreja = { ...igreja, id };
    this.igrejas.set(id, novaIgreja);
    return novaIgreja;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const {
      igreja_nome,
      igreja_cidade,
      igreja_estado,
      igreja_presbitero,
      ...userData
    } = insertUser;

    // Create igreja first
    const igreja = await this.createIgreja({
      nome: igreja_nome,
      cidade: igreja_cidade,
      estado: igreja_estado,
      presbitero: igreja_presbitero,
    });

    // Then create user associated with igreja
    const id = this.currentUserId++;
    const user: User = {
      ...userData,
      id,
      role: "admin",
      igreja_id: igreja.id,
    };
    
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
