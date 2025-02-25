import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import multer from "multer";
import { join } from "path";
import { mkdir } from "fs/promises";
import { canWrite, isAdmin } from "./middleware";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import express from "express";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "./db";
import {
  membros,
  grupos,
  membros_grupos,
  liderancas,
  pastores,
  mandatos_liderancas,
  mandatos_pastores,
  igrejas
} from "@shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

const uploadDir = join(process.cwd(), "uploads");
const upload = multer({
  storage: multer.diskStorage({
    destination: async function (req, file, cb) {
      await mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = file.originalname.split('.').pop();
      cb(null, `${uniqueSuffix}.${ext}`);
    }
  })
});

function logAudit(req: Request, operacao: string, tipo: string, id: number) {
  console.log(`AUDIT: usuário ${req.user?.username} (${req.user?.id}) realizou ${operacao} em ${tipo} #${id} às ${new Date().toISOString()}`);
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);
  app.use('/uploads', express.static(uploadDir));

  app.post("/api/users", async (req, res) => {
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }

      const user = await storage.createUser({
        username: req.body.username,
        password: await hashPassword(req.body.password),
        role: req.body.role || "comum",
        igreja_id: req.user.igreja_id
      });

      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/users", isAdmin, async (req, res) => {
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      const users = await storage.getUsersByIgreja(req.user.igreja_id);
      res.json(users);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/membros", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.igreja_id) return res.sendStatus(403);

    const membros = await storage.getMembros(req.user.igreja_id);
    res.json(membros);
  });

  app.post("/api/membros", upload.single('foto'), canWrite, async (req, res) => {
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      const novoMembro = await storage.createMembro({
        ...req.body,
        foto: req.file ? req.file.filename : null,
        igreja_id: req.user.igreja_id,
      });
      res.status(201).json(novoMembro);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/membros/:id", isAdmin, async (req, res) => {
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      const membroId = parseInt(req.params.id);
      await storage.deleteMembro(membroId);
      logAudit(req, "EXCLUSÃO", "membro", membroId);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.patch("/api/membros/:id", upload.single('foto'), isAdmin, async (req, res) => {
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      const membroId = parseInt(req.params.id);
      const updateData = {
        ...req.body,
        igreja_id: req.user.igreja_id,
      };

      if (req.file) {
        updateData.foto = req.file.filename;
      }

      const membro = await storage.updateMembro(membroId, updateData);
      logAudit(req, "EDIÇÃO", "membro", membroId);
      res.json(membro);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });


  app.get("/api/grupos", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.igreja_id) return res.sendStatus(403);

    const grupos = await storage.getGrupos(req.user.igreja_id);
    res.json(grupos);
  });

  app.post("/api/grupos", canWrite, async (req, res) => {
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      const novoGrupo = await storage.createGrupo({
        ...req.body,
        igreja_id: req.user.igreja_id,
      });
      res.status(201).json(novoGrupo);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/grupos/:id", isAdmin, async (req, res) => {
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      const grupoId = parseInt(req.params.id);
      await storage.deleteGrupo(grupoId);
      logAudit(req, "EXCLUSÃO", "grupo", grupoId);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.patch("/api/grupos/:id", isAdmin, async (req, res) => {
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      const grupoId = parseInt(req.params.id);
      const grupo = await storage.updateGrupo(grupoId, {
        ...req.body,
        igreja_id: req.user.igreja_id,
      });
      logAudit(req, "EDIÇÃO", "grupo", grupoId);
      res.json(grupo);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/grupos/:id/membros", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      const membros = await storage.getGrupoMembros(parseInt(req.params.id));
      res.json(membros);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/liderancas", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      console.log("Buscando lideranças para igreja:", req.user.igreja_id);
      const liderancas = await storage.getLiderancas(req.user.igreja_id);
      console.log("Lideranças encontradas:", liderancas);
      res.json(liderancas);
    } catch (error) {
      console.error("Erro ao buscar lideranças:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/liderancas", canWrite, async (req, res) => {
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      console.log("Dados recebidos para nova liderança:", req.body);
      const dataEleicao = new Date(req.body.data_eleicao);
      const dataInicio = new Date(req.body.data_inicio);
      const dataFim = req.body.data_fim ? new Date(req.body.data_fim) : null;

      if (isNaN(dataEleicao.getTime())) {
        throw new Error("Data de eleição inválida");
      }
      if (isNaN(dataInicio.getTime())) {
        throw new Error("Data de início inválida");
      }
      if (dataFim && isNaN(dataFim.getTime())) {
        throw new Error("Data de fim inválida");
      }

      const data = {
        membro_id: parseInt(req.body.membro_id),
        cargo: req.body.cargo,
        status: req.body.status,
        data_eleicao: dataEleicao,
        data_inicio: dataInicio,
        data_fim: dataFim,
        igreja_id: req.user.igreja_id,
      };

      const novaLideranca = await storage.createLideranca(data);
      console.log("Liderança criada:", novaLideranca);
      res.status(201).json(novaLideranca);
    } catch (error) {
      console.error("Erro ao criar liderança:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/pastores", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      console.log("Buscando pastores para igreja:", req.user.igreja_id);
      const pastores = await storage.getPastores(req.user.igreja_id);
      console.log("Pastores encontrados:", pastores);
      res.json(pastores);
    } catch (error) {
      console.error("Erro ao buscar pastores:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/pastores", upload.single('foto'), canWrite, async (req, res) => {
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      console.log("Dados recebidos:", req.body);
      const data = {
        nome: req.body.nome,
        cpf: req.body.cpf,
        email: req.body.email || null,
        telefone: req.body.telefone || null,
        foto: req.file ? req.file.filename : null,
        bio: req.body.bio || null,
        ano_ordenacao: parseInt(req.body.ano_ordenacao),
        tipo_vinculo: req.body.tipo_vinculo,
        data_inicio: new Date(req.body.data_inicio),
        igreja_id: req.user.igreja_id,
      };

      const novoPastor = await storage.createPastor(data);
      console.log("Pastor criado:", novoPastor);
      res.status(201).json(novoPastor);
    } catch (error) {
      console.error("Erro ao criar pastor:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/mandatos/liderancas", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      console.log("Buscando mandatos de lideranças para igreja:", req.user.igreja_id);
      const mandatos = await storage.getMandatosLiderancas(req.user.igreja_id);
      console.log("Mandatos de lideranças encontrados:", mandatos);
      res.json(mandatos);
    } catch (error) {
      console.error("Erro ao buscar mandatos de lideranças:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/mandatos/liderancas", canWrite, async (req, res) => {
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      console.log("Dados recebidos para novo mandato de liderança:", req.body);
      const novoMandato = await storage.createMandatoLideranca({
        ...req.body,
        igreja_id: req.user.igreja_id,
      });
      console.log("Mandato de liderança criado:", novoMandato);
      res.status(201).json(novoMandato);
    } catch (error) {
      console.error("Erro ao criar mandato de liderança:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/mandatos/liderancas/:id", isAdmin, async (req, res) => {
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      const mandatoId = parseInt(req.params.id);
      await storage.deleteMandatoLideranca(mandatoId);
      logAudit(req, "EXCLUSÃO", "mandato de liderança", mandatoId);
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao deletar mandato de liderança:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.patch("/api/mandatos/liderancas/:id", isAdmin, async (req, res) => {
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      const mandatoId = parseInt(req.params.id);
      const mandato = await storage.updateMandatoLideranca(mandatoId, {
        ...req.body,
        igreja_id: req.user.igreja_id,
      });
      logAudit(req, "EDIÇÃO", "mandato de liderança", mandatoId);
      res.json(mandato);
    } catch (error) {
      console.error("Erro ao atualizar mandato de liderança:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/mandatos/pastores", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      console.log("Buscando mandatos de pastores para igreja:", req.user.igreja_id);
      const mandatos = await storage.getMandatosPastores(req.user.igreja_id);
      console.log("Mandatos de pastores encontrados:", mandatos);
      res.json(mandatos);
    } catch (error) {
      console.error("Erro ao buscar mandatos de pastores:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/mandatos/pastores", canWrite, async (req, res) => {
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      console.log("Dados recebidos para novo mandato de pastor:", req.body);
      const novoMandato = await storage.createMandatoPastor({
        ...req.body,
        igreja_id: req.user.igreja_id,
      });
      console.log("Mandato de pastor criado:", novoMandato);
      res.status(201).json(novoMandato);
    } catch (error) {
      console.error("Erro ao criar mandato de pastor:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.delete("/api/mandatos/pastores/:id", isAdmin, async (req, res) => {
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      const mandatoId = parseInt(req.params.id);
      await storage.deleteMandatoPastor(mandatoId);
      logAudit(req, "EXCLUSÃO", "mandato de pastor", mandatoId);
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao deletar mandato de pastor:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.patch("/api/mandatos/pastores/:id", isAdmin, async (req, res) => {
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      const mandatoId = parseInt(req.params.id);
      const mandato = await storage.updateMandatoPastor(mandatoId, {
        ...req.body,
        igreja_id: req.user.igreja_id,
      });
      logAudit(req, "EDIÇÃO", "mandato de pastor", mandatoId);
      res.json(mandato);
    } catch (error) {
      console.error("Erro ao atualizar mandato de pastor:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/reports/membros", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      const filters = req.query;
      let query = db
        .select()
        .from(membros)
        .where(eq(membros.igreja_id, req.user.igreja_id));

      if (filters.tipo) {
        query = query.where(eq(membros.tipo, filters.tipo as string));
      }
      if (filters.sexo) {
        query = query.where(eq(membros.sexo, filters.sexo as string));
      }
      if (filters.status) {
        query = query.where(eq(membros.status, filters.status as string));
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
      res.json(result);
    } catch (error) {
      console.error("Error in /api/reports/membros:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/reports/estatisticas", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      const { data_inicio, data_fim } = req.query;
      const igreja_id = req.user.igreja_id;

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

  app.get("/api/reports/ocorrencias", async (req, res) => {
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

  app.get("/api/reports/graficos", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      const igreja_id = req.user.igreja_id;

      // Distribuição por tipo
      const [distribuicaoTipos] = await db
        .select({
          comungantes: sql<number>`COALESCE(COUNT(CASE WHEN tipo = 'comungante' AND status = 'ativo' THEN 1 END), 0)::int`,
          nao_comungantes: sql<number>`COALESCE(COUNT(CASE WHEN tipo = 'nao_comungante' AND status = 'ativo' THEN 1 END), 0)::int`
        })
        .from(membros)
        .where(eq(membros.igreja_id, igreja_id));

      // Distribuição por idade
      const [distribuicaoIdade] = await db
        .select({
          jovens: sql<number>`COALESCE(COUNT(CASE WHEN status = 'ativo' AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) < 30 THEN 1 END), 0)::int`,
          adultos: sql<number>`COALESCE(COUNT(CASE WHEN status = 'ativo' AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) BETWEEN 30 AND 59 THEN 1 END), 0)::int`,
          idosos: sql<number>`COALESCE(COUNT(CASE WHEN status = 'ativo' AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) >= 60 THEN 1 END), 0)::int`
        })
        .from(membros)
        .where(eq(membros.igreja_id, igreja_id));

      // Distribuição por modo de admissão
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

      // Crescimento mensal (últimos 12 meses)
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

      // Distribuição por sociedade
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
      });    } catch (error) {      console.error("Error in /api/reports/graficos:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/igreja/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      const igreja = await db.query.igrejas.findFirst({
        where: eq(igrejas.id, parseInt(req.params.id))
      });

      if (!igreja) {
        return res.status(404).json({ message: "Igreja não encontrada" });
      }

      res.json(igreja);
    } catch (error) {
      console.error("Error fetching igreja:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/user/igreja", upload.single('logo'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      console.log("Dados recebidos para nova igreja:", req.body);
      console.log("Arquivo recebido:", req.file);

      const updateData = {
        nome: req.body.nome,
        cnpj: req.body.cnpj || null,
        cep: req.body.cep || null,
        endereco: req.body.endereco || null,
        numero: req.body.numero || null,
        complemento: req.body.complemento || null,
        bairro: req.body.bairro || null,
        website: req.body.website || null,
        telefone: req.body.telefone || null,
        email: req.body.email || null,
        logo_url: req.file ? req.file.filename : undefined,
        data_fundacao: req.body.data_fundacao || null,
        cidade: req.body.cidade || null,
        estado: req.body.estado || null,
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      console.log("Update data:", updateData);

      const [igreja] = await db
        .update(igrejas)
        .set(updateData)
        .where(eq(igrejas.id, req.user.igreja_id))
        .returning();

      console.log("Igreja update result:", igreja);
      res.json(igreja);
    } catch (error) {
      console.error("Error updating igreja:", error);
      res.status(500).json({ message: (error as Error).message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}