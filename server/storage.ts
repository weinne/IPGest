import { users, igrejas, membros, grupos, liderancas, type User, type InsertUser, type Igreja, type Membro, type Grupo, type Lideranca } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createIgreja(igreja: Omit<Igreja, "id">): Promise<Igreja>;
  getMembros(igreja_id: number): Promise<Membro[]>;
  createMembro(membro: Omit<Membro, "id">): Promise<Membro>;
  getGrupos(igreja_id: number): Promise<Grupo[]>;
  createGrupo(grupo: Omit<Grupo, "id">): Promise<Grupo>;
  getLiderancas(igreja_id: number): Promise<Lideranca[]>;
  createLideranca(lideranca: Omit<Lideranca, "id">): Promise<Lideranca>;
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createIgreja(igreja: Omit<Igreja, "id">): Promise<Igreja> {
    const [novaIgreja] = await db.insert(igrejas).values(igreja).returning();
    return novaIgreja;
  }

  async getMembros(igreja_id: number): Promise<Membro[]> {
    return await db.select().from(membros).where(eq(membros.igreja_id, igreja_id));
  }

  async createMembro(membro: Omit<Membro, "id">): Promise<Membro> {
    const [novoMembro] = await db.insert(membros).values(membro).returning();
    return novoMembro;
  }

  async getGrupos(igreja_id: number): Promise<Grupo[]> {
    return await db.select().from(grupos).where(eq(grupos.igreja_id, igreja_id));
  }

  async createGrupo(grupo: Omit<Grupo, "id">): Promise<Grupo> {
    const [novoGrupo] = await db.insert(grupos).values(grupo).returning();
    return novoGrupo;
  }

  async getLiderancas(igreja_id: number): Promise<Lideranca[]> {
    return await db.select().from(liderancas).where(eq(liderancas.igreja_id, igreja_id));
  }

  async createLideranca(lideranca: Omit<Lideranca, "id">): Promise<Lideranca> {
    const [novaLideranca] = await db.insert(liderancas).values(lideranca).returning();
    return novaLideranca;
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
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        role: "admin",
        igreja_id: igreja.id,
      })
      .returning();

    return user;
  }
}

export const storage = new DatabaseStorage();