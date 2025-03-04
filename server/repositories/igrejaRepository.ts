import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { BaseRepository } from './baseRepository';
import { IIgrejaRepository } from './types';
import { igrejas, type Igreja } from '@shared/schema';
import * as schema from '@shared/schema';
import { QueryOptions } from 'server/utils/queryBuilder';

export class IgrejaRepository extends BaseRepository<Igreja & { igreja_id: number }> implements IIgrejaRepository {
  constructor(db: NodePgDatabase<typeof schema>) {
    super(db, igrejas, 'igrejas');
  }

  async createIgreja(igreja: Omit<Igreja, "id">): Promise<Igreja> {
    const [novaIgreja] = await this.db
      .insert(igrejas)
      .values(igreja)
      .returning();
    return novaIgreja;
  }

  async updateIgreja(id: number, data: Partial<Igreja>): Promise<Igreja> {
    const [updatedIgreja] = await this.db
      .update(igrejas)
      .set(data)
      .where(eq(igrejas.id, id))
      .returning();
    return updatedIgreja;
  }
  
  // Métodos para conversão entre tipos
  private toAdaptedType(igreja: Igreja): Igreja & { igreja_id: number } {
    return {
      ...igreja,
      igreja_id: igreja.id // O id da própria igreja será usado como igreja_id
    };
  }

  private fromAdaptedType(adaptedIgreja: Igreja & { igreja_id: number }): Igreja & { igreja_id: number } {
    return adaptedIgreja;
  }

  // Sobrescrevendo métodos do BaseRepository que precisam de adaptação
  async findById(id: number): Promise<(Igreja & { igreja_id: number }) | null> {
    const result = await super.findById(id);
    return result ? this.fromAdaptedType(result) : null;
  }

  async create(data: Omit<Igreja, "id">): Promise<Igreja & { igreja_id: number }> {
    // Adicionando igreja_id como o mesmo valor do id após a criação
    const result = await super.create(data);
    const updated = await super.update(result.id, { igreja_id: result.id });
    return this.fromAdaptedType(updated);
  }

  async update(id: number, data: Partial<Igreja>): Promise<Igreja & { igreja_id: number }> {
    const result = await super.update(id, data);
    return this.fromAdaptedType(result);
  }

  async find(options: QueryOptions = {}): Promise<(Igreja & { igreja_id: number })[]> {
    const results = await super.find(options);
    return results.map(item => this.fromAdaptedType(item));
  }

  async paginate(page: number = 1, limit: number = 10): Promise<{
    data: (Igreja & { igreja_id: number })[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const result = await super.paginate(page, limit);
    return {
      ...result,
      data: result.data.map(item => this.fromAdaptedType(item))
    };
  }
}
