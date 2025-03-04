import { db } from '../db';
import { UserRepository } from './userRepository';
import { IgrejaRepository } from './igrejaRepository';
import { GrupoRepository } from './grupoRepository';
import { PastorRepository } from './pastorRepository';
import { LiderancaRepository } from './liderancaRepository';
import { SubscriptionRepository } from './subscriptionRepository';
import { ReportRepository } from './reportRepository';
import { IStorageProvider } from './types';

export const repositories: IStorageProvider = {
  users: new UserRepository(db),
  igrejas: new IgrejaRepository(db),
  grupos: new GrupoRepository(db),
  pastores: new PastorRepository(db),
  liderancas: new LiderancaRepository(db),
  subscriptions: new SubscriptionRepository(db),
  reports: new ReportRepository(db)
};
