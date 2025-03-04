import express, { Router, Request } from 'express';
import { storage } from '../storage';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { igrejas } from '@shared/schema';
import { isAdmin } from '../middleware';
import { hashPassword } from '../utils';

/**
 * Initializes a new Router instance for handling user-related routes.
 */
const router = Router();

// Rota para criar novo usuário
router.post("/", async (req, res) => {
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
      igreja_id: req.user.igreja_id,
      igreja_nome: '',
      igreja_cidade: '',
      igreja_estado: '',
      igreja_presbitero: ''
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

// Rota para listar usuários da igreja
router.get("/", isAdmin, async (req, res) => {
  if (!req.user?.igreja_id) return res.sendStatus(403);

  try {
    const users = await storage.getUsersByIgreja(req.user.igreja_id);
    res.json(users);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

// Rota para atualizar dados da igreja
router.post("/igreja", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  if (!req.user?.igreja_id) return res.sendStatus(403);

  try {
    console.log("Igreja update request:", {
      body: req.body,
      igreja_id: req.user.igreja_id
    });

    const [igreja] = await db
      .update(igrejas)
      .set({
        nome: req.body.nome,
        cnpj: req.body.cnpj,
        cep: req.body.cep,
        endereco: req.body.endereco,
        numero: req.body.numero,
        complemento: req.body.complemento,
        bairro: req.body.bairro,
        website: req.body.website,
        telefone: req.body.telefone,
        email: req.body.email,
        logo_url: req.body.logo_url,
        data_fundacao: req.body.data_fundacao,
      })
      .where(eq(igrejas.id, req.user.igreja_id))
      .returning();

    console.log("Igreja update result:", igreja);
    res.json(igreja);
  } catch (error) {
    console.error("Error updating igreja:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

// Rota para obter dados da igreja
router.get("/igreja/:id", async (req, res) => {
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

export default router;
