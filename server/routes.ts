import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";

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

    const liderancas = await storage.getLiderancas(req.user.igreja_id);
    res.json(liderancas);
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}