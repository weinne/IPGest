import { 
  User, 
  Igreja, 
  Membro, 
  Grupo, 
  Lideranca, 
  Pastor,
  Subscription as SubscriptionType,
  InsertGrupo,
  InsertLideranca,
  InsertMandatoLideranca,
  MandatoLideranca,
  MandatoPastor 
} from '@shared/schema';

// Interface base para repositórios
export interface IBaseRepository<T> {
  findById(id: number): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: number, data: Partial<T>): Promise<T>;
  delete(id: number): Promise<boolean>;
}

// Interface para UserRepository
export interface IUserRepository extends IBaseRepository<User> {
  getUserByUsername(username: string): Promise<User | null>;
  getUsersByIgreja(igreja_id: number): Promise<User[]>;
  createUser(data: Partial<User>): Promise<User>;
}

// Interface para IgrejaRepository
export interface IIgrejaRepository extends IBaseRepository<Igreja> {
  createIgreja(igreja: Omit<Igreja, "id">): Promise<Igreja>;
  updateIgreja(id: number, data: Partial<Igreja>): Promise<Igreja>;
}

// Interface para GrupoRepository
export interface IGrupoRepository extends IBaseRepository<Grupo> {
  getGrupos(igreja_id: number): Promise<Grupo[]>;
  createGrupo(grupo: InsertGrupo & { igreja_id: number }): Promise<Grupo>;
  updateGrupo(id: number, grupo: Partial<InsertGrupo> & { igreja_id: number }): Promise<Grupo>;
  deleteGrupo(id: number): Promise<void>;
  getGrupoMembros(grupo_id: number): Promise<Array<{ membro: Membro; cargo: string }>>;
}

// Interface para LiderancaRepository
export interface ILiderancaRepository extends IBaseRepository<Lideranca> {
  getLiderancas(igreja_id: number): Promise<Lideranca[]>;
  createLideranca(lideranca: InsertLideranca & { igreja_id: number }): Promise<Lideranca>;
  getMandatosLiderancas(igreja_id: number): Promise<MandatoLideranca[]>;
  createMandatoLideranca(mandato: InsertMandatoLideranca & { igreja_id: number }): Promise<MandatoLideranca>;
  updateMandatoLideranca(id: number, mandato: Partial<InsertMandatoLideranca> & { igreja_id: number }): Promise<MandatoLideranca>;
  deleteMandatoLideranca(id: number): Promise<void>;
}

// Interface para PastorRepository
export interface IPastorRepository extends IBaseRepository<Pastor> {
  getPastores(igreja_id: number): Promise<Pastor[]>;
  createPastor(pastor: Partial<Pastor> & { igreja_id: number }): Promise<Pastor>;
  getMandatosPastores(igreja_id: number): Promise<MandatoPastor[]>;
  createMandatoPastor(mandato: Partial<MandatoPastor>): Promise<MandatoPastor>;
  updateMandatoPastor(id: number, mandato: Partial<MandatoPastor>): Promise<MandatoPastor>;
  deleteMandatoPastor(id: number): Promise<void>;
}

// Interface para StorageProvider
export interface IStorageProvider {
  users: IUserRepository;
  igrejas: IIgrejaRepository;
  grupos: IGrupoRepository;
  liderancas: ILiderancaRepository;
  pastores: IPastorRepository;
  subscriptions: ISubscriptionRepository;
  reports: IReportRepository;
  // Adicione outros repositórios conforme necessário
}

export interface IQueryOptions {
  limit?: number;
  offset?: number;
  filter?: Record<string, any>;
  sort?: Record<string, 'asc' | 'desc'>;
}

export interface IMembroRepository {
  getMembros(igreja_id: number): Promise<Membro[]>;
  createMembro(membro: InsertMembro & { igreja_id: number }): Promise<Membro>;
  updateMembro(id: number, membro: Partial<InsertMembro> & { igreja_id: number }): Promise<Membro>;
  deleteMembro(id: number, igreja_id: number): Promise<void>;
}

export interface ISubscriptionRepository {
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  listSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  updateSubscriptionPlan(id: number, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscription(id: number): Promise<Subscription | undefined>;
  getSubscriptionByIgreja(igreja_id: number): Promise<Subscription | undefined>;
  updateSubscription(id: number, subscription: Partial<InsertSubscription>): Promise<Subscription>;
}

export interface IReportRepository {
  getMembrosWithFilters(igreja_id: number, filters: {
    tipo?: string;
    sexo?: string;
    status?: string;
    data_admissao_inicio?: Date;
    data_admissao_fim?: Date;
  }): Promise<Membro[]>;
  
  getEstatisticas(igreja_id: number, periodo?: {
    inicio: Date;
    fim: Date;
  }): Promise<{
    admissoes: {
      batismo: number;
      profissao_fe: number;
      transferencia: number;
    };
    membros: {
      por_tipo: {
        comungantes: number;
        nao_comungantes: number;
      };
      por_sexo: {
        masculino: number;
        feminino: number;
      };
    };
    sociedades: Array<{
      id: number;
      nome: string;
      tipo: string;
      membros_count: number;
    }>;
    lideranca: {
      pastores: number;
      presbiteros: number;
      diaconos: number;
    };
  }>;

  getOcorrencias(igreja_id: number, periodo?: {
    inicio: Date;
    fim: Date;
  }): Promise<Array<{
    tipo: string;
    acao: string;
    data: Date;
    descricao: string;
  }>>;

  getGraficosData(igreja_id: number): Promise<{
    crescimento_mensal: Array<{
      mes: Date;
      total: number;
    }>;
    distribuicao_tipos: {
      comungantes: number;
      nao_comungantes: number;
    };
    distribuicao_sociedades: Array<{
      sociedade: string;
      total: number;
    }>;
    distribuicao_idade: {
      jovens: number;
      adultos: number;
      idosos: number;
    };
  }>;
}

export interface IStorage {
  users: IUserRepository;
  igrejas: IIgrejaRepository;
  membros: IMembroRepository;
  grupos: IGrupoRepository;
  liderancas: ILiderancaRepository;
  pastores: IPastorRepository;
  subscriptions: ISubscriptionRepository;
  reports: IReportRepository;
}

// Tipos necessários para as interfaces
export type InsertUser = any; // Substituir pelo tipo real
export type InsertMembro = any; // Substituir pelo tipo real
export type InsertPastor = any; // Substituir pelo tipo real
export type SubscriptionPlan = any; // Substituir pelo tipo real
export type InsertSubscriptionPlan = any; // Substituir pelo tipo real
export type Subscription = SubscriptionType; // Substituir pelo tipo real
export type InsertSubscription = any; // Substituir pelo tipo real
