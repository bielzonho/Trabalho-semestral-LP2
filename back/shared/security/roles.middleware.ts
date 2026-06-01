import { Request, Response, NextFunction } from "express";

export function requireRole(perfil: "admin" | "cliente") {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      res.status(401).json({ mensagem: "Acesso não autorizado." });
      return;
    }

    // admin pode tudo; cliente só acessa rotas de perfil "cliente"
    if (req.usuario.perfil !== "admin" && req.usuario.perfil !== perfil) {
      res.status(403).json({ mensagem: "Permissão insuficiente." });
      return;
    }

    next();
  };
}
