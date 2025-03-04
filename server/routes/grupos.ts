import express, { Router } from 'express';
import { storage } from '../storage';
import { db } from '../db';
import { membros, membros_grupos } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { isAdmin, canWrite } from '../middleware';
import { logAudit } from '../utils';

/**
 * Creates a new router instance.
 * This router will handle the routes related to 'grupos'.
 */
const router = Router();

// Listar grupos
router.get("/", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  if (!req.user?.igreja_id) return res.sendStatus(403);

  const grupos = await storage.getGrupos(req.user.igreja_id);
  res.json(grupos);
});

// Criar grupo
router.post("/", canWrite, async (req, res) => {
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

// Excluir grupo
router.delete("/:id", isAdmin, async (req, res) => {
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

// Atualizar grupo
router.patch("/:id", isAdmin, async (req, res) => {
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

// Listar membros de um grupo
router.get("/:id/membros", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  if (!req.user?.igreja_id) return res.sendStatus(403);

  try {
    const grupoId = parseInt(req.params.id);
    console.log("Buscando membros do grupo:", grupoId);

    const result = await db
      .select({
        id: membros.id,
        nome: membros.nome,
        numero_rol: membros.numero_rol,
        tipo: membros.tipo,
        status: membros.status,
        cargo: membros_grupos.cargo
      })
      .from(membros_grupos)
      .innerJoin(membros, eq(membros.id, membros_grupos.membro_id))
      .where(
        and(
          eq(membros_grupos.grupo_id, grupoId),
          eq(membros.igreja_id, req.user.igreja_id)
        )
      );

    const formattedResult = result.map((r: { id: any; nome: any; numero_rol: any; tipo: any; status: any; cargo: any; }) => ({
      membro: {
        id: r.id,
        nome: r.nome,
        numero_rol: r.numero_rol,
        tipo: r.tipo,
        status: r.status
      },
      cargo: r.cargo
    }));

    console.log("Membros encontrados:", formattedResult.length);
    res.json(formattedResult);
  } catch (error) {
    console.error("Erro ao buscar membros do grupo:", error);
    res.status(400).json({ message: (error as Error).message });
  }
});

export default router;
