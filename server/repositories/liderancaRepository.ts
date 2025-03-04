import { eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { BaseRepository } from './baseRepository';
import { ILiderancaRepository } from './types';
import { liderancas, mandatos_liderancas } from '@shared/schema';
import type { Lideranca, MandatoLideranca, InsertLideranca, InsertMandatoLideranca } from '@shared/schema';
import * as schema from '@shared/schema';

export class LiderancaRepository extends BaseRepository<Lideranca> implements ILiderancaRepository {
  constructor(db: NodePgDatabase<typeof schema>) {
    super(db, liderancas, 'liderancas');
  }

  // Função auxiliar para converter de maneira segura para Date
  private toDate(value: string | Date | null | undefined): Date | undefined {
    if (!value) return undefined;
    return value instanceof Date ? value : new Date(String(value));
  }

  async getLiderancas(igreja_id: number): Promise<Lideranca[]> {
    this.validateIgrejaId(igreja_id);
    return await this.db
      .select()
      .from(liderancas)
      .where(eq(liderancas.igreja_id, igreja_id))
      .orderBy(liderancas.id);
  }

  async createLideranca(lideranca: InsertLideranca & { igreja_id: number }): Promise<Lideranca> {
    this.validateIgrejaId(lideranca.igreja_id);
    const [novaLideranca] = await this.db
      .insert(liderancas)
      .values(lideranca)
      .returning();
    return novaLideranca;
  }

  async getMandatosLiderancas(igreja_id: number): Promise<MandatoLideranca[]> {
    this.validateIgrejaId(igreja_id);
    return await this.db
      .select()
      .from(mandatos_liderancas)
      .where(eq(mandatos_liderancas.igreja_id, igreja_id))
      .orderBy(mandatos_liderancas.data_inicio);
  }

  async createMandatoLideranca(mandato: InsertMandatoLideranca & { igreja_id: number }): Promise<MandatoLideranca> {
    this.validateIgrejaId(mandato.igreja_id);
    
    // Usando a função auxiliar para converter as datas
    const mandatoFormatado = {
      ...mandato,
      data_eleicao: this.toDate(mandato.data_eleicao)!,
      data_inicio: this.toDate(mandato.data_inicio)!,
      data_fim: this.toDate(mandato.data_fim)
    };

    const [novoMandato] = await this.db
      .insert(mandatos_liderancas)
      .values(mandatoFormatado)
      .returning();
    return novoMandato;
  }

  async updateMandatoLideranca(id: number, mandato: Partial<InsertMandatoLideranca> & { igreja_id: number }): Promise<MandatoLideranca> {
    this.validateIgrejaId(mandato.igreja_id);
    
    // Usando a função auxiliar para converter as datas
    const mandatoFormatado: Record<string, any> = { ...mandato };
    
    if (mandato.data_eleicao !== undefined) {
      mandatoFormatado.data_eleicao = this.toDate(mandato.data_eleicao);
    }
    
    if (mandato.data_inicio !== undefined) {
      mandatoFormatado.data_inicio = this.toDate(mandato.data_inicio);
    }
    
    if (mandato.data_fim !== undefined) {
      mandatoFormatado.data_fim = this.toDate(mandato.data_fim);
    }

    const [mandatoAtualizado] = await this.db
      .update(mandatos_liderancas)
      .set(mandatoFormatado)
      .where(and(
        eq(mandatos_liderancas.id, id),
        eq(mandatos_liderancas.igreja_id, mandato.igreja_id)
      ))
      .returning();
    return mandatoAtualizado;
  }

  async deleteMandatoLideranca(id: number): Promise<void> {
    await this.db
      .delete(mandatos_liderancas)
      .where(eq(mandatos_liderancas.id, id));
  }
}
