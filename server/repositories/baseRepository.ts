import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgTableWithColumns } from 'drizzle-orm/pg-core';
import { eq, and, sql } from 'drizzle-orm';
import * as schema from '@shared/schema';
import { formatDates } from '../utils/dateUtils';
import { QueryOptions, buildWhereConditions, buildOrderBy } from '../utils/queryBuilder';
import { validateId } from '../utils/validators';

export abstract class BaseRepository<T extends { igreja_id: number }> {
  protected db: NodePgDatabase<typeof schema>;
  protected table: PgTableWithColumns<any>;
  protected tableName: string;

  constructor(
    db: NodePgDatabase<typeof schema>,
    table: PgTableWithColumns<any>,
    tableName: string
  ) {
    this.db = db;
    this.table = table;
    this.tableName = tableName;
  }

  protected validateIgrejaId(igreja_id: number | undefined): void {
    if (!igreja_id) {
      throw new Error('igreja_id é obrigatório');
    }
  }

  protected async ensureIgrejaAccess(id: number, igreja_id: number): Promise<boolean> {
    const [record] = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.id, id));

    if (!record || record.igreja_id !== igreja_id) {
      throw new Error('Acesso não autorizado a este recurso');
    }

    return true;
  }

  async findById(id: number): Promise<T | null> {
    const validId = validateId(id);
    const [record] = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.id, validId));
    
    return record || null;
  }

  async create(data: Partial<T>): Promise<T> {
    const [record] = await this.db
      .insert(this.table)
      .values(formatDates(data))
      .returning();

    return record as T;
  }

  async update(id: number, data: Partial<T>): Promise<T> {
    const validId = validateId(id);
    const [record] = await this.db
      .update(this.table)
      .set(formatDates(data))
      .where(eq(this.table.id, validId))
      .returning();

    return record;
  }

  async delete(id: number): Promise<boolean> {
    const validId = validateId(id);
    const [record] = await this.db
      .delete(this.table)
      .where(eq(this.table.id, validId))
      .returning();

    return !!record;
  }

  async find(options: QueryOptions = {}): Promise<T[]> {
    const queryBuilder = this.db.select().from(this.table);
    
    // Aplicar condições where se especificadas
    if (options.where) {
      const conditions = buildWhereConditions(this.table, options.where);
      queryBuilder.where(and(...conditions));
    }
    
    // Aplicar ordenação se especificada
    if (options.orderBy) {
      const orderClauses = buildOrderBy(this.table, options.orderBy);
      queryBuilder.orderBy(...orderClauses);
    }
    
    // Aplicar limite se especificado
    if (options.limit !== undefined) {
      queryBuilder.limit(options.limit);
    }
    
    // Aplicar offset se especificado
    if (options.offset !== undefined) {
      queryBuilder.offset(options.offset);
    }
    
    // Executar a consulta e converter o resultado para o tipo esperado
    const result = await queryBuilder;
    return result as unknown as T[];
  }

  /**
   * Inicia uma transação
   */
  async transaction<R>(callback: (trx: NodePgDatabase<typeof schema>) => Promise<R>): Promise<R> {
    return await this.db.transaction(callback);
  }

  /**
   * Paginação de resultados
   */
  async paginate(page: number = 1, limit: number = 10): Promise<{
    data: T[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    const countQuery = this.db
      .select({ 
        count: sql<number>`cast(count(*) as integer)`
      })
      .from(this.table);

    const [countResult] = await countQuery;
    const count = countResult?.count ?? 0;

    const data = await this.find({ limit, offset });

    return {
      data,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  /**
   * Verifica se um registro existe
   */
  async exists(id: number): Promise<boolean> {
    const validId = validateId(id);
    const [record] = await this.db
      .select({ id: this.table.id })
      .from(this.table)
      .where(eq(this.table.id, validId))
      .limit(1);
    
    return !!record;
  }
}
