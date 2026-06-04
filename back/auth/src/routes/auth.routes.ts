import { Router, Request, Response } from "express";
import { buscarPorEmail, registrarUsuario } from "../users";
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

router.post("/registrar", (req: Request, res: Response) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ mensagem: "Nome, e-mail e senha são obrigatórios." });
  }

  if (senha.length < 6) {
    return res.status(400).json({ mensagem: "A senha deve ter no mínimo 6 caracteres." });
  }

  if (buscarPorEmail(email)) {
    return res.status(409).json({ mensagem: "Este e-mail já está cadastrado." });
  }

  const novo = registrarUsuario(nome.trim(), email.trim().toLowerCase(), senha);

  return res.status(201).json({
    mensagem: "Conta criada com sucesso.",
    usuario: { id: novo.id, nome: novo.nome, email: novo.email, perfil: novo.perfil }
  });
});

export default router;
