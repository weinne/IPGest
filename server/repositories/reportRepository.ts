import { sql, eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { BaseRepository } from './baseRepository';
import { IReportRepository } from './types';
import { membros, grupos, liderancas, pastores } from '@shared/schema';
import type { Membro } from '@shared/schema';
import * as schema from '@shared/schema';

interface EstatisticasResult {
  membros: {
    por_tipo: { comungantes: number; nao_comungantes: number };
    por_sexo: { masculino: number; feminino: number };
  };
  admissoes: {
    batismo: number;
    profissao_fe: number;
    transferencia: number;
  };
  lideranca: {
    pastores: number;
    presbiteros: number;
    diaconos: number;
  };
}

export class ReportRepository extends BaseRepository<any> implements IReportRepository {
  constructor(db: NodePgDatabase<typeof schema>) {
    super(db, membros, 'reports');
  }

  async getMembrosWithFilters(igreja_id: number, filters: {
    tipo?: 'comungante' | 'nao_comungante';
    sexo?: 'masculino' | 'feminino';
    status?: 'ativo' | 'inativo';
    data_admissao_inicio?: Date;
    data_admissao_fim?: Date;
  }): Promise<Membro[]> {
    // Construir as condições de consulta como um array
    const conditions = [eq(membros.igreja_id, igreja_id)];
    
    if (filters.tipo) {
      conditions.push(eq(membros.tipo, filters.tipo));
    }
    if (filters.sexo) {
      conditions.push(eq(membros.sexo, filters.sexo));
    }
    if (filters.status) {
      conditions.push(eq(membros.status, filters.status));
    }
    if (filters.data_admissao_inicio) {
      conditions.push(sql`${membros.data_admissao} >= ${filters.data_admissao_inicio}`);
    }
    if (filters.data_admissao_fim) {
      conditions.push(sql`${membros.data_admissao} <= ${filters.data_admissao_fim}`);
    }
    
    // Aplicar todas as condições de uma vez
    return await this.db
      .select()
      .from(membros)
      .where(and(...conditions));
  }

  async getEstatisticas(igreja_id: number, periodo?: { inicio: Date; fim: Date; }) {
    const result = await this.db.execute(sql`
      WITH stats AS (
        SELECT 
          COUNT(*) FILTER (WHERE tipo = 'comungante') as comungantes,
          COUNT(*) FILTER (WHERE tipo = 'nao_comungante') as nao_comungantes,
          COUNT(*) FILTER (WHERE sexo = 'M') as masculino,
          COUNT(*) FILTER (WHERE sexo = 'F') as feminino,
          COUNT(*) FILTER (WHERE forma_admissao = 'batismo') as batismo,
          COUNT(*) FILTER (WHERE forma_admissao = 'profissao_fe') as profissao_fe,
          COUNT(*) FILTER (WHERE forma_admissao = 'transferencia') as transferencia,
          COUNT(*) FILTER (WHERE cargo = 'pastor') as pastores,
          COUNT(*) FILTER (WHERE cargo = 'presbitero') as presbiteros,
          COUNT(*) FILTER (WHERE cargo = 'diacono') as diaconos
        FROM membros
        WHERE igreja_id = ${igreja_id}
        ${periodo ? sql`AND data_admissao BETWEEN ${periodo.inicio} AND ${periodo.fim}` : sql``}
      )
      SELECT json_build_object(
        'membros', json_build_object(
          'por_tipo', json_build_object(
            'comungantes', comungantes,
            'nao_comungantes', nao_comungantes
          ),
          'por_sexo', json_build_object(
            'masculino', masculino,
            'feminino', feminino
          )
        ),
        'admissoes', json_build_object(
          'batismo', batismo,
          'profissao_fe', profissao_fe,
          'transferencia', transferencia
        ),
        'lideranca', json_build_object(
          'pastores', pastores,
          'presbiteros', presbiteros,
          'diaconos', diaconos
        )
      ) as stats
      FROM stats
    `);

    // Acessando a primeira linha do resultado
    const estatisticas = result.rows[0]?.stats as EstatisticasResult || {
      membros: { por_tipo: { comungantes: 0, nao_comungantes: 0 }, por_sexo: { masculino: 0, feminino: 0 } },
      admissoes: { batismo: 0, profissao_fe: 0, transferencia: 0 },
      lideranca: { pastores: 0, presbiteros: 0, diaconos: 0 }
    };

    const sociedades = await this.db
      .select({
        id: grupos.id,
        nome: grupos.nome,
        tipo: grupos.tipo,
        membros_count: sql<number>`COUNT(DISTINCT membros.id)`
      })
      .from(grupos)
      .leftJoin(membros, sql`membros.grupo_id = grupos.id`)
      .where(eq(grupos.igreja_id, igreja_id))
      .groupBy(grupos.id);

    return {
      membros: estatisticas.membros,
      admissoes: estatisticas.admissoes,
      lideranca: estatisticas.lideranca,
      sociedades
    };
  }

  async getGraficosData(igreja_id: number) {
    const crescimentoResult = await this.db.execute(sql`
      SELECT 
        date_trunc('month', data_admissao) as mes,
        COUNT(*) as total
      FROM membros
      WHERE igreja_id = ${igreja_id}
      GROUP BY mes
      ORDER BY mes
    `);

    const distribuicaoIdadeResult = await this.db.execute(sql`
      SELECT 
        COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM age(data_nascimento)) < 30) as jovens,
        COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM age(data_nascimento)) BETWEEN 30 AND 59) as adultos,
        COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM age(data_nascimento)) >= 60) as idosos
      FROM membros
      WHERE igreja_id = ${igreja_id}
    `);

    // Get the additional required data
    const distribuicao_tipos = await this.getDistribuicaoTipos(igreja_id);
    const distribuicao_sociedades = await this.getDistribuicaoSociedades(igreja_id);

    return {
      crescimento_mensal: crescimentoResult.rows.map((row: any) => ({
        mes: row.mes as Date,
        total: Number(row.total)
      })),
      distribuicao_idade: {
        jovens: Number(distribuicaoIdadeResult.rows[0]?.jovens || 0),
        adultos: Number(distribuicaoIdadeResult.rows[0]?.adultos || 0),
        idosos: Number(distribuicaoIdadeResult.rows[0]?.idosos || 0)
      },
      distribuicao_tipos,
      distribuicao_sociedades
    };
  }

  private async getDistribuicaoTipos(igreja_id: number): Promise<{ comungantes: number; nao_comungantes: number }> {
    const result = await this.db.execute(sql`
      SELECT 
        COUNT(*) FILTER (WHERE tipo = 'comungante') as comungantes,
        COUNT(*) FILTER (WHERE tipo = 'nao_comungante') as nao_comungantes
      FROM membros
      WHERE igreja_id = ${igreja_id}
    `);
    const data = result.rows[0] || { comungantes: 0, nao_comungantes: 0 };
    return {
      comungantes: Number(data.comungantes),
      nao_comungantes: Number(data.nao_comungantes)
    };
  }

  private async getDistribuicaoSociedades(igreja_id: number) {
    return await this.db
      .select({
        sociedade: grupos.nome,
        total: sql<number>`COUNT(DISTINCT membros.id)`
      })
      .from(grupos)
      .leftJoin(membros, sql`membros.grupo_id = grupos.id`)
      .where(eq(grupos.igreja_id, igreja_id))
      .groupBy(grupos.nome);
  }

  async getOcorrencias(igreja_id: number, periodo?: { inicio: Date; fim: Date; }): Promise<{ tipo: string; acao: string; data: Date; descricao: string; }[]> {
    const result = await this.db.execute(sql`
      SELECT tipo, acao, data, descricao
      FROM ocorrencias
      WHERE igreja_id = ${igreja_id}
      ${periodo ? sql`AND data BETWEEN ${periodo.inicio} AND ${periodo.fim}` : sql``}
      ORDER BY data DESC
    `);
    
    return result.rows.map((row: any) => ({
      tipo: row.tipo,
      acao: row.acao,
      data: row.data,
      descricao: row.descricao,
    }));
  }
}
