import { eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { BaseRepository } from './baseRepository';
import { IGrupoRepository } from './types';
import { grupos, membros_grupos, membros, type Grupo, type InsertGrupo, type Membro } from '@shared/schema';
import * as schema from '@shared/schema';

export class GrupoRepository extends BaseRepository<Grupo> implements IGrupoRepository {
  constructor(db: NodePgDatabase<typeof schema>) {
    super(db, grupos, 'grupos');
  }

  async getGrupos(igreja_id: number): Promise<Grupo[]> {
    return await this.db
      .select({
        id: grupos.id,
        nome: grupos.nome,
        tipo: grupos.tipo,
        status: grupos.status,
        descricao: grupos.descricao,
        igreja_id: grupos.igreja_id,
        membros_count: sql<number>`COUNT(DISTINCT ${membros_grupos.membro_id})`
      })
      .from(grupos)
      .leftJoin(membros_grupos, eq(grupos.id, membros_grupos.grupo_id))
      .where(eq(grupos.igreja_id, igreja_id))
      .groupBy(grupos.id)
      .orderBy(grupos.nome);
  }

  async createGrupo(grupo: InsertGrupo & { igreja_id: number }): Promise<Grupo> {
    const { membros: membrosData, ...grupoData } = grupo;
    
    return await this.db.transaction(async (trx) => {
      const [novoGrupo] = await trx
        .insert(grupos)
        .values(grupoData)
        .returning();

      if (membrosData && membrosData.length > 0) {
        await trx.insert(membros_grupos).values(
          membrosData.map(m => ({
            grupo_id: novoGrupo.id,
            membro_id: m.membro_id,
            cargo: m.cargo
          }))
        );
      }

      return novoGrupo;
    });
  }

  async updateGrupo(id: number, grupo: Partial<InsertGrupo> & { igreja_id: number }): Promise<Grupo> {
    const { membros: membrosData, ...grupoData } = grupo;
    const [updatedGrupo] = await this.db
      .update(grupos)
      .set(grupoData)
      .where(eq(grupos.id, id))
      .returning();

    if (membrosData !== undefined) {
      await this.db
        .delete(membros_grupos)
        .where(eq(membros_grupos.grupo_id, id));

      if (membrosData.length > 0) {
        await this.addMembrosToGrupo(id, membrosData);
      }
    }

    return updatedGrupo;
  }

  async deleteGrupo(id: number): Promise<void> {
    await this.db
      .delete(membros_grupos)
      .where(eq(membros_grupos.grupo_id, id));
    
    await this.db
      .delete(grupos)
      .where(eq(grupos.id, id));
  }

  async addMembrosToGrupo(grupo_id: number, membros: { membro_id: number; cargo: string }[]): Promise<void> {
    await this.db
      .insert(membros_grupos)
      .values(membros.map(m => ({
        grupo_id,
        membro_id: m.membro_id,
        cargo: m.cargo as "presidente" | "vice_presidente" | "secretario" | "segundo_secretario" | "tesoureiro" | "segundo_tesoureiro" | "conselheiro" | "membro"
      })));
  }

  async getGrupoMembros(grupo_id: number): Promise<Array<{ membro: Membro; cargo: string }>> {
    return await this.db
      .select({
        membro: membros,
        cargo: membros_grupos.cargo,
      })
      .from(membros_grupos)
      .innerJoin(membros, eq(membros.id, membros_grupos.membro_id))
      .where(eq(membros_grupos.grupo_id, grupo_id))
      .orderBy(membros.nome);
  }
}
