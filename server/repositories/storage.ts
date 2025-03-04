import * as schema from '@shared/schema';
import { db } from '../db';
import { pool } from '../db';
import { IStorage, IStorageProvider } from './types';
import session from "express-session";
import connectPg from "connect-pg-simple";

import { UserRepository } from './userRepository';
import { IgrejaRepository } from './igrejaRepository';
import { MembroRepository } from './membroRepository';
import { GrupoRepository } from './grupoRepository';
import { LiderancaRepository } from './liderancaRepository';
import { PastorRepository } from './pastorRepository';
import { SubscriptionRepository } from './subscriptionRepository';
import { ReportRepository } from './reportRepository';

const PostgresSessionStore = connectPg(session);

export class StorageProvider implements IStorageProvider {
  users: UserRepository;
  igrejas: IgrejaRepository;
  membros: MembroRepository;
  grupos: GrupoRepository;
  liderancas: LiderancaRepository;
  pastores: PastorRepository;
  subscriptions: SubscriptionRepository;
  reports: ReportRepository;
  sessionStore: session.Store;

  constructor() {
    // Inicializa todos os repositórios
    this.users = new UserRepository(db);
    this.igrejas = new IgrejaRepository(db);
    this.membros = new MembroRepository(db);
    this.grupos = new GrupoRepository(db);
    this.liderancas = new LiderancaRepository(db);
    this.pastores = new PastorRepository(db);
    this.subscriptions = new SubscriptionRepository(db);
    this.reports = new ReportRepository(db);

    // Inicializa session store
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // Implementação dos métodos da interface IStorage delegando para os repositórios específicos
  
  // User methods
  async getUser(id: number) {
    return this.users.getUser(id);
  }

  async getUserByUsername(username: string) {
    return this.users.getUserByUsername(username);
  }

  async createUser(userData: any) {
    return this.users.createUser(userData);
  }

  async updateUser(id: number, data: any) {
    return this.users.updateUser(id, data);
  }

  async getUsersByIgreja(igreja_id: number) {
    return this.users.getUsersByIgreja(igreja_id);
  }

  async updateUserPassword(id: number, newPassword: string) {
    return this.users.updateUserPassword(id, newPassword);
  }

  async getUserByResetToken(token: string) {
    return this.users.getUserByResetToken(token);
  }

  async setResetToken(userId: number, token: string, expiry: Date) {
    return this.users.setResetToken(userId, token, expiry);
  }

  // Igreja methods
  async createIgreja(igreja: any) {
    return this.igrejas.createIgreja(igreja);
  }

  async updateIgreja(id: number, data: any) {
    return this.igrejas.updateIgreja(id, data);
  }

  // Membro methods
  async getMembros(igreja_id: number) {
    return this.membros.getMembros(igreja_id);
  }

  async createMembro(membro: any) {
    return this.membros.createMembro(membro);
  }

  async updateMembro(id: number, membro: any) {
    return this.membros.updateMembro(id, membro);
  }

  async deleteMembro(id: number, igreja_id: number) {
    return this.membros.deleteMembro(id, igreja_id);
  }

  // Grupo methods
  async getGrupos(igreja_id: number) {
    return this.grupos.getGrupos(igreja_id);
  }

  async createGrupo(grupo: any) {
    return this.grupos.createGrupo(grupo);
  }

  async updateGrupo(id: number, grupo: any) {
    return this.grupos.updateGrupo(id, grupo);
  }

  async deleteGrupo(id: number) {
    return this.grupos.deleteGrupo(id);
  }

  async addMembrosToGrupo(grupo_id: number, membros: any[]) {
    return this.grupos.addMembrosToGrupo(grupo_id, membros);
  }

  async getGrupoMembros(grupo_id: number) {
    return this.grupos.getGrupoMembros(grupo_id);
  }

  // Liderança methods
  async getLiderancas(igreja_id: number) {
    return this.liderancas.getLiderancas(igreja_id);
  }

  async createLideranca(lideranca: any) {
    return this.liderancas.createLideranca(lideranca);
  }

  async getMandatosLiderancas(igreja_id: number) {
    return this.liderancas.getMandatosLiderancas(igreja_id);
  }

  async createMandatoLideranca(mandato: any) {
    return this.liderancas.createMandatoLideranca(mandato);
  }

  async updateMandatoLideranca(id: number, mandato: any) {
    return this.liderancas.updateMandatoLideranca(id, mandato);
  }

  async deleteMandatoLideranca(id: number) {
    return this.liderancas.deleteMandatoLideranca(id);
  }

  // Pastor methods
  async getPastores(igreja_id: number) {
    return this.pastores.getPastores(igreja_id);
  }

  async createPastor(pastor: any) {
    return this.pastores.createPastor(pastor);
  }

  async getMandatosPastores(igreja_id: number) {
    return this.pastores.getMandatosPastores(igreja_id);
  }

  async createMandatoPastor(mandato: any) {
    return this.pastores.createMandatoPastor(mandato);
  }

  async updateMandatoPastor(id: number, mandato: any) {
    return this.pastores.updateMandatoPastor(id, mandato);
  }

  async deleteMandatoPastor(id: number) {
    return this.pastores.deleteMandatoPastor(id);
  }

  // Report methods
  async getMembrosWithFilters(igreja_id: number, filters: any) {
    return this.reports.getMembrosWithFilters(igreja_id, filters);
  }

  async getEstatisticas(igreja_id: number, periodo?: { inicio: Date; fim: Date }) {
    return this.reports.getEstatisticas(igreja_id, periodo);
  }

  async getOcorrencias(igreja_id: number, periodo?: { inicio: Date; fim: Date }) {
    return this.reports.getOcorrencias(igreja_id, periodo);
  }

  async getGraficosData(igreja_id: number) {
    return this.reports.getGraficosData(igreja_id);
  }

  // Subscription methods
  async createSubscriptionPlan(plan: any) {
    return this.subscriptions.createSubscriptionPlan(plan);
  }

  async getSubscriptionPlan(id: number) {
    return this.subscriptions.getSubscriptionPlan(id);
  }

  async listSubscriptionPlans() {
    return this.subscriptions.listSubscriptionPlans();
  }

  async updateSubscriptionPlan(id: number, plan: any) {
    return this.subscriptions.updateSubscriptionPlan(id, plan);
  }

  async createSubscription(subscription: any) {
    return this.subscriptions.createSubscription(subscription);
  }

  async getSubscription(id: number) {
    return this.subscriptions.getSubscription(id);
  }

  async getSubscriptionByIgreja(igreja_id: number) {
    return this.subscriptions.getSubscriptionByIgreja(igreja_id);
  }

  async updateSubscription(id: number, subscription: any) {
    return this.subscriptions.updateSubscription(id, subscription);
  }
}

// Exporta uma instância única do StorageProvider
export const storage = new StorageProvider();

// Remove a classe DatabaseStorage existente pois foi substituída pelo StorageProvider