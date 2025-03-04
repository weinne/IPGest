import { eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { BaseRepository } from './baseRepository';
import { IPastorRepository } from './types';
import { pastores, mandatos_pastores, type Pastor, type MandatoPastor } from '@shared/schema';
import * as schema from '@shared/schema';

export class PastorRepository extends BaseRepository<Pastor> implements IPastorRepository {
  constructor(db: NodePgDatabase<typeof schema>) {
    super(db, pastores, 'pastores');
  }

  async getPastores(igreja_id: number): Promise<Pastor[]> {
    return await this.db
      .select()
      .from(pastores)
      .where(eq(pastores.igreja_id, igreja_id))
      .orderBy(pastores.nome);
  }

  async createPastor(pastor: { nome: string; cpf: string; ano_ordenacao: number; igreja_id: number; email?: string | null; telefone?: string | null; foto?: string | null; bio?: string | null }): Promise<Pastor> {
    const [novoPastor] = await this.db
      .insert(pastores)
      .values(pastor)
      .returning();
    return novoPastor;
  }

  async getMandatosPastores(igreja_id: number): Promise<MandatoPastor[]> {
    return await this.db
      .select()
      .from(mandatos_pastores)
      .where(eq(mandatos_pastores.igreja_id, igreja_id))
      .orderBy(mandatos_pastores.data_inicio);
  }

  async createMandatoPastor(mandato: Omit<MandatoPastor, 'id'>): Promise<MandatoPastor> {
    const [novoMandato] = await this.db
      .insert(mandatos_pastores)
      .values(mandato)
      .returning();
    return novoMandato;
  }

  async updateMandatoPastor(id: number, mandato: Partial<MandatoPastor>): Promise<MandatoPastor> {
    const [mandatoAtualizado] = await this.db
      .update(mandatos_pastores)
      .set(mandato)
      .where(eq(mandatos_pastores.id, id))
      .returning();
    return mandatoAtualizado;
  }

  async deleteMandatoPastor(id: number): Promise<void> {
    await this.db
      .delete(mandatos_pastores)
      .where(eq(mandatos_pastores.id, id));
  }
}
