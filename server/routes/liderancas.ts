import express, { Router } from 'express';
import { storage } from '../repositories/storage';
import { db } from '../db';
import { liderancas, pastores, mandatos_liderancas, mandatos_pastores } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { isAdmin, canWrite } from '../middleware';
import { upload, logAudit } from '../utils';

/**
 * Creates an instance of the Router to handle routes related to "liderancas".
 */
const router = Router();

// Listar lideranças
router.get("/", async (req, res) => {
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

// Criar liderança
router.post("/", canWrite, async (req, res) => {
  if (!req.user?.igreja_id) return res.sendStatus(403);

  try {
    console.log("Dados recebidos para nova liderança:", req.body);
    const dataEleicao = new Date(req.body.data_eleicao);
    const dataInicio = new Date(req.body.data_inicio);
    const dataFim = req.body.data_fim ? new Date(req.body.data_fim) : null;

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

// ==== PASTORES ====

// Listar pastores
router.get("/pastores", async (req, res) => {
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

// Criar pastor
router.post("/pastores", upload.single('foto'), canWrite, async (req, res) => {
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

// ==== MANDATOS LIDERANÇA ====

// Listar mandatos de lideranças
router.get("/mandatos", async (req, res) => {
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

// Criar mandato de liderança
router.post("/mandatos", canWrite, async (req, res) => {
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

// Excluir mandato de liderança
router.delete("/mandatos/:id", isAdmin, async (req, res) => {
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

// Atualizar mandato de liderança
router.patch("/mandatos/:id", isAdmin, async (req, res) => {
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

// ==== MANDATOS PASTORES ====

// Listar mandatos de pastores
router.get("/pastores/mandatos", async (req, res) => {
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

// Criar mandato de pastor
router.post("/pastores/mandatos", canWrite, async (req, res) => {
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

// Excluir mandato de pastor
router.delete("/pastores/mandatos/:id", isAdmin, async (req, res) => {
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

// Atualizar mandato de pastor
router.patch("/pastores/mandatos/:id", isAdmin, async (req, res) => {
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

export default router;
