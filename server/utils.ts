import { Request } from "express";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import multer from "multer";
import { join } from "path";
import { mkdir } from "fs/promises";

// Diretório de upload
export const uploadDir = join(process.cwd(), "uploads");

// Configuração do multer
export const upload = multer({
  storage: multer.diskStorage({
    destination: async function (req, file, cb) {
      await mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = file.originalname.split('.').pop();
      cb(null, `${uniqueSuffix}.${ext}`);
    }
  })
});

// Funções de hash de senha
const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Funções de log
export function logAudit(req: Request, operacao: string, tipo: string, id: number): void {
  console.log(`AUDIT: usuário ${req.user?.username} (${req.user?.id}) realizou ${operacao} em ${tipo} #${id} às ${new Date().toISOString()}`);
}

export function logSubscriptionOp(req: Request, operation: string, details: any): void {
  console.log(`[Subscription ${operation}] User: ${req.user?.username} (${req.user?.id}) Igreja: ${req.user?.igreja_id} Details:`, details);
}
