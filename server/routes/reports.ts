import { Router } from 'express';
import { db } from '../db';
import { 
  membros, 
  grupos, 
  membros_grupos,
  liderancas,
  pastores,
  mandatos_liderancas,
  mandatos_pastores
} from '@shared/schema';
import { sql, eq, and, gte, lte } from 'drizzle-orm';

/**
 * Initializes a new Router instance for handling report-related routes.
 */
const router = Router();

router.get("/membros", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  if (!req.user?.igreja_id) return res.sendStatus(403);

  try {
    const filters = req.query;
    console.log("Filters for membros report:", filters);
    console.log("Igreja ID:", req.user.igreja_id);

    let query = db
      .select({
        id: membros.id,
        numero_rol: membros.numero_rol,
        nome: membros.nome,
        tipo: membros.tipo,
        sexo: membros.sexo,
        status: membros.status,
        data_admissao: membros.data_admissao
      })
      .from(membros)
      .where(eq(membros.igreja_id, req.user.igreja_id));

    if (filters.tipo) {
      query = query.where(eq(membros.tipo, filters.tipo as 'comungante' | 'nao_comungante'));
    }
    if (filters.sexo) {
      query = query.where(eq(membros.sexo, filters.sexo as "masculino" | "feminino"));
    }
    if (filters.status) {
      query = query.where(eq(membros.status, filters.status as 'ativo' | 'inativo' | 'disciplina'));
    }
    if (filters.data_admissao_inicio && filters.data_admissao_fim) {
      query = query.where(
        and(
          gte(membros.data_admissao, new Date(filters.data_admissao_inicio as string)),
          lte(membros.data_admissao, new Date(filters.data_admissao_fim as string))
        )
      );
    }

    const result = await query;
    console.log("Query result count:", result.length);
    res.json(result);
  } catch (error) {
    console.error("Error in /api/reports/membros:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

router.get("/estatisticas", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  if (!req.user?.igreja_id) return res.sendStatus(403);

  try {
    const { data_inicio, data_fim } = req.query;
    const igreja_id = req.user.igreja_id;
    console.log("Getting statistics for igreja:", igreja_id);

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
          data_inicio ? gte(membros.data_admissao, new Date(data_inicio as string)) : undefined,
          data_fim ? lte(membros.data_admissao, new Date(data_fim as string)) : undefined
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
        membros_count: sql<number>`COUNT(DISTINCT CASE WHEN ${membros.status} = 'ativo' THEN ${membros_grupos.membro_id} END)`
      })
      .from(grupos)
      .leftJoin(membros_grupos, eq(grupos.id, membros_grupos.grupo_id))
      .leftJoin(membros, eq(membros_grupos.membro_id, membros.id))
      .where(eq(grupos.igreja_id, igreja_id))
      .groupBy(grupos.id, grupos.nome, grupos.tipo);

    const [liderancasCount] = await db
      .select({
        pastores: sql<number>`COUNT(DISTINCT CASE WHEN ${pastores.igreja_id} = ${igreja_id} THEN ${pastores.id} END)`,
        presbiteros: sql<number>`COUNT(DISTINCT CASE WHEN ${liderancas.cargo} = 'presbitero' AND ${liderancas.igreja_id} = ${igreja_id} THEN ${liderancas.id} END)`,
        diaconos: sql<number>`COUNT(DISTINCT CASE WHEN ${liderancas.cargo} = 'diacono' AND ${liderancas.igreja_id} = ${igreja_id} THEN ${liderancas.id} END)`
      })
      .from(liderancas)
      .leftJoin(pastores, eq(pastores.igreja_id, igreja_id));

    console.log("Statistics compiled for igreja:", igreja_id);
    res.json({
      admissoes: admissoesPorTipo,
      membros: {
        por_tipo: membrosPorTipo,
        por_sexo: membrosPorSexo
      },
      sociedades: sociedadesInternas,
      lideranca: liderancasCount
    });
  } catch (error) {
    console.error("Error in /api/reports/estatisticas:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

router.get("/ocorrencias", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  if (!req.user?.igreja_id) return res.sendStatus(403);

  try {
    const { data_inicio, data_fim } = req.query;
    const igreja_id = req.user.igreja_id;

    const membrosOcorrencias = await db
      .select({
        tipo: sql<string>`'membro'`,
        acao: sql<string>`CASE 
          WHEN data_exclusao IS NOT NULL THEN 'exclusao'
          ELSE 'admissao'
        END`,
        data: sql<string>`COALESCE(data_exclusao, data_admissao)::text`,
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
          data_inicio ? gte(membros.data_admissao, new Date(data_inicio as string)) : undefined,
          data_fim ? lte(membros.data_admissao, new Date(data_fim as string)) : undefined
        )
      );

    const liderancasOcorrencias = await db
      .select({
        tipo: sql<string>`'lideranca'`,
        acao: sql<string>`CASE 
          WHEN data_fim IS NOT NULL THEN 'fim_mandato'
          ELSE 'inicio_mandato'
        END`,
        data: sql<string>`COALESCE(data_fim, data_inicio)::text`,
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
          data_inicio ? gte(mandatos_liderancas.data_inicio, new Date(data_inicio as string)) : undefined,
          data_fim ? lte(mandatos_liderancas.data_fim, new Date(data_fim as string)) : undefined
        )
      );

    const pastoresOcorrencias = await db
      .select({
        tipo: sql<string>`'pastor'`,
        acao: sql<string>`CASE 
          WHEN data_fim IS NOT NULL THEN 'fim_mandato'
          ELSE 'inicio_mandato'
        END`,
        data: sql<string>`COALESCE(data_fim, data_inicio)::text`,
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
          data_inicio ? gte(mandatos_pastores.data_inicio, new Date(data_inicio as string)) : undefined,
          data_fim ? lte(mandatos_pastores.data_fim, new Date(data_fim as string)) : undefined
        )
      );

    const ocorrencias = [
      ...membrosOcorrencias,
      ...liderancasOcorrencias,
      ...pastoresOcorrencias
    ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    res.json(ocorrencias);
  } catch (error) {
    console.error("Error in /api/reports/ocorrencias:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

router.get("/graficos", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  if (!req.user?.igreja_id) return res.sendStatus(403);

  try {
    const igreja_id = req.user.igreja_id;

    const [distribuicaoTipos] = await db
      .select({
        comungantes: sql<number>`COALESCE(COUNT(CASE WHEN tipo = 'comungante' AND status = 'ativo' THEN 1 END), 0)::int`,
        nao_comungantes: sql<number>`COALESCE(COUNT(CASE WHEN tipo = 'nao_comungante' AND status = 'ativo' THEN 1 END), 0)::int`
      })
      .from(membros)
      .where(eq(membros.igreja_id, igreja_id));

    const [distribuicaoIdade] = await db
      .select({
        jovens: sql<number>`COALESCE(COUNT(CASE WHEN status = 'ativo' AND EXTRACT(YEAR FROM AGE(CURRENTDATE, data_nascimento)) < 30 THEN 1 END), 0)::int`,
        adultos: sql<number>`COALESCE(COUNT(CASE WHEN status = 'ativo' AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) BETWEEN 30 AND 59 THEN 1 END), 0)::int`,
        idosos: sql<number>`COALESCE(COUNT(CASE WHEN status = 'ativo' AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) >= 60 THEN 1 END), 0)::int`
      })
      .from(membros)
      .where(eq(membros.igreja_id, igreja_id));

    const [distribuicaoAdmissao] = await db
      .select({
        batismo: sql<number>`COALESCE(COUNT(CASE WHEN tipo_admissao = 'batismo' AND status = 'ativo' THEN 1 END), 0)::int`,
        profissao_fe: sql<number>`COALESCE(COUNT(CASE WHEN tipo_admissao = 'profissao_fe' AND status = 'ativo' THEN 1 END), 0)::int`,
        transferencia: sql<number>`COALESCE(COUNT(CASE WHEN tipo_admissao = 'transferencia' AND status = 'ativo' THEN 1 END), 0)::int`,
        reconciliacao: sql<number>`COALESCE(COUNT(CASE WHEN tipo_admissao = 'reconciliacao' AND status = 'ativo' THEN 1 END), 0)::int`,
        jurisdicao: sql<number>`COALESCE(COUNT(CASE WHEN tipo_admissao = 'jurisdicao' AND status = 'ativo' THEN 1 END), 0)::int`
      })
      .from(membros)
      .where(eq(membros.igreja_id, igreja_id));

    const crescimentoMensal = await db
      .select({
        mes: sql<string>`DATE_TRUNC('month', data_admissao)::date`,
        total: sql<number>`COALESCE(COUNT(*), 0)::int`
      })
      .from(membros)
      .where(
        and(
          eq(membros.igreja_id, igreja_id),
          gte(membros.data_admissao, sql`CURRENT_DATE - INTERVAL '1 year'`),
          eq(membros.status, 'ativo')
        )
      )
      .groupBy(sql`DATE_TRUNC('month', data_admissao)`)
      .orderBy(sql`DATE_TRUNC('month', data_admissao)`);

    const distribuicaoSociedades = await db
      .select({
        sociedade: grupos.nome,
        total: sql<number>`COALESCE(COUNT(DISTINCT CASE WHEN membros.status = 'ativo' THEN membros_grupos.membro_id END), 0)::int`
      })
      .from(grupos)
      .leftJoin(membros_grupos, eq(grupos.id, membros_grupos.grupo_id))
      .leftJoin(membros, eq(membros_grupos.membro_id, membros.id))
      .where(eq(grupos.igreja_id, igreja_id))
      .groupBy(grupos.id, grupos.nome);

    res.json({
      crescimento_mensal: crescimentoMensal,
      distribuicao_tipos: distribuicaoTipos,
      distribuicao_sociedades: distribuicaoSociedades,
      distribuicao_idade: distribuicaoIdade,
      distribuicao_admissao: distribuicaoAdmissao
    });
  } catch (error) {
    console.error("Error in /api/reports/graficos:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

export default router;
