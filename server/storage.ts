import { users, igrejas, membros, grupos, membros_grupos, liderancas, pastores, mandatos_pastores, mandatos_liderancas, type User, type InsertUser, type Igreja, type Membro, type InsertMembro, type Grupo, type InsertGrupo, type Lideranca, type InsertLideranca, type Pastor, type InsertPastor, type MandatoPastor, type InsertMandatoPastor, type MandatoLideranca, type InsertMandatoLideranca } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, gt } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { sql } from 'drizzle-orm/sql';

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
  deleteMembro(id: number): Promise<void>;
  deleteGrupo(id: number): Promise<void>;
  updateMembro(id: number, membro: Partial<InsertMembro> & { igreja_id: number }): Promise<Membro>;
  updateGrupo(id: number, grupo: Partial<InsertGrupo> & { igreja_id: number }): Promise<Grupo>;
  getUsersByIgreja(igreja_id: number): Promise<User[]>;

  // Reports methods
  getMembrosWithFilters(igreja_id: number, filters: {
    tipo?: string;
    sexo?: string;
    status?: string;
    data_admissao_inicio?: Date;
    data_admissao_fim?: Date;
  }): Promise<Membro[]>;

  getEstatisticas(igreja_id: number, periodo?: {
    inicio: Date;
    fim: Date;
  }): Promise<{
    admissoes: {
      batismo: number;
      profissao_fe: number;
      transferencia: number;
    };
    membros: {
      por_tipo: {
        comungantes: number;
        nao_comungantes: number;
      };
      por_sexo: {
        masculino: number;
        feminino: number;
      };
    };
    sociedades: Array<{
      id: number;
      nome: string;
      tipo: string;
      membros_count: number;
    }>;
    lideranca: {
      pastores: number;
      presbiteros: number;
      diaconos: number;
    };
  }>;

  getOcorrencias(igreja_id: number, periodo?: {
    inicio: Date;
    fim: Date;
  }): Promise<Array<{
    tipo: string;
    acao: string;
    data: Date;
    descricao: string;
  }>>;

  getGraficosData(igreja_id: number): Promise<{
    crescimento_mensal: Array<{
      mes: Date;
      total: number;
    }>;
    distribuicao_tipos: {
      comungantes: number;
      nao_comungantes: number;
    };
    distribuicao_sociedades: Array<{
      sociedade: string;
      total: number;
    }>;
    distribuicao_idade: {
      jovens: number;
      adultos: number;
      idosos: number;
    };
  }>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  updateIgreja(id: number, data: Partial<Igreja>): Promise<Igreja>;
  updateUserPassword(id: number, newPassword: string): Promise<void>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  setResetToken(userId: number, token: string, expiry: Date): Promise<void>;
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

    // Se já temos igreja_id, não criar nova igreja
    if (userData.igreja_id) {
      const [user] = await db
        .insert(users)
        .values(userData)
        .returning();
      return user;
    }

    // Se não temos igreja_id, criar nova igreja primeiro
    const igreja = await this.createIgreja({
      nome: igreja_nome,
      cidade: igreja_cidade,
      estado: igreja_estado,
      presbitero: igreja_presbitero,
    });

    // Então criar usuário associado com igreja
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        role: "administrador", // Primeiro usuário sempre será administrador
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
  async deleteMembro(id: number): Promise<void> {
    // First check if member has any dependencies
    const [lideranca] = await db.select().from(liderancas).where(eq(liderancas.membro_id, id));
    const [grupoMembro] = await db.select().from(membros_grupos).where(eq(membros_grupos.membro_id, id));

    if (lideranca) {
      throw new Error("Não é possível excluir este membro pois ele está cadastrado como liderança.");
    }

    if (grupoMembro) {
      throw new Error("Não é possível excluir este membro pois ele está cadastrado em um ou mais grupos.");
    }

    await db.delete(membros).where(eq(membros.id, id));
  }

  async deleteGrupo(id: number): Promise<void> {
    // Delete related records first
    await db.delete(membros_grupos).where(eq(membros_grupos.grupo_id, id));
    await db.delete(grupos).where(eq(grupos.id, id));
  }

  async updateMembro(id: number, membro: Partial<InsertMembro> & { igreja_id: number }): Promise<Membro> {
    const [updatedMembro] = await db
      .update(membros)
      .set({
        ...membro,
        data_nascimento: membro.data_nascimento ? new Date(membro.data_nascimento) : undefined,
      })
      .where(eq(membros.id, id))
      .returning();
    return updatedMembro;
  }

  async updateGrupo(id: number, grupo: Partial<InsertGrupo> & { igreja_id: number }): Promise<Grupo> {
    const { membros: membrosData, ...grupoData } = grupo;
    const [updatedGrupo] = await db
      .update(grupos)
      .set(grupoData)
      .where(eq(grupos.id, id))
      .returning();

    if (membrosData) {
      // Delete existing members
      await db.delete(membros_grupos).where(eq(membros_grupos.grupo_id, id));
      // Add new members
      if (membrosData.length > 0) {
        await this.addMembrosToGrupo(id, membrosData);
      }
    }

    return updatedGrupo;
  }
  async getUsersByIgreja(igreja_id: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.igreja_id, igreja_id));
  }

  async getMembrosWithFilters(igreja_id: number, filters: {
    tipo?: string;
    sexo?: string;
    status?: string;
    data_admissao_inicio?: Date;
    data_admissao_fim?: Date;
  }): Promise<Membro[]> {
    let query = db
      .select()
      .from(membros)
      .where(eq(membros.igreja_id, igreja_id));

    if (filters.tipo) {
      query = query.where(eq(membros.tipo, filters.tipo));
    }
    if (filters.sexo) {
      query = query.where(eq(membros.sexo, filters.sexo));
    }
    if (filters.status) {
      query = query.where(eq(membros.status, filters.status));
    }
    if (filters.data_admissao_inicio && filters.data_admissao_fim) {
      query = query.where(
        and(
          gte(membros.data_admissao, filters.data_admissao_inicio),
          lte(membros.data_admissao, filters.data_admissao_fim)
        )
      );
    }

    return await query;
  }

  async getEstatisticas(igreja_id: number, periodo?: {
    inicio: Date;
    fim: Date;
  }): Promise<{
    admissoes: {
      batismo: number;
      profissao_fe: number;
      transferencia: number;
    };
    membros: {
      por_tipo: {
        comungantes: number;
        nao_comungantes: number;
      };
      por_sexo: {
        masculino: number;
        feminino: number;
      };
    };
    sociedades: Array<{
      id: number;
      nome: string;
      tipo: string;
      membros_count: number;
    }>;
    lideranca: {
      pastores: number;
      presbiteros: number;
      diaconos: number;
    };
  }> {
    const [admissoesPorTipo] = await db
      .select({
        batismo: sql<number>`COUNT(CASE WHEN tipo_admissao = 'batismo' THEN 1 END)`,
        profissao_fe: sql<number>`COUNT(CASE WHEN tipo_admissao = 'profissao_fe' THEN 1 END)`,
        transferencia: sql<number>`COUNT(CASE WHEN tipo_admissao = 'transferencia' THEN 1 END)`
      })
      .from(membros)
      .where(
        and(
          eq(membros.igreja_id, igreja_id),
          periodo?.inicio ? gte(membros.data_admissao, periodo.inicio) : undefined,
          periodo?.fim ? lte(membros.data_admissao, periodo.fim) : undefined
        )
      );

    const [membrosPorTipo] = await db
      .select({
        comungantes: sql<number>`COUNT(CASE WHEN tipo = 'comungante' THEN 1 END)`,
        nao_comungantes: sql<number>`COUNT(CASE WHEN tipo = 'nao_comungante' THEN 1 END)`
      })
      .from(membros)
      .where(
        and(
          eq(membros.igreja_id, igreja_id),
          eq(membros.status, 'ativo')
        )
      );

    const [membrosPorSexo] = await db
      .select({
        masculino: sql<number>`COUNT(CASE WHEN sexo = 'masculino' THEN 1 END)`,
        feminino: sql<number>`COUNT(CASE WHEN sexo = 'feminino' THEN 1 END)`
      })
      .from(membros)
      .where(
        and(
          eq(membros.igreja_id, igreja_id),
          eq(membros.status, 'ativo')
        )
      );

    const sociedadesInternas = await db
      .select({
        id: grupos.id,
        nome: grupos.nome,
        tipo: grupos.tipo,
        membros_count: sql<number>`COUNT(membros_grupos.membro_id)`
      })
      .from(grupos)
      .leftJoin(membros_grupos, eq(grupos.id, membros_grupos.grupo_id))
      .where(eq(grupos.igreja_id, igreja_id))
      .groupBy(grupos.id, grupos.nome, grupos.tipo);

    const [liderancasCount] = await db
      .select({
        pastores: sql<number>`COUNT(DISTINCT pastores.id)`,
        presbiteros: sql<number>`COUNT(DISTINCT CASE WHEN liderancas.cargo = 'presbitero' THEN liderancas.id END)`,
        diaconos: sql<number>`COUNT(DISTINCT CASE WHEN liderancas.cargo = 'diacono' THEN liderancas.id END)`
      })
      .from(liderancas)
      .leftJoin(pastores, eq(pastores.igreja_id, igreja_id))
      .where(eq(liderancas.igreja_id, igreja_id));

    return {
      admissoes: admissoesPorTipo,
      membros: {
        por_tipo: membrosPorTipo,
        por_sexo: membrosPorSexo
      },
      sociedades: sociedadesInternas,
      lideranca: liderancasCount
    };
  }

  async getOcorrencias(igreja_id: number, periodo?: {
    inicio: Date;
    fim: Date;
  }): Promise<Array<{
    tipo: string;
    acao: string;
    data: Date;
    descricao: string;
  }>> {
    const membrosOcorrencias = await db
      .select({
        tipo: sql<string>`'membro'`,
        acao: sql<string>`CASE 
          WHEN data_exclusao IS NOT NULL THEN 'exclusao'
          ELSE 'admissao'
        END`,
        data: sql<Date>`COALESCE(data_exclusao, data_admissao)`,
        descricao: sql<string>`CONCAT(nome, ' - ', 
          CASE 
            WHEN data_exclusao IS NOT NULL THEN CONCAT('Excluído por ', motivo_exclusao)
            ELSE CONCAT('Admitido por ', tipo_admissao)
          END
        )`
      })
      .from(membros)
      .where(
        and(
          eq(membros.igreja_id, igreja_id),
          periodo?.inicio ? gte(membros.data_admissao, periodo.inicio) : undefined,
          periodo?.fim ? lte(membros.data_admissao, periodo.fim) : undefined
        )
      );

    const liderancasOcorrencias = await db
      .select({
        tipo: sql<string>`'lideranca'`,
        acao: sql<string>`CASE 
          WHEN data_fim IS NOT NULL THEN 'fim_mandato'
          ELSE 'inicio_mandato'
        END`,
        data: sql<Date>`COALESCE(data_fim, data_inicio)`,
        descricao: sql<string>`CONCAT(
          CASE 
            WHEN data_fim IS NOT NULL THEN 'Fim do mandato de '
            ELSE 'Início do mandato de '
          END,
          liderancas.cargo
        )`
      })
      .from(mandatos_liderancas)
      .innerJoin(liderancas, eq(mandatos_liderancas.lideranca_id, liderancas.id))
      .where(
        and(
          eq(mandatos_liderancas.igreja_id, igreja_id),
          periodo?.inicio ? gte(mandatos_liderancas.data_inicio, periodo.inicio) : undefined,
          periodo?.fim ? lte(mandatos_liderancas.data_fim, periodo.fim) : undefined
        )
      );

    const pastoresOcorrencias = await db
      .select({
        tipo: sql<string>`'pastor'`,
        acao: sql<string>`CASE 
          WHEN data_fim IS NOT NULL THEN 'fim_mandato'
          ELSE 'inicio_mandato'
        END`,
        data: sql<Date>`COALESCE(data_fim, data_inicio)`,
        descricao: sql<string>`CONCAT(
          pastores.nome,
          CASE 
            WHEN data_fim IS NOT NULL THEN ' - Fim do mandato'
            ELSE ' - Início do mandato'
          END
        )`
      })
      .from(mandatos_pastores)
      .innerJoin(pastores, eq(mandatos_pastores.pastor_id, pastores.id))
      .where(
        and(
          eq(mandatos_pastores.igreja_id, igreja_id),
          periodo?.inicio ? gte(mandatos_pastores.data_inicio, periodo.inicio) : undefined,
          periodo?.fim ? lte(mandatos_pastores.data_fim, periodo.fim) : undefined
        )
      );

    return [...membrosOcorrencias, ...liderancasOcorrencias, ...pastoresOcorrencias]
      .sort((a, b) => b.data.getTime() - a.data.getTime());
  }

  async getGraficosData(igreja_id: number): Promise<{
    crescimento_mensal: Array<{
      mes: Date;
      total: number;
    }>;
    distribuicao_tipos: {
      comungantes: number;
      nao_comungantes: number;
    };
    distribuicao_sociedades: Array<{
      sociedade: string;
      total: number;
    }>;
    distribuicao_idade: {
      jovens: number;
      adultos: number;
      idosos: number;
    };
  }> {
    const crescimentoMensal = await db
      .select({
        mes: sql<Date>`DATE_TRUNC('month', data_admissao)::date`,
        total: sql<number>`COUNT(*)`
      })
      .from(membros)
      .where(
        and(
          eq(membros.igreja_id, igreja_id),
          gte(membros.data_admissao, sql`NOW() - INTERVAL '1 year'`)
        )
      )
      .groupBy(sql`DATE_TRUNC('month', data_admissao)`)
      .orderBy(sql`DATE_TRUNC('month', data_admissao)`);

    const [distribuicaoTipos] = await db
      .select({
        comungantes: sql<number>`COUNT(CASE WHEN tipo = 'comungante' THEN 1 END)`,
        nao_comungantes: sql<number>`COUNT(CASE WHEN tipo = 'nao_comungante' THEN 1 END)`
      })
      .from(membros)
      .where(
        and(
          eq(membros.igreja_id, igreja_id),
          eq(membros.status, 'ativo')
        )
      );

    const distribuicaoSociedades = await db
      .select({
        sociedade: grupos.nome,
        total: sql<number>`COUNT(membros_grupos.membro_id)`
      })
      .from(grupos)
      .leftJoin(membros_grupos, eq(grupos.id, membros_grupos.grupo_id))
      .where(eq(grupos.igreja_id, igreja_id))
      .groupBy(grupos.id, grupos.nome);

    const [distribuicaoIdade] = await db
      .select({
        jovens: sql<number>`COUNT(CASE WHEN EXTRACT(YEAR FROM AGE(NOW(), data_nascimento)) < 30 THEN 1 END)`,
        adultos: sql<number>`COUNT(CASE WHEN EXTRACT(YEAR FROM AGE(NOW(), data_nascimento)) BETWEEN 30 AND 59 THEN 1 END)`,
        idosos: sql<number>`COUNT(CASE WHEN EXTRACT(YEAR FROM AGE(NOW(), data_nascimento)) >= 60 THEN 1 END)`
      })
      .from(membros)
      .where(
        and(
          eq(membros.igreja_id, igreja_id),
          eq(membros.status, 'ativo')
        )
      );

    return {
      crescimento_mensal,
      distribuicao_tipos: distribuicaoTipos,
      distribuicao_sociedades,
      distribuicao_idade: distribuicaoIdade
    };
  }
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateIgreja(id: number, data: Partial<Igreja>): Promise<Igreja> {
    // Remove campos undefined/null/empty string
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    const [updatedIgreja] = await db
      .update(igrejas)
      .set(cleanData)
      .where(eq(igrejas.id, id))
      .returning();
    return updatedIgreja;
  }

  async updateUserPassword(id: number, newPassword: string): Promise<void> {
    await db
      .update(users)
      .set({
        password: newPassword,
        reset_token: null,
        reset_token_expiry: null
      })
      .where(eq(users.id, id));
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.reset_token, token),
          gt(users.reset_token_expiry!, new Date())
        )
      );
    return user;
  }

  async setResetToken(userId: number, token: string, expiry: Date): Promise<void> {
    await db
      .update(users)
      .set({
        reset_token: token,
        reset_token_expiry: expiry
      })
      .where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();