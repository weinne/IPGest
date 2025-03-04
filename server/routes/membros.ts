import express, { Router } from 'express';
import { db } from '../db';
import { membros } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { isAdmin, canWrite } from '../middleware';
import { upload, logAudit } from '../utils';
import { MembroRepository } from '../repositories/membroRepository';

const router = Router();
const membroRepository = new MembroRepository(db);

// Listar membros
router.get("/", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  if (!req.user?.igreja_id) return res.sendStatus(403);

  const page = parseInt(req.query.page as string) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    console.log("Buscando membros para igreja:", req.user.igreja_id);
    const result = await membroRepository.getMembros(req.user.igreja_id);
    
    // Aplicando paginação no resultado
    const paginatedResult = result.slice(offset, offset + limit);
    
    console.log("Membros encontrados:", paginatedResult.length);
    res.json(paginatedResult);
  } catch (error) {
    console.error("Erro ao buscar membros:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

// Criar membro
router.post("/", upload.single('foto'), canWrite, async (req, res) => {
  if (!req.user?.igreja_id) return res.sendStatus(403);

  try {
    console.log("Criando novo membro para igreja:", req.user.igreja_id);
    const membroData = {
      ...req.body,
      foto: req.file ? req.file.filename : null,
      igreja_id: req.user.igreja_id,
      data_admissao: req.body.data_admissao ? new Date(req.body.data_admissao) : new Date(),
      data_nascimento: req.body.data_nascimento ? new Date(req.body.data_nascimento) : null,
      data_batismo: req.body.data_batismo ? new Date(req.body.data_batismo) : null,
      data_profissao_fe: req.body.data_profissao_fe ? new Date(req.body.data_profissao_fe) : null,
    };
    
    const novoMembro = await membroRepository.createMembro(membroData);

    console.log("Novo membro criado:", novoMembro);
    res.status(201).json(novoMembro);
  } catch (error) {
    console.error("Erro ao criar membro:", error);
    res.status(400).json({ message: (error as Error).message });
  }
});

// Excluir membro
router.delete("/:id", isAdmin, async (req, res) => {
  if (!req.user?.igreja_id) return res.sendStatus(403);

  try {
    const membroId = parseInt(req.params.id);

    try {
      await membroRepository.deleteMembro(membroId, req.user.igreja_id);
      logAudit(req, "EXCLUSÃO", "membro", membroId);
      res.json({ success: true });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return res.status(404).json({ message: "Membro não encontrado" });
      }
      throw error;
    }
  } catch (error) {
    console.error("Erro ao deletar membro:", error);
    res.status(400).json({ message: (error as Error).message });
  }
});

// Atualizar membro
router.patch("/:id", upload.single('foto'), isAdmin, async (req, res) => {
  if (!req.user?.igreja_id) return res.sendStatus(403);

  try {
    const membroId = parseInt(req.params.id);

    const updateData = {
      ...req.body,
      foto: req.file ? req.file.filename : undefined,
      igreja_id: req.user.igreja_id
    };

    try {
      const membro = await membroRepository.updateMembro(membroId, updateData);
      console.log("Membro atualizado:", membro);
      logAudit(req, "EDIÇÃO", "membro", membroId);
      res.json(membro);
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        return res.status(404).json({ message: "Membro não encontrado" });
      }
      throw error;
    }
  } catch (error) {
    console.error("Erro ao atualizar membro:", error);
    res.status(400).json({ message: (error as Error).message });
  }
});

export default router;
