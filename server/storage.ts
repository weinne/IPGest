import { users, igrejas, membros, grupos, membros_grupos, liderancas, pastores, type User, type InsertUser, type Igreja, type Membro, type InsertMembro, type Grupo, type InsertGrupo, type Lideranca, type InsertLideranca, type Pastor, type InsertPastor } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
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
  getGrupos(igreja_id: number): Promise<Grupo[]>;
  getLiderancas(igreja_id: number): Promise<Lideranca[]>;
  getPastores(igreja_id: number): Promise<Pastor[]>;
  createMembro(membro: InsertMembro & { igreja_id: number }): Promise<Membro>;
  createLideranca(lideranca: InsertLideranca & { igreja_id: number }): Promise<Lideranca>;
  createPastor(pastor: InsertPastor & { igreja_id: number }): Promise<Pastor>;
  sessionStore: session.Store;
  createGrupo(grupo: InsertGrupo & { igreja_id: number }): Promise<Grupo>;
  addMembrosToGrupo(grupo_id: number, membros: { membro_id: number; cargo: string }[]): Promise<void>;
  getGrupoMembros(grupo_id: number): Promise<Array<{ membro: Membro; cargo: string }>>;
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

  async getGrupos(igreja_id: number): Promise<Grupo[]> {
    return await db.select().from(grupos).where(eq(grupos.igreja_id, igreja_id));
  }

  async getLiderancas(igreja_id: number): Promise<Lideranca[]> {
    return await db.select().from(liderancas).where(eq(liderancas.igreja_id, igreja_id));
  }

  async getPastores(igreja_id: number): Promise<Pastor[]> {
    return await db.select().from(pastores).where(eq(pastores.igreja_id, igreja_id));
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

  async createMembro(membro: InsertMembro & { igreja_id: number }): Promise<Membro> {
    const [novoMembro] = await db.insert(membros).values({
      ...membro,
      data_admissao: new Date(),
      data_nascimento: membro.data_nascimento ? new Date(membro.data_nascimento) : null,
    }).returning();
    return novoMembro;
  }

  async createLideranca(lideranca: InsertLideranca & { igreja_id: number }): Promise<Lideranca> {
    const [novaLideranca] = await db.insert(liderancas).values({
      ...lideranca,
      data_eleicao: new Date(),
      data_inicio: new Date(),
    }).returning();
    return novaLideranca;
  }

  async createPastor(pastor: InsertPastor & { igreja_id: number }): Promise<Pastor> {
    const [novoPastor] = await db.insert(pastores).values({
      ...pastor,
      data_inicio: new Date(),
    }).returning();
    return novoPastor;
  }

  async createGrupo(grupo: InsertGrupo & { igreja_id: number }): Promise<Grupo> {
    const { membros, ...grupoData } = grupo;
    const [novoGrupo] = await db.insert(grupos).values(grupoData).returning();

    if (membros && membros.length > 0) {
      await this.addMembrosToGrupo(novoGrupo.id, membros);
    }

    return novoGrupo;
  }

  async addMembrosToGrupo(grupo_id: number, membros: { membro_id: number; cargo: string }[]): Promise<void> {
    await db.insert(membros_grupos).values(
      membros.map(m => ({
        grupo_id,
        membro_id: m.membro_id,
        cargo: m.cargo,
      }))
    );
  }

  async getGrupoMembros(grupo_id: number): Promise<Array<{ membro: Membro; cargo: string }>> {
    const result = await db
      .select({
        membro: membros,
        cargo: membros_grupos.cargo,
      })
      .from(membros_grupos)
      .innerJoin(membros, eq(membros.id, membros_grupos.membro_id))
      .where(eq(membros_grupos.grupo_id, grupo_id));

    return result.map(r => ({
      membro: r.membro,
      cargo: r.cargo,
    }));
  }
}

export const storage = new DatabaseStorage();