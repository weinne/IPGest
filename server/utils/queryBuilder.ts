import { and, eq, gt, lt, gte, lte, or, sql } from 'drizzle-orm';
import { PgTableWithColumns } from 'drizzle-orm/pg-core';

export interface QueryOptions {
  select?: string[];
  where?: Record<string, any>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  limit?: number;
  offset?: number;
}

export interface DateRangeFilter {
  startDate?: Date;
  endDate?: Date;
}

/**
 * Constrói condições WHERE para consultas
 */
export function buildWhereConditions(table: PgTableWithColumns<any>, conditions: Record<string, any>) {
  return Object.entries(conditions).map(([key, value]) => {
    if (value === null) {
      return eq(table[key], null);
    }
    return eq(table[key], value);
  });
}

/**
 * Constrói ordenação para consultas
 */
export function buildOrderBy(table: PgTableWithColumns<any>, orderBy: Record<string, 'asc' | 'desc'>) {
  return Object.entries(orderBy).map(([key, direction]) => 
    direction === 'desc' 
      ? sql`${table[key]} DESC`
      : table[key]
  );
}

/**
 * Constrói filtro de data para consultas
 */
export function buildDateRangeFilter(table: PgTableWithColumns<any>, field: string, range: DateRangeFilter) {
  const conditions = [];
  
  if (range.startDate) {
    conditions.push(gte(table[field], range.startDate));
  }
  
  if (range.endDate) {
    conditions.push(lte(table[field], range.endDate));
  }
  
  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Constrói paginação para consultas
 */
export function buildPagination(page: number = 1, pageSize: number = 10) {
  return {
    limit: pageSize,
    offset: (page - 1) * pageSize
  };
}
