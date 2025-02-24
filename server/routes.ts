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

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

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

// Add audit log helper
function logAudit(req: Request, operacao: string, tipo: string, id: number) {
  console.log(`AUDIT: usuário ${req.user?.username} (${req.user?.id}) realizou ${operacao} em ${tipo} #${id} às ${new Date().toISOString()}`);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // User management routes
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

  // Members routes
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


  // Groups routes
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

  app.post("/api/liderancas", canWrite, async (req, res) => {
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

  // Mandatos de lideranças
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

  // Mandatos de pastores
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

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}