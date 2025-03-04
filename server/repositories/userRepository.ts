import { and, eq, gt } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { BaseRepository } from './baseRepository';
import { IUserRepository } from './types';
import { users, type User, type InsertUser } from '@shared/schema';
import * as schema from '@shared/schema';

export class UserRepository extends BaseRepository<Omit<User, 'igreja_id'> & { igreja_id: number }> implements IUserRepository {
  constructor(db: NodePgDatabase<typeof schema>) {
    super(db, users, 'users');
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || null;
  }

  async createUser(userData: InsertUser): Promise<User> {
    let { igreja_nome, igreja_cidade, igreja_estado, igreja_presbitero, ...user } = userData;
    type UserWithIgreja = Omit<InsertUser, "igreja_nome" | "igreja_cidade" | "igreja_estado" | "igreja_presbitero"> & { igreja_id: number };

    // Se não temos igreja_id, criar nova igreja primeiro
    if (!('igreja_id' in user)) {
      const [newIgreja] = await this.db
        .insert(schema.igrejas)
        .values({
          nome: igreja_nome,
          cidade: igreja_cidade,
          estado: igreja_estado,
          presbitero: igreja_presbitero,
        })
        .returning()
      user = { ...user, igreja_id: newIgreja.id } as UserWithIgreja;
    }

    const [newUser] = await this.db
      .insert(users)
      .values(user)
      .returning();
    return newUser;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [updatedUser] = await this.db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getUsersByIgreja(igreja_id: number): Promise<User[]> {
    return await this.db
      .select()
      .from(users)
      .where(eq(users.igreja_id, igreja_id));
  }

  async updateUserPassword(id: number, newPassword: string): Promise<void> {
    await this.db
      .update(users)
      .set({
        password: newPassword,
        reset_token: null,
        reset_token_expiry: null
      })
      .where(eq(users.id, id));
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(
        and(
          eq(users.reset_token, token),
          gt(users.reset_token_expiry!, new Date())
        )
      );
    return user;
  }

  async setResetToken(userId: number, token: string, expiry: Date): Promise<void> {
    await this.db
      .update(users)
      .set({
        reset_token: token,
        reset_token_expiry: expiry
      })
      .where(eq(users.id, userId));
  }
}
