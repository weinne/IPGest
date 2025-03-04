import { eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { BaseRepository } from './baseRepository';
import { IMembroRepository } from './types';
import { membros, type Membro, type InsertMembro } from '@shared/schema';
import * as schema from '@shared/schema';

export class MembroRepository extends BaseRepository<Membro> implements IMembroRepository {
  constructor(db: NodePgDatabase<typeof schema>) {
    super(db, membros, 'membros');
  }

  async getMembros(igreja_id: number): Promise<Membro[]> {
    this.validateIgrejaId(igreja_id);
    return await this.db
      .select()
      .from(membros)
      .where(eq(membros.igreja_id, igreja_id))
      .orderBy(membros.nome);
  }

  async createMembro(membro: InsertMembro & { igreja_id: number }): Promise<Membro> {
    this.validateIgrejaId(membro.igreja_id);
    const [novoMembro] = await this.db
      .insert(membros)
      .values({
        ...membro,
        data_admissao: new Date(),
      })
      .returning();
    return novoMembro;
  }

  async updateMembro(id: number, membro: Partial<InsertMembro> & { igreja_id: number }): Promise<Membro> {
    this.validateIgrejaId(membro.igreja_id);
    await this.ensureIgrejaAccess(id, membro.igreja_id);
    const [updatedMembro] = await this.db
      .update(membros)
      .set({
        ...membro,
        data_nascimento: membro.data_nascimento ? new Date(membro.data_nascimento).toISOString() : undefined,
      })
      .where(and(
        eq(membros.id, id),
        eq(membros.igreja_id, membro.igreja_id)
      ))
      .returning();
    return updatedMembro;
  }

  async deleteMembro(id: number, igreja_id: number): Promise<void> {
    this.validateIgrejaId(igreja_id);
    await this.ensureIgrejaAccess(id, igreja_id);
    await this.db.delete(membros).where(eq(membros.id, id));
  }
}
