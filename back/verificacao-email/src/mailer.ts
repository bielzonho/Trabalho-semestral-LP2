import nodemailer from "nodemailer";

function criarTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

export async function enviarCodigoVerificacao(email: string, codigo: string): Promise<void> {
  // Modo desenvolvimento: sem SMTP configurado, exibe o código no console
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("\n╔══════════════════════════════════════╗");
    console.log("║   CÓDIGO DE VERIFICAÇÃO (DEV MODE)   ║");
    console.log(`║   E-mail : ${email.padEnd(27)}║`);
    console.log(`║   Código : ${codigo.padEnd(27)}║`);
    console.log("║   (Configure SMTP no .env para       ║");
    console.log("║    enviar por e-mail de verdade)      ║");
    console.log("╚══════════════════════════════════════╝\n");
    return;
  }

  const transporter = criarTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"Grão & Cesta" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Código de verificação - Grão & Cesta",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:420px;margin:0 auto;color:#3a2a1a;">
        <div style="background:#e6bb84;padding:20px 24px;border-radius:8px 8px 0 0;">
          <h2 style="margin:0;color:#3a2a1a;">Grão &amp; Cesta</h2>
        </div>
        <div style="background:#fff8f0;padding:24px;border-radius:0 0 8px 8px;border:1px solid #d4b896;">
          <p>Olá! Seu código de verificação é:</p>
          <div style="background:#fdf5e6;border:1px solid #d4b896;border-radius:8px;
                      padding:20px;text-align:center;margin:16px 0;">
            <span style="font-size:38px;font-weight:bold;letter-spacing:12px;color:#c59d5f;">
              ${codigo}
            </span>
          </div>
          <p style="color:#7a6a5a;font-size:13px;">
            Este código expira em <strong>10 minutos</strong>.<br>
            Se você não solicitou este código, ignore este e-mail.
          </p>
        </div>
      </div>
    `
  });
}
