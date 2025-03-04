import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "../auth";
import express from "express";
import { join } from "path";
import { db } from "../db";
import { upload, uploadDir, logAudit } from "../utils";

// Importar os módulos de rota
import userRoutes from './users';
import membroRoutes from './membros';
import grupoRoutes from './grupos';
import liderancaRoutes from './liderancas';
import pastorRoutes from './pastores'; 
import reportRoutes from './reports';
import subscriptionRoutes from './subscriptions'; // Nova importação

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
  app.use('/api/users', userRoutes);
  app.use('/api/membros', membroRoutes);
  app.use('/api/grupos', grupoRoutes);
  app.use('/api/liderancas', liderancaRoutes);
  app.use('/api/pastores', pastorRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/subscriptions', subscriptionRoutes); // Nova rota

  const httpServer = createServer(app);
  return httpServer;
}
