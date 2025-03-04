import { Router } from 'express';
import { db } from '../db';
import { pastores, mandatos_pastores } from '@shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { upload, logAudit } from '../utils';

/**
 * Router instance for handling routes related to "pastores".
 */
const router = Router();

// Rota para listar pastores
router.get('/', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  if (!req.user?.igreja_id) return res.sendStatus(403);

  try {
    const result = await db
      .select()
      .from(pastores)
      .where(eq(pastores.igreja_id, req.user.igreja_id));
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching pastores:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

// Rota para obter um pastor específico
router.get('/:id', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  if (!req.user?.igreja_id) return res.sendStatus(403);

  try {
    const pastor = await db.query.pastores.findFirst({
      where: and(
        eq(pastores.id, parseInt(req.params.id)),
        eq(pastores.igreja_id, req.user.igreja_id)
      ),
      with: {
        mandatos: true
      }
    });

    if (!pastor) {
      return res.status(404).json({ message: "Pastor não encontrado" });
    }

    res.json(pastor);
  } catch (error) {
    console.error("Error fetching pastor:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

// Rota para criar um pastor
router.post('/', upload.single('foto'), async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  if (!req.user?.igreja_id) return res.sendStatus(403);

  try {
    const data = {
      ...req.body,
      igreja_id: req.user.igreja_id,
      foto: req.file ? `/uploads/${req.file.filename}` : null
    };

    const pastor = await db.insert(pastores).values(data).returning();
    
    logAudit(req, 'create', 'pastores', pastor[0].id);
    res.status(201).json(pastor[0]);
  } catch (error) {
    console.error("Error creating pastor:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

// Rota para atualizar um pastor
router.put('/:id', upload.single('foto'), async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  if (!req.user?.igreja_id) return res.sendStatus(403);

  try {
    const pastorId = parseInt(req.params.id);
    
    // Buscar pastor existente para verificação
    const existingPastor = await db.query.pastores.findFirst({
      where: and(
        eq(pastores.id, pastorId),
        eq(pastores.igreja_id, req.user.igreja_id)
      ),
    });

    if (!existingPastor) {
      return res.status(404).json({ message: "Pastor não encontrado" });
    }

    const data = {
      ...req.body,
    };

    if (req.file) {
      data.foto = `/uploads/${req.file.filename}`;
    }

    const updatedPastor = await db
      .update(pastores)
      .set(data)
      .where(
        and(
          eq(pastores.id, pastorId),
          eq(pastores.igreja_id, req.user.igreja_id)
        )
      )
      .returning();

    logAudit(req, 'update', 'pastores', updatedPastor[0].id);
    res.json(updatedPastor[0]);
  } catch (error) {
    console.error("Error updating pastor:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

// Rota para excluir um pastor
router.delete('/:id', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  if (!req.user?.igreja_id) return res.sendStatus(403);

  try {
    const pastorId = parseInt(req.params.id);
    
    // Buscar pastor existente para verificação e auditoria
    const existingPastor = await db.query.pastores.findFirst({
      where: and(
        eq(pastores.id, pastorId),
        eq(pastores.igreja_id, req.user.igreja_id)
      ),
    });

    if (!existingPastor) {
      return res.status(404).json({ message: "Pastor não encontrado" });
    }

    // Excluir mandatos associados
    await db
      .delete(mandatos_pastores)
      .where(eq(mandatos_pastores.pastor_id, pastorId));

    // Excluir o pastor
    await db
      .delete(pastores)
      .where(
        and(
          eq(pastores.id, pastorId),
          eq(pastores.igreja_id, req.user.igreja_id)
        )
      );

    logAudit(req, 'delete', 'pastores', existingPastor);
    res.json({ message: "Pastor excluído com sucesso" });
  } catch (error) {
    console.error("Error deleting pastor:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

// Rotas para mandatos de pastores
router.post('/:id/mandatos', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  if (!req.user?.igreja_id) return res.sendStatus(403);

  try {
    const pastorId = parseInt(req.params.id);
    
    // Verificar se o pastor existe
    const pastor = await db.query.pastores.findFirst({
      where: and(
        eq(pastores.id, pastorId),
        eq(pastores.igreja_id, req.user.igreja_id)
      ),
    });

    if (!pastor) {
      return res.status(404).json({ message: "Pastor não encontrado" });
    }

    const data = {
      ...req.body,
      pastor_id: pastorId,
      igreja_id: req.user.igreja_id
    };

    const mandato = await db
      .insert(mandatos_pastores)
      .values(data)
      .returning();

    logAudit(req, 'create', 'mandatos_pastores', mandato[0].id);
    res.status(201).json(mandato[0]);
  } catch (error) {
    console.error("Error creating mandato for pastor:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

router.put('/mandatos/:id', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  if (!req.user?.igreja_id) return res.sendStatus(403);

  try {
    const mandatoId = parseInt(req.params.id);
    
    // Buscar mandato existente
    const existingMandato = await db.query.mandatos_pastores.findFirst({
      where: and(
        eq(mandatos_pastores.id, mandatoId),
        eq(mandatos_pastores.igreja_id, req.user.igreja_id)
      ),
    });

    if (!existingMandato) {
      return res.status(404).json({ message: "Mandato não encontrado" });
    }

    const updatedMandato = await db
      .update(mandatos_pastores)
      .set(req.body)
      .where(
        and(
          eq(mandatos_pastores.id, mandatoId),
          eq(mandatos_pastores.igreja_id, req.user.igreja_id)
        )
      )
      .returning();

    logAudit(req, 'update', 'mandatos_pastores', existingMandato.id);
    res.json(updatedMandato[0]);
  } catch (error) {
    console.error("Error updating mandato for pastor:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

router.delete('/mandatos/:id', async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  if (!req.user?.igreja_id) return res.sendStatus(403);

  try {
    const mandatoId = parseInt(req.params.id);
    
    // Buscar mandato existente para auditoria
    const existingMandato = await db.query.mandatos_pastores.findFirst({
      where: and(
        eq(mandatos_pastores.id, mandatoId),
        eq(mandatos_pastores.igreja_id, req.user.igreja_id)
      ),
    });

    if (!existingMandato) {
      return res.status(404).json({ message: "Mandato não encontrado" });
    }

    await db
      .delete(mandatos_pastores)
      .where(
        and(
          eq(mandatos_pastores.id, mandatoId),
          eq(mandatos_pastores.igreja_id, req.user.igreja_id)
        )
      );

    logAudit(req, 'delete', 'mandatos_pastores', existingMandato);
    res.json({ message: "Mandato excluído com sucesso" });
  } catch (error) {
    console.error("Error deleting mandato for pastor:", error);
    res.status(500).json({ message: (error as Error).message });
  }
});

export default router;
