import { pgTable, text, serial, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Igreja (tenant)
export const igrejas = pgTable("igrejas", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  cidade: text("cidade").notNull(),
  estado: text("estado").notNull(),
  presbitero: text("presbitero").notNull(),
});

// Usuário do sistema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "lider", "membro"] }).notNull().default("membro"),
  igreja_id: integer("igreja_id").references(() => igrejas.id),
});

// Membro da igreja
export const membros = pgTable("membros", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email"),
  telefone: text("telefone"),
  endereco: text("endereco"),
  data_nascimento: date("data_nascimento"),
  tipo: text("tipo", { enum: ["comungante", "nao_comungante"] }).notNull(),
  status: text("status", { enum: ["ativo", "inativo", "disciplina"] }).notNull().default("ativo"),
  data_admissao: timestamp("data_admissao").notNull(),
  tipo_admissao: text("tipo_admissao", { enum: ["batismo", "profissao_fe", "transferencia"] }).notNull(),
  igreja_id: integer("igreja_id").references(() => igrejas.id).notNull(),
});

// Grupos/Sociedades
export const grupos = pgTable("grupos", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  tipo: text("tipo", { enum: ["UCP", "UPA", "UMP", "SAF", "UPH", "outro"] }).notNull(),
  descricao: text("descricao"),
  igreja_id: integer("igreja_id").references(() => igrejas.id).notNull(),
});

// Relacionamento membros-grupos
export const membros_grupos = pgTable("membros_grupos", {
  membro_id: integer("membro_id").references(() => membros.id),
  grupo_id: integer("grupo_id").references(() => grupos.id),
});

// Liderança
export const liderancas = pgTable("liderancas", {
  id: serial("id").primaryKey(),
  membro_id: integer("membro_id").references(() => membros.id),
  cargo: text("cargo", { enum: ["pastor", "presbitero", "diacono"] }).notNull(),
  data_inicio: timestamp("data_inicio").notNull(),
  data_fim: timestamp("data_fim"),
  igreja_id: integer("igreja_id").references(() => igrejas.id).notNull(),
});

// Schemas para inserção
export const insertIgrejaSchema = createInsertSchema(igrejas);
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
}).extend({
  igreja_nome: z.string().min(3),
  igreja_cidade: z.string().min(3),
  igreja_estado: z.string().length(2),
  igreja_presbitero: z.string().min(3),
});

export const insertMembroSchema = createInsertSchema(membros).omit({ 
  igreja_id: true,
  data_admissao: true,
}).extend({
  nome: z.string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome não pode ter mais de 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s]*$/, "Nome deve conter apenas letras"),
  email: z.string()
    .email("Email inválido")
    .optional()
    .nullable()
    .transform(e => e === "" ? null : e),
  telefone: z.string()
    .regex(/^\(?[1-9]{2}\)? ?(?:[2-8]|9[1-9])[0-9]{3}\-?[0-9]{4}$/, "Telefone inválido")
    .optional()
    .nullable()
    .transform(t => t === "" ? null : t),
  endereco: z.string()
    .min(5, "Endereço deve ter pelo menos 5 caracteres")
    .max(200, "Endereço não pode ter mais de 200 caracteres")
    .optional()
    .nullable()
    .transform(e => e === "" ? null : e),
  data_nascimento: z.string()
    .refine((date) => {
      if (!date) return true;
      const d = new Date(date);
      return !isNaN(d.getTime()) && d <= new Date();
    }, "Data de nascimento inválida")
    .optional()
    .nullable()
    .transform(d => d === "" ? null : d),
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
});

export const insertGrupoSchema = createInsertSchema(grupos).omit({
  igreja_id: true,
});

export const insertLiderancaSchema = createInsertSchema(liderancas).omit({
  igreja_id: true,
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

export type Lideranca = typeof liderancas.$inferSelect;
export type InsertLideranca = z.infer<typeof insertLiderancaSchema>;