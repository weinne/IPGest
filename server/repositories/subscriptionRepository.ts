import { eq, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { BaseRepository } from './baseRepository';
import { ISubscriptionRepository } from './types';
import { subscription_plans, subscriptions } from '@shared/schema';
import type { SubscriptionPlan, Subscription, InsertSubscriptionPlan, InsertSubscription } from '@shared/schema';
import * as schema from '@shared/schema';

export class SubscriptionRepository extends BaseRepository<Subscription> implements ISubscriptionRepository {
  constructor(db: NodePgDatabase<typeof schema>) {
    super(db, subscriptions, 'subscriptions');
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [newPlan] = await this.db
      .insert(subscription_plans)
      .values(plan)
      .returning();
    return newPlan;
  }

  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    const [plan] = await this.db
      .select()
      .from(subscription_plans)
      .where(eq(subscription_plans.id, id));
    return plan;
  }

  async listSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await this.db
      .select()
      .from(subscription_plans)
      .orderBy(subscription_plans.id);
  }

  async updateSubscriptionPlan(id: number, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan> {
    const [updatedPlan] = await this.db
      .update(subscription_plans)
      .set(plan)
      .where(eq(subscription_plans.id, id))
      .returning();
    return updatedPlan;
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await this.db
      .insert(subscriptions)
      .values({
        ...subscription,
        status: 'active',
        created_at: new Date()
      })
      .returning();
    return newSubscription;
  }

  async getSubscription(id: number): Promise<Subscription | undefined> {
    const [subscription] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));
    return subscription;
  }

  async getSubscriptionByIgreja(igreja_id: number): Promise<Subscription | undefined> {
    const [subscription] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.igreja_id, igreja_id))
      .orderBy(desc(subscriptions.created_at));
    return subscription;
  }

  async updateSubscription(id: number, subscription: Partial<InsertSubscription>): Promise<Subscription> {
    const [updatedSubscription] = await this.db
      .update(subscriptions)
      .set(subscription)
      .where(eq(subscriptions.id, id))
      .returning();
    return updatedSubscription;
  }
}
