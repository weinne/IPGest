import { Request, Response, NextFunction } from "express";

interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    password: string;
    role: "administrador" | "comum";
    igreja_id: number | null;
    email: string | null;
    nome_completo: string | null;
    foto_url: string | null;
    reset_token: string | null;
    reset_token_expiry: Date | null;
  };
}

// Middleware de autenticação base
export function isAuthenticated(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autorizado" });
  }
  next();
}

// Middleware para verificação de pertencimento à igreja
export function validateIgrejaAccess(req: AuthRequest, res: Response, next: NextFunction) {
  const user = req.user;
  const requestedIgrejaId = parseInt(req.body.igreja_id || req.query.igreja_id);

  if (!requestedIgrejaId) {
    return res.status(400).json({ message: 'igreja_id é obrigatório' });
  }

  if (user?.igreja_id !== requestedIgrejaId && user?.role !== 'administrador') {
    return res.status(403).json({ message: 'Acesso não autorizado a esta igreja' });
  }

  next();
}

// Middleware para verificar se o usuário pode escrever
export function canWrite(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autorizado" });
  }
  if (req.user?.role === "comum") {
    return res.status(403).json({ message: "Acesso negado" });
  }
  next();
}

// Middleware para verificar se o usuário é administrador
export function isAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autorizado" });
  }

  if (req.user?.role !== "administrador") {
    return res.status(403).json({ message: "Acesso negado" });
  }

  next();
}
