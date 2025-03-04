import express, { Router } from 'express';
import { repositories } from '../repositories';
import { isAdmin, canWrite } from '../middleware';
import { logAudit } from '../utils';

const router = Router();

// Listar grupos
router.get("/", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  if (!req.user?.igreja_id) return res.sendStatus(403);

  try {
    const grupos = await repositories.grupos.getGrupos(req.user.igreja_id);
    res.json(grupos);
  } catch (error) {
    console.error("Erro ao buscar grupos:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

// Criar grupo
router.post("/", canWrite, async (req, res) => {
  if (!req.user?.igreja_id) return res.sendStatus(403);

  try {
    const novoGrupo = await repositories.grupos.createGrupo({
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
    await repositories.grupos.deleteGrupo(grupoId);
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
    const grupo = await repositories.grupos.updateGrupo(grupoId, {
      ...req.body,
      igreja_id: req.user.igreja_id,
    });
    logAudit(req, "EDIÇÃO", "grupo", grupoId);
    res.json(grupo);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
});

// Obter membros de um grupo
router.get("/:id/membros", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  if (!req.user?.igreja_id) return res.sendStatus(403);

  try {
    const grupoId = parseInt(req.params.id);
    const membros = await repositories.grupos.getGrupoMembros(grupoId);
    res.json(membros);
  } catch (error) {
    console.error("Erro ao buscar membros do grupo:", error);
    res.status(400).json({ message: (error as Error).message });
  }
});

export default router;
