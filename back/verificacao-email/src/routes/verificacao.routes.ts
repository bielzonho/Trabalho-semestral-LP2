import { Router, Request, Response } from "express";
import { supabase } from "../database";
import { enviarCodigoVerificacao } from "../mailer";

const router = Router();

function gerarCodigo(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /verificacao/enviar
// Gera e envia um OTP de 6 dígitos para o e-mail informado
router.post("/enviar", async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ mensagem: "E-mail é obrigatório." });
  }

  const emailNorm = email.trim().toLowerCase();
  const codigo    = gerarCodigo();
  const expiraEm  = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Invalida códigos anteriores não utilizados
  await supabase
    .from("verificacoes_email")
    .update({ usado: true })
    .eq("email", emailNorm)
    .eq("usado", false);

  const { error } = await supabase
    .from("verificacoes_email")
    .insert({ email: emailNorm, codigo, expira_em: expiraEm });

  if (error) {
    console.error("Erro ao salvar código:", error);
    return res.status(500).json({ mensagem: "Erro interno ao gerar código de verificação." });
  }

  try {
    await enviarCodigoVerificacao(emailNorm, codigo);
    return res.status(200).json({ mensagem: "Código enviado para o e-mail." });
  } catch (err) {
    // E-mail falhou, mas o código está salvo no banco e visível no console abaixo
    const msg = err instanceof Error ? err.message : String(err);
    console.error("\n[SMTP] Falha ao enviar e-mail:", msg);
    console.log("╔══════════════════════════════════════╗");
    console.log("║   CÓDIGO OTP (SMTP falhou — use este) ║");
    console.log(`║   E-mail : ${emailNorm.substring(0, 26).padEnd(26)} ║`);
    console.log(`║   Código : ${codigo.padEnd(26)} ║`);
    console.log("╚══════════════════════════════════════╝\n");
    // Retorna 200 mesmo assim — o usuário pode digitar o código exibido no terminal
    return res.status(200).json({
      mensagem: "Código gerado. Verifique o terminal do serviço 3014 (e-mail indisponível)."
    });
  }
});

// POST /verificacao/confirmar
// Valida o OTP e marca como utilizado
router.post("/confirmar", async (req: Request, res: Response) => {
  const { email, codigo } = req.body;

  if (!email || !codigo) {
    return res.status(400).json({ mensagem: "E-mail e código são obrigatórios." });
  }

  const emailNorm = email.trim().toLowerCase();
  const agora     = new Date().toISOString();

  const { data, error } = await supabase
    .from("verificacoes_email")
    .select("id")
    .eq("email", emailNorm)
    .eq("codigo", String(codigo))
    .eq("usado", false)
    .gte("expira_em", agora)
    .order("criado_em", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return res.status(400).json({ mensagem: "Código inválido ou expirado." });
  }

  await supabase
    .from("verificacoes_email")
    .update({ usado: true })
    .eq("id", data.id);

  return res.status(200).json({ verificado: true, mensagem: "E-mail verificado com sucesso." });
});

export default router;
