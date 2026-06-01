import { Router, Request, Response } from "express";
import { buscarPorEmail } from "../users";
import { gerarToken, verificarToken } from "../token";

const router = Router();

router.post("/login", (req: Request, res: Response) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ mensagem: "E-mail e senha são obrigatórios." });
  }

  const usuario = buscarPorEmail(email);

  if (!usuario || usuario.senha !== senha) {
    return res.status(401).json({ mensagem: "Credenciais inválidas." });
  }

  const token = gerarToken({
    sub: usuario.id,
    nome: usuario.nome,
    perfil: usuario.perfil
  });

  return res.status(200).json({
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil
    }
  });
});

router.get("/me", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ mensagem: "Token não fornecido." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verificarToken(token);
    return res.status(200).json({
      usuario: {
        sub: payload.sub,
        nome: payload.nome,
        perfil: payload.perfil
      }
    });
  } catch {
    return res.status(401).json({ mensagem: "Token inválido ou expirado." });
  }
});

export default router;
