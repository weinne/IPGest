import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import multer from "multer";
import { join } from "path";
import { mkdir } from "fs/promises";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: async function (req, file, cb) {
      const uploadDir = join(process.cwd(), "uploads");
      await mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  })
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Members routes
  app.get("/api/membros", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.igreja_id) return res.sendStatus(403);

    const membros = await storage.getMembros(req.user.igreja_id);
    res.json(membros);
  });

  app.post("/api/membros", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      const novoMembro = await storage.createMembro({
        ...req.body,
        igreja_id: req.user.igreja_id,
      });
      res.status(201).json(novoMembro);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Groups routes
  app.get("/api/grupos", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.igreja_id) return res.sendStatus(403);

    const grupos = await storage.getGrupos(req.user.igreja_id);
    res.json(grupos);
  });

  app.post("/api/grupos", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
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

  // Leadership routes
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

  app.post("/api/liderancas", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.igreja_id) return res.sendStatus(403);

    try {
      console.log("Dados recebidos para nova liderança:", req.body);
      const dataEleicao = new Date(req.body.data_eleicao);
      const dataInicio = new Date(req.body.data_inicio);
      const dataFim = req.body.data_fim ? new Date(req.body.data_fim) : null;

      // Validação das datas
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

  // Pastor routes
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

  app.post("/api/pastores", upload.single('foto'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
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

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}