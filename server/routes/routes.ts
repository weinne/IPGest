import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "../auth";
import express from "express";
import { join } from "path";
import { db } from "../db";
import { upload, uploadDir, logAudit } from "../utils";
import { eq } from "drizzle-orm";
import { subscriptions } from "@shared/schema";

// Importar os módulos de rota
import userRoutes from './users';
import membroRoutes from './membros';
import grupoRoutes from './grupos';
import liderancaRoutes from './liderancas';
import pastorRoutes from './pastores'; 
import reportRoutes from './reports';
import subscriptionRoutes from './subscriptions';

// Middleware para verificar assinatura
async function checkSubscription(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autenticado" });
  }

  // Rotas que não precisam de verificação de assinatura
  const publicRoutes = ['/api/membros', '/api/subscription'];
  if (publicRoutes.some(route => req.path.startsWith(route))) {
    return next();
  }

  try {
    // Buscar assinatura ativa
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.igreja_id, req.user!.igreja_id!))
      .where(eq(subscriptions.status, 'active'));

    // Se não tem assinatura ou é plano free, bloquear acesso
    if (!subscription || subscription.plan_id === 'prod_free') {
      return res.status(403).json({ 
        message: "Acesso restrito. Faça upgrade para o plano Pro para acessar este recurso.",
        requiresUpgrade: true
      });
    }

    next();
  } catch (error) {
    console.error("[Subscription Check] Error:", error);
    res.status(500).json({ message: "Erro ao verificar assinatura" });
  }
}

/**
 * Registers all the routes for the application.
 *
 * This function sets up authentication, serves static files from the uploads directory,
 * and registers all the modular routes for the application, including users, membros,
 * grupos, liderancas, pastores, reports, and subscriptions.
 *
 * @param app - The Express application instance.
 * @returns A promise that resolves to the created HTTP server.
 */
export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);
  app.use('/uploads', express.static(uploadDir));
  
  // Registrar as rotas modulares
  app.use('/api/users', checkSubscription, userRoutes);
  app.use('/api/membros', membroRoutes);
  app.use('/api/grupos', checkSubscription, grupoRoutes);
  app.use('/api/liderancas', checkSubscription, liderancaRoutes);
  app.use('/api/pastores', checkSubscription, pastorRoutes);
  app.use('/api/reports', checkSubscription, reportRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
