import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertMembroSchema, insertGrupoSchema, insertLiderancaSchema } from "@shared/schema";

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

    const parsed = insertMembroSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const membro = await storage.createMembro({
      ...parsed.data,
      igreja_id: req.user.igreja_id,
      data_admissao: new Date().toISOString(),
    });
    res.status(201).json(membro);
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

    const parsed = insertGrupoSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const grupo = await storage.createGrupo({
      ...parsed.data,
      igreja_id: req.user.igreja_id,
    });
    res.status(201).json(grupo);
  });

  // Leadership routes
  app.get("/api/liderancas", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.igreja_id) return res.sendStatus(403);

    const liderancas = await storage.getLiderancas(req.user.igreja_id);
    res.json(liderancas);
  });

  app.post("/api/liderancas", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.igreja_id) return res.sendStatus(403);

    const parsed = insertLiderancaSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const lideranca = await storage.createLideranca({
      ...parsed.data,
      igreja_id: req.user.igreja_id,
    });
    res.status(201).json(lideranca);
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}