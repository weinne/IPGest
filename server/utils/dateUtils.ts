/**
 * Verifica se uma string é uma data válida
 */
export function isValidDateString(value: string): boolean {
  const date = new Date(value);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Converte uma data para string ISO
 */
export function toISOString(date: Date | string): string {
  if (date instanceof Date) {
    return date.toISOString();
  }
  if (isValidDateString(date)) {
    return new Date(date).toISOString();
  }
  throw new Error('Data inválida');
}

/**
 * Formata valores de data em um objeto
 */
export function formatDates<T extends Record<string, any>>(data: T): Record<keyof T, any> {
  return Object.entries(data).reduce((acc, [key, value]) => {
    const result = { ...acc };
    if (value instanceof Date || (typeof value === 'string' && isValidDateString(value))) {
      result[key as keyof T] = toISOString(value);
    } else {
      result[key as keyof T] = value;
    }
    return result;
  }, {} as Record<keyof T, any>);
}

/**
 * Adiciona um número de dias a uma data
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Retorna o início do mês para uma data
 */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Retorna o fim do mês para uma data
 */
export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}
