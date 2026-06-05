import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { buscarPorEmail, registrarUsuario } from "../users";
import { gerarToken, verificarToken } from "../token";
import { supabase } from "../database";

const router = Router();

// ── Helpers de banco ─────────────────────────────────────────

async function buscarUsuarioBanco(email: string) {
  const { data } = await supabase
    .from("users")
    .select("id, name, email, password")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  if (!data) return null;
  return {
    id:     String(data.id),
    nome:   data.name   as string,
    email:  data.email  as string,
    senha:  data.password as string,
    perfil: "cliente" as const
  };
}

async function emailExisteNoBanco(email: string): Promise<boolean> {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return !!data;
}

// ── POST /auth/login ─────────────────────────────────────────

router.post("/login", async (req: Request, res: Response) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ mensagem: "E-mail e senha são obrigatórios." });
  }

  const emailNorm = email.trim().toLowerCase();

  // 1. Tenta usuários em memória (admin e cliente de teste)
  const usuarioMemoria = buscarPorEmail(emailNorm);
  if (usuarioMemoria) {
    if (usuarioMemoria.senha !== senha) {
      return res.status(401).json({ mensagem: "Credenciais inválidas." });
    }

    const token = gerarToken({
      sub:    usuarioMemoria.id,
      nome:   usuarioMemoria.nome,
      email:  usuarioMemoria.email,
      perfil: usuarioMemoria.perfil
    });

    return res.status(200).json({
      token,
      usuario: {
        id:     usuarioMemoria.id,
        nome:   usuarioMemoria.nome,
        email:  usuarioMemoria.email,
        perfil: usuarioMemoria.perfil
      }
    });
  }

  // 2. Tenta usuários cadastrados no banco
  try {
    const usuarioBanco = await buscarUsuarioBanco(emailNorm);

    if (!usuarioBanco) {
      return res.status(401).json({ mensagem: "Credenciais inválidas." });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuarioBanco.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ mensagem: "Credenciais inválidas." });
    }

    const token = gerarToken({
      sub:    usuarioBanco.id,
      nome:   usuarioBanco.nome,
      email:  usuarioBanco.email,
      perfil: usuarioBanco.perfil as "admin" | "cliente"
    });

    return res.status(200).json({
      token,
      usuario: {
        id:     usuarioBanco.id,
        nome:   usuarioBanco.nome,
        email:  usuarioBanco.email,
        perfil: usuarioBanco.perfil
      }
    });
  } catch {
    return res.status(401).json({ mensagem: "Credenciais inválidas." });
  }
});

// ── GET /auth/me ─────────────────────────────────────────────

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
        sub:    payload.sub,
        nome:   payload.nome,
        email:  payload.email,
        perfil: payload.perfil
      }
    });
  } catch {
    return res.status(401).json({ mensagem: "Token inválido ou expirado." });
  }
});

// ── POST /auth/registrar ─────────────────────────────────────

router.post("/registrar", async (req: Request, res: Response) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ mensagem: "Nome, e-mail e senha são obrigatórios." });
  }

  if (senha.length < 6) {
    return res.status(400).json({ mensagem: "A senha deve ter no mínimo 6 caracteres." });
  }

  const emailNorm = email.trim().toLowerCase();

  // Verifica duplicata em memória
  if (buscarPorEmail(emailNorm)) {
    return res.status(409).json({ mensagem: "Este e-mail já está cadastrado." });
  }

  // Verifica duplicata no banco
  try {
    if (await emailExisteNoBanco(emailNorm)) {
      return res.status(409).json({ mensagem: "Este e-mail já está cadastrado." });
    }

    // Gera hash antes de salvar (nunca armazena senha em texto puro)
    const senhaHash = await bcrypt.hash(senha, 10);

    const { data, error } = await supabase
      .from("users")
      .insert({ name: nome.trim(), email: emailNorm, password: senhaHash })
      .select("id, name, email")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Erro ao salvar usuário.");
    }

    // Mantém também na memória para a sessão atual (senha original para comparação direta)
    registrarUsuario(data.name, data.email, senha);

    return res.status(201).json({
      mensagem: "Conta criada com sucesso.",
      usuario: { id: data.id, nome: data.name, email: data.email, perfil: "cliente" }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao criar conta.";
    return res.status(500).json({ mensagem: msg });
  }
});

export default router;
