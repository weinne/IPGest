import { users, igrejas, membros, grupos, membros_grupos, liderancas, pastores, mandatos_pastores, mandatos_liderancas, type User, type InsertUser, type Igreja, type Membro, type InsertMembro, type Grupo, type InsertGrupo, type Lideranca, type InsertLideranca, type Pastor, type InsertPastor, type MandatoPastor, type InsertMandatoPastor, type MandatoLideranca, type InsertMandatoLideranca } from "@shared/schema";
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
  getGrupos(igreja_id: number): Promise<Grupo[]>;
  getLiderancas(igreja_id: number): Promise<Lideranca[]>;
  getPastores(igreja_id: number): Promise<Pastor[]>;
  getMandatosPastores(igreja_id: number): Promise<MandatoPastor[]>;
  getMandatosLiderancas(igreja_id: number): Promise<MandatoLideranca[]>;
  createMembro(membro: InsertMembro & { igreja_id: number }): Promise<Membro>;
  createLideranca(lideranca: InsertLideranca & { igreja_id: number }): Promise<Lideranca>;
  createPastor(pastor: InsertPastor & { igreja_id: number }): Promise<Pastor>;
  createMandatoPastor(mandato: InsertMandatoPastor & { igreja_id: number }): Promise<MandatoPastor>;
  createMandatoLideranca(mandato: InsertMandatoLideranca & { igreja_id: number }): Promise<MandatoLideranca>;
  sessionStore: session.Store;
  createGrupo(grupo: InsertGrupo & { igreja_id: number }): Promise<Grupo>;
  addMembrosToGrupo(grupo_id: number, membros: { membro_id: number; cargo: string }[]): Promise<void>;
  getGrupoMembros(grupo_id: number): Promise<Array<{ membro: Membro; cargo: string }>>;
  deleteMandatoLideranca(id: number): Promise<void>;
  deleteMandatoPastor(id: number): Promise<void>;
  updateMandatoLideranca(id: number, mandato: Partial<InsertMandatoLideranca> & { igreja_id: number }): Promise<MandatoLideranca>;
  updateMandatoPastor(id: number, mandato: Partial<InsertMandatoPastor> & { igreja_id: number }): Promise<MandatoPastor>;
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

  async getMandatosPastores(igreja_id: number): Promise<MandatoPastor[]> {
    return await db.select().from(mandatos_pastores).where(eq(mandatos_pastores.igreja_id, igreja_id));
  }

  async getMandatosLiderancas(igreja_id: number): Promise<MandatoLideranca[]> {
    return await db.select().from(mandatos_liderancas).where(eq(mandatos_liderancas.igreja_id, igreja_id));
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
    const [novaLideranca] = await db.insert(liderancas).values(lideranca).returning();
    return novaLideranca;
  }

  async createPastor(pastor: InsertPastor & { igreja_id: number }): Promise<Pastor> {
    const [novoPastor] = await db.insert(pastores).values(pastor).returning();
    return novoPastor;
  }

  async createMandatoPastor(mandato: InsertMandatoPastor & { igreja_id: number }): Promise<MandatoPastor> {
    const [novoMandato] = await db.insert(mandatos_pastores).values({
      ...mandato,
      data_eleicao: new Date(mandato.data_eleicao),
      data_inicio: new Date(mandato.data_inicio),
      data_fim: mandato.data_fim ? new Date(mandato.data_fim) : null,
    }).returning();
    return novoMandato;
  }

  async createMandatoLideranca(mandato: InsertMandatoLideranca & { igreja_id: number }): Promise<MandatoLideranca> {
    const [novoMandato] = await db.insert(mandatos_liderancas).values({
      ...mandato,
      data_eleicao: new Date(mandato.data_eleicao),
      data_inicio: new Date(mandato.data_inicio),
      data_fim: mandato.data_fim ? new Date(mandato.data_fim) : null,
    }).returning();
    return novoMandato;
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
  async deleteMandatoLideranca(id: number): Promise<void> {
    await db.delete(mandatos_liderancas).where(eq(mandatos_liderancas.id, id));
  }

  async deleteMandatoPastor(id: number): Promise<void> {
    await db.delete(mandatos_pastores).where(eq(mandatos_pastores.id, id));
  }
  async updateMandatoLideranca(id: number, mandato: Partial<InsertMandatoLideranca> & { igreja_id: number }): Promise<MandatoLideranca> {
    const [updatedMandato] = await db
      .update(mandatos_liderancas)
      .set({
        ...mandato,
        data_eleicao: mandato.data_eleicao ? new Date(mandato.data_eleicao) : undefined,
        data_inicio: mandato.data_inicio ? new Date(mandato.data_inicio) : undefined,
        data_fim: mandato.data_fim ? new Date(mandato.data_fim) : null,
      })
      .where(eq(mandatos_liderancas.id, id))
      .returning();
    return updatedMandato;
  }

  async updateMandatoPastor(id: number, mandato: Partial<InsertMandatoPastor> & { igreja_id: number }): Promise<MandatoPastor> {
    const [updatedMandato] = await db
      .update(mandatos_pastores)
      .set({
        ...mandato,
        data_eleicao: mandato.data_eleicao ? new Date(mandato.data_eleicao) : undefined,
        data_inicio: mandato.data_inicio ? new Date(mandato.data_inicio) : undefined,
        data_fim: mandato.data_fim ? new Date(mandato.data_fim) : null,
      })
      .where(eq(mandatos_pastores.id, id))
      .returning();
    return updatedMandato;
  }
}

export const storage = new DatabaseStorage();