import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  date,
  timestamp,
  jsonb,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Igreja (tenant) - Enhanced with new fields
export const igrejas = pgTable("igrejas", {
  id: serial("id").primaryKey(),
  nome: text("nome").default(""),
  cidade: text("cidade").default(""),
  estado: text("estado").default(""),
  presbitero: text("presbitero").default(""),
  cnpj: text("cnpj"),
  cep: text("cep"),
  endereco: text("endereco"),
  numero: text("numero"),
  complemento: text("complemento"),
  bairro: text("bairro"),
  website: text("website"),
  telefone: text("telefone"),
  email: text("email"),
  logo_url: text("logo_url"),
  data_fundacao: date("data_fundacao"),
  stripe_customer_id: text("stripe_customer_id"), // Added field for Stripe customer
});

// Users - Enhanced with photo
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["administrador", "comum"] })
    .notNull()
    .default("comum"),
  igreja_id: integer("igreja_id").references(() => igrejas.id),
  nome_completo: text("nome_completo"),
  email: text("email"),
  foto_url: text("foto_url"),
  reset_token: text("reset_token"),
  reset_token_expiry: timestamp("reset_token_expiry"),
});

// Grupos/Sociedades
export const grupos = pgTable("grupos", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  tipo: text("tipo", {
    enum: [
      "UCP",
      "UPA",
      "UMP",
      "SAF",
      "UPH",
      "ESTATISTICA",
      "DIACONIA",
      "EVANGELIZACAO",
      "ENSINO",
      "COMUNICACAO",
      "outro",
    ],
  }).notNull(),
  descricao: text("descricao"),
  status: text("status", { enum: ["ativo", "inativo"] })
    .notNull()
    .default("ativo"),
  igreja_id: integer("igreja_id")
    .references(() => igrejas.id)
    .notNull(),
});

// Membros
export const membros = pgTable("membros", {
  id: serial("id").primaryKey(),
  numero_rol: integer("numero_rol").notNull(),
  nome: text("nome").notNull(),
  email: text("email"),
  telefone: text("telefone"),
  sexo: text("sexo", { enum: ["masculino", "feminino"] }).notNull(),
  cep: text("cep"),
  endereco: text("endereco"),
  bairro: text("bairro"),
  numero: text("numero"),
  cidade_atual: text("cidade_atual"),
  cpf: text("cpf"),
  rg: text("rg"),
  foto: text("foto"),
  data_nascimento: date("data_nascimento"),
  cidade_natal: text("cidade_natal"),
  estado_civil: text("estado_civil", {
    enum: ["solteiro", "casado", "divorciado", "viuvo", "separado"],
  }),
  conjuge: text("conjuge"),
  data_casamento: date("data_casamento"),
  religiao_anterior: text("religiao_anterior"),
  tipo: text("tipo", { enum: ["comungante", "nao_comungante"] }).notNull(),
  status: text("status", { enum: ["ativo", "inativo", "disciplina"] })
    .notNull()
    .default("ativo"),
  data_admissao: timestamp("data_admissao").notNull(),
  tipo_admissao: text("tipo_admissao", {
    enum: ["batismo", "profissao_fe", "transferencia"],
  }).notNull(),
  data_batismo: date("data_batismo"),
  data_profissao_fe: date("data_profissao_fe"),
  data_exclusao: date("data_exclusao"),
  motivo_exclusao: text("motivo_exclusao", {
    enum: ["transferencia", "excomunhao", "exclusao", "falecimento", "pedido"],
  }),
  igreja_id: integer("igreja_id")
    .references(() => igrejas.id)
    .notNull(),
});

// Membros-grupos
export const membros_grupos = pgTable("membros_grupos", {
  membro_id: integer("membro_id")
    .references(() => membros.id)
    .notNull(),
  grupo_id: integer("grupo_id")
    .references(() => grupos.id)
    .notNull(),
  cargo: text("cargo", {
    enum: [
      "presidente",
      "vice_presidente",
      "secretario",
      "segundo_secretario",
      "tesoureiro",
      "segundo_tesoureiro",
      "conselheiro",
      "membro",
    ],
  })
    .notNull()
    .default("membro"),
});

// Lideranças
export const liderancas = pgTable("liderancas", {
  id: serial("id").primaryKey(),
  membro_id: integer("membro_id")
    .references(() => membros.id)
    .notNull(),
  cargo: text("cargo", {
    enum: ["presbitero", "diacono"],
  }).notNull(),
  igreja_id: integer("igreja_id")
    .references(() => igrejas.id)
    .notNull(),
});

// Pastores
export const pastores = pgTable("pastores", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  cpf: text("cpf").notNull(),
  email: text("email"),
  telefone: text("telefone"),
  foto: text("foto"),
  bio: text("bio"),
  ano_ordenacao: integer("ano_ordenacao").notNull(),
  igreja_id: integer("igreja_id")
    .references(() => igrejas.id)
    .notNull(),
});

// Mandatos de pastores
export const mandatos_pastores = pgTable("mandatos_pastores", {
  id: serial("id").primaryKey(),
  pastor_id: integer("pastor_id")
    .references(() => pastores.id)
    .notNull(),
  data_eleicao: timestamp("data_eleicao").notNull(),
  data_inicio: timestamp("data_inicio").notNull(),
  data_fim: timestamp("data_fim"),
  tipo_vinculo: text("tipo_vinculo", {
    enum: ["eleito", "designado"],
  }).notNull(),
  status: text("status", {
    enum: ["ativo", "finalizado"],
  })
    .notNull()
    .default("ativo"),
  igreja_id: integer("igreja_id")
    .references(() => igrejas.id)
    .notNull(),
});

// Mandatos de lideranças
export const mandatos_liderancas = pgTable("mandatos_liderancas", {
  id: serial("id").primaryKey(),
  lideranca_id: integer("lideranca_id")
    .references(() => liderancas.id)
    .notNull(),
  data_eleicao: timestamp("data_eleicao").notNull(),
  data_inicio: timestamp("data_inicio").notNull(),
  data_fim: timestamp("data_fim"),
  status: text("status", {
    enum: ["ativo", "inativo", "afastado", "emerito", "finalizado"],
  })
    .notNull()
    .default("ativo"),
  igreja_id: integer("igreja_id")
    .references(() => igrejas.id)
    .notNull(),
});

// Subscription Plans
export const subscription_plans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  stripe_price_id: text("stripe_price_id").notNull(),
  stripe_product_id: text("stripe_product_id").notNull(),
  features: text("features").array(),
  status: text("status", { enum: ["active", "archived"] })
    .notNull()
    .default("active"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Church Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  igreja_id: integer("igreja_id")
    .references(() => igrejas.id)
    .notNull(),
  plan_id: integer("plan_id")
    .references(() => subscription_plans.id)
    .notNull(),
  stripe_subscription_id: text("stripe_subscription_id").notNull(),
  stripe_customer_id: text("stripe_customer_id").notNull(),
  status: text("status", {
    enum: [
      "active",
      "past_due",
      "canceled",
      "incomplete",
      "incomplete_expired",
      "trialing",
      "unpaid",
    ],
  })
    .notNull()
    .default("incomplete"),
  current_period_start: timestamp("current_period_start").notNull(),
  current_period_end: timestamp("current_period_end").notNull(),
  cancel_at_period_end: boolean("cancel_at_period_end").default(false),
  canceled_at: timestamp("canceled_at"),
  ended_at: timestamp("ended_at"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertIgrejaSchema = createInsertSchema(igrejas).extend({
  cnpj: z
    .string()
    .regex(/^(\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}|\d{14})$/, "CNPJ inválido")
    .optional()
    .transform((c) => {
      if (!c) return null;
      // Remove any non-digit characters
      const digits = c.replace(/\D/g, "");
      // Format as XX.XXX.XXX/XXXX-XX
      return digits.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        "$1.$2.$3/$4-$5",
      );
    }),
  cep: z
    .string()
    .regex(/^(\d{5}\-\d{3}|\d{8})$/, "CEP inválido")
    .optional()
    .transform((c) => {
      if (!c) return null;
      const digits = c.replace(/\D/g, "");
      return digits.replace(/^(\d{5})(\d{3})$/, "$1-$2");
    }),
  endereco: z
    .string()
    .optional()
    .transform((v) => v || null),
  numero: z
    .string()
    .optional()
    .transform((v) => v || null),
  complemento: z
    .string()
    .optional()
    .transform((v) => v || null),
  bairro: z
    .string()
    .optional()
    .transform((v) => v || null),
  website: z
    .string()
    .url("Website inválido")
    .optional()
    .transform((w) => w || null),
  telefone: z
    .string()
    .regex(
      /^(\(?[1-9]{2}\)? ?(?:[2-8]|9[1-9])[0-9]{3}\-?[0-9]{4}|\d{10,11})$/,
      "Telefone inválido",
    )
    .optional()
    .transform((t) => {
      if (!t) return null;
      const digits = t.replace(/\D/g, "");
      return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    }),
  email: z
    .string()
    .email("Email inválido")
    .optional()
    .transform((e) => e || null),
  nome: z
    .string()
    .optional()
    .transform((n) => n || null),
  cidade: z
    .string()
    .optional()
    .transform((c) => c || null),
  estado: z
    .string()
    .optional()
    .transform((e) => e || null),
  presbitero: z
    .string()
    .optional()
    .transform((p) => p || null),
  logo_url: z
    .string()
    .optional()
    .transform((l) => l || null),
  data_fundacao: z
    .string()
    .optional()
    .transform((d) => d || null),
  stripe_customer_id: z
    .string()
    .optional()
    .transform((id) => id || null), // Added for Stripe customer ID
});
export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
  })
  .extend({
    igreja_nome: z.string().min(3),
    igreja_cidade: z.string().min(3),
    igreja_estado: z.string().length(2),
    igreja_presbitero: z.string().min(3),
    nome_completo: z.string().min(3).optional(),
    email: z.string().email("Email inválido").optional(),
  });

export const insertGrupoSchema = createInsertSchema(grupos)
  .omit({
    igreja_id: true,
  })
  .extend({
    nome: z
      .string()
      .min(3, "Nome deve ter pelo menos 3 caracteres")
      .max(100, "Nome não pode ter mais de 100 caracteres"),
    tipo: z.enum(
      [
        "UCP",
        "UPA",
        "UMP",
        "SAF",
        "UPH",
        "ESTATISTICA",
        "DIACONIA",
        "EVANGELIZACAO",
        "ENSINO",
        "COMUNICACAO",
        "outro",
      ],
      {
        required_error: "Selecione o tipo do grupo",
        invalid_type_error: "Tipo inválido",
      },
    ),
    status: z.enum(["ativo", "inativo"], {
      required_error: "Selecione o status do grupo",
      invalid_type_error: "Status inválido",
    }),
    descricao: z.string().optional().nullable(),
    membros: z
      .array(
        z.object({
          membro_id: z.number(),
          cargo: z.enum([
            "presidente",
            "vice_presidente",
            "secretario",
            "segundo_secretario",
            "tesoureiro",
            "segundo_tesoureiro",
            "conselheiro",
            "membro",
          ]),
        }),
      )
      .optional()
      .default([]),
  });

export const insertMembroSchema = createInsertSchema(membros)
  .omit({
    igreja_id: true,
    data_admissao: true,
  })
  .extend({
    nome: z
      .string()
      .min(3, "Nome deve ter pelo menos 3 caracteres")
      .max(100, "Nome não pode ter mais de 100 caracteres")
      .regex(/^[a-zA-ZÀ-ÿ\s]*$/, "Nome deve conter apenas letras"),
    email: z
      .string()
      .email("Email inválido")
      .optional()
      .nullable()
      .transform((e) => (e === "" ? null : e)),
    telefone: z
      .string()
      .regex(
        /^\(?[1-9]{2}\)? ?(?:[2-8]|9[1-9])[0-9]{3}\-?[0-9]{4}$/,
        "Telefone inválido",
      )
      .optional()
      .nullable()
      .transform((t) => (t === "" ? null : t)),
    endereco: z
      .string()
      .min(5, "Endereço deve ter pelo menos 5 caracteres")
      .max(200, "Endereço não pode ter mais de 200 caracteres")
      .optional()
      .nullable()
      .transform((e) => (e === "" ? null : e)),
    cpf: z
      .string()
      .regex(/^\d{3}\.\d{3}\.\d{3}\-\d{2}$/, "CPF inválido")
      .optional()
      .nullable()
      .transform((c) => (c === "" ? null : c)),
    rg: z
      .string()
      .optional()
      .nullable()
      .transform((r) => (r === "" ? null : r)),
    foto: z.any().optional().nullable(),
    data_nascimento: z
      .string()
      .refine((date) => {
        if (!date) return true;
        const d = new Date(date);
        return !isNaN(d.getTime()) && d <= new Date();
      }, "Data de nascimento inválida")
      .optional()
      .nullable()
      .transform((d) => (d === "" ? null : d)),
    cidade_natal: z
      .string()
      .optional()
      .nullable()
      .transform((c) => (c === "" ? null : c)),
    estado_civil: z
      .enum(["solteiro", "casado", "divorciado", "viuvo", "separado"])
      .optional()
      .nullable(),
    conjuge: z
      .string()
      .optional()
      .nullable()
      .transform((c) => (c === "" ? null : c)),
    data_casamento: z
      .string()
      .optional()
      .nullable()
      .transform((d) => (d === "" ? null : d)),
    religiao_anterior: z
      .string()
      .optional()
      .nullable()
      .transform((r) => (r === "" ? null : r)),
    data_batismo: z
      .string()
      .optional()
      .nullable()
      .transform((d) => (d === "" ? null : d)),
    data_profissao_fe: z
      .string()
      .optional()
      .nullable()
      .transform((d) => (d === "" ? null : d)),
    numero_rol: z
      .number()
      .int("Número do rol deve ser um número inteiro")
      .positive("Número do rol deve ser positivo"),
    tipo: z.enum(["comungante", "nao_comungante"], {
      required_error: "Selecione o tipo de membro",
      invalid_type_error: "Tipo inválido",
    }),
    tipo_admissao: z.enum(["batismo", "profissao_fe", "transferencia"], {
      required_error: "Selecione o tipo de admissão",
      invalid_type_error: "Tipo de admissão inválido",
    }),
    status: z.enum(["ativo", "inativo", "disciplina"], {
      required_error: "Selecione o status",
      invalid_type_error: "Status inválido",
    }),
    motivo_exclusao: z
      .enum([
        "transferencia",
        "excomunhao",
        "exclusao",
        "falecimento",
        "pedido",
      ])
      .optional()
      .nullable(),
    data_exclusao: z
      .string()
      .optional()
      .nullable()
      .transform((d) => (d === "" ? null : d)),
  });

export const insertPastorSchema = createInsertSchema(pastores)
  .omit({
    igreja_id: true,
  })
  .extend({
    nome: z
      .string()
      .min(3, "Nome deve ter pelo menos 3 caracteres")
      .max(100, "Nome não pode ter mais de 100 caracteres")
      .regex(/^[a-zA-ZÀ-ÿ\s]*$/, "Nome deve conter apenas letras"),
    cpf: z
      .string()
      .min(11, "CPF deve ter 11 dígitos")
      .max(14, "CPF inválido")
      .transform((cpf) => cpf.replace(/\D/g, "")),
    email: z
      .string()
      .email("Email inválido")
      .optional()
      .nullable()
      .transform((e) => (e === "" ? null : e)),
    telefone: z
      .string()
      .optional()
      .nullable()
      .transform((t) => (t === "" ? null : t)),
    foto: z.any().optional().nullable(),
    bio: z
      .string()
      .max(1000, "Biografia não pode ter mais de 1000 caracteres")
      .optional()
      .nullable(),
    ano_ordenacao: z.number().int().min(1900).max(new Date().getFullYear()),
  });

export const insertLiderancaSchema = createInsertSchema(liderancas)
  .omit({
    igreja_id: true,
  })
  .extend({
    cargo: z.enum(["presbitero", "diacono"], {
      required_error: "Selecione o cargo",
      invalid_type_error: "Cargo inválido",
    }),
    status: z.enum(["ativo", "inativo", "afastado", "emerito"], {
      required_error: "Selecione o status",
      invalid_type_error: "Status inválido",
    }),
  });

export const insertMandatoPastorSchema = createInsertSchema(mandatos_pastores)
  .omit({
    igreja_id: true,
  })
  .extend({
    data_eleicao: z.string().transform((date) => new Date(date).toISOString()),
    data_inicio: z.string().transform((date) => new Date(date).toISOString()),
    data_fim: z
      .string()
      .nullable()
      .optional()
      .transform((date) => (date ? new Date(date).toISOString() : null)),
    tipo_vinculo: z.enum(["eleito", "designado"], {
      required_error: "Selecione o tipo de vínculo",
      invalid_type_error: "Tipo de vínculo inválido",
    }),
    status: z.enum(["ativo", "finalizado"], {
      required_error: "Selecione o status",
      invalid_type_error: "Status inválido",
    }),
  });

export const insertMandatoLiderancaSchema = createInsertSchema(
  mandatos_liderancas,
)
  .omit({
    igreja_id: true,
  })
  .extend({
    data_eleicao: z.string().transform((date) => new Date(date).toISOString()),
    data_inicio: z.string().transform((date) => new Date(date).toISOString()),
    data_fim: z
      .string()
      .nullable()
      .optional()
      .transform((date) => (date ? new Date(date).toISOString() : null)),
    status: z.enum(["ativo", "inativo", "afastado", "emerito", "finalizado"], {
      required_error: "Selecione o status",
      invalid_type_error: "Status inválido",
    }),
  });

// Add insert schemas
export const insertSubscriptionPlanSchema = createInsertSchema(
  subscription_plans,
).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Types
export type Igreja = typeof igrejas.$inferSelect;
export type InsertIgreja = z.infer<typeof insertIgrejaSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Membro = typeof membros.$inferSelect;
export type InsertMembro = z.infer<typeof insertMembroSchema>;

export type Grupo = typeof grupos.$inferSelect;
export type InsertGrupo = z.infer<typeof insertGrupoSchema>;

export type Pastor = typeof pastores.$inferSelect;
export type InsertPastor = z.infer<typeof insertPastorSchema>;

export type Lideranca = typeof liderancas.$inferSelect;
export type InsertLideranca = z.infer<typeof insertLiderancaSchema>;

export type MandatoPastor = typeof mandatos_pastores.$inferSelect;
export type InsertMandatoPastor = z.infer<typeof insertMandatoPastorSchema>;

export type MandatoLideranca = typeof mandatos_liderancas.$inferSelect;
export type InsertMandatoLideranca = z.infer<
  typeof insertMandatoLiderancaSchema
>;

// Add types
export type SubscriptionPlan = typeof subscription_plans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<
  typeof insertSubscriptionPlanSchema
>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
