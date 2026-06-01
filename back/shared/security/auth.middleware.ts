import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "chave_secreta_padrao";

export interface UsuarioToken {
  sub: string;
  nome: string;
  perfil: "admin" | "cliente";
}

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioToken;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ mensagem: "Acesso não autorizado. Token ausente." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as UsuarioToken;
    req.usuario = payload;
    next();
  } catch {
    res.status(401).json({ mensagem: "Token inválido ou expirado." });
  }
}
