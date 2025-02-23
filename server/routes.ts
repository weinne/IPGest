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

  // Groups routes
  app.get("/api/grupos", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user?.igreja_id) return res.sendStatus(403);

    const grupos = await storage.getGrupos(req.user.igreja_id);
    res.json(grupos);
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