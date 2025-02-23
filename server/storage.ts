import { users, igrejas, type User, type InsertUser, type Igreja } from "@shared/schema";
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