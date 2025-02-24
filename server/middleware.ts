import { Request, Response, NextFunction } from "express";

// Middleware para verificar se o usuário é administrador
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autorizado" });
  }

  if (req.user?.role !== "administrador") {
    return res.status(403).json({ message: "Acesso negado" });
  }

  next();
}

// Middleware para verificar operações de escrita
export function canWrite(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Não autorizado" });
  }

  // Permite operações de escrita apenas para administradores ou em requisições POST (criar)
  if (req.method === "POST" || req.user?.role === "administrador") {
    return next();
  }

  // Bloqueia operações de modificação (PUT, PATCH, DELETE) para usuários comuns
  if (["PUT", "PATCH", "DELETE"].includes(req.method)) {
    return res.status(403).json({ message: "Acesso negado. Apenas administradores podem modificar registros." });
  }

  next();
}
