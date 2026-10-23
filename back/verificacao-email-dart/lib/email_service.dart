import 'package:mailer/mailer.dart';
import 'package:mailer/smtp_server.dart';

import 'config.dart';

/// Envio do código por e-mail.
abstract class EmailService {
  Future<void> enviarCodigo(String email, String codigo);
}

String _pad(String s) => s.padRight(27);

void exibirCodigoNoConsole(String email, String codigo) {
  print('\n╔══════════════════════════════════════╗');
  print('║   CÓDIGO DE VERIFICAÇÃO (DEV MODE)   ║');
  print('║   E-mail : ${_pad(email)}║');
  print('║   Código : ${_pad(codigo)}║');
  print('║   (Configure SMTP no .env para       ║');
  print('║    enviar por e-mail de verdade)      ║');
  print('╚══════════════════════════════════════╝\n');
}

/// Envia por SMTP; sem credenciais, apenas exibe o código no console.
class SmtpEmailService implements EmailService {
  final Config _config;

  SmtpEmailService(this._config);

  @override
  Future<void> enviarCodigo(String email, String codigo) async {
    if (!_config.smtpConfigurado) {
      exibirCodigoNoConsole(email, codigo);
      return;
    }

    final servidor = SmtpServer(
      _config.smtpHost,
      port: _config.smtpPort,
      username: _config.smtpUser,
      password: _config.smtpPass,
      ssl: _config.smtpPort == 465,
      allowInsecure: false,
    );

    final remetente = _config.emailFrom ?? '"Grão & Cesta" <${_config.smtpUser}>';
    final mensagem = Message()
      ..from = _parseRemetente(remetente)
      ..recipients.add(email)
      ..subject = 'Código de verificação - Grão & Cesta'
      ..html = corpoHtml(codigo);

    await send(mensagem, servidor);
  }

  Address _parseRemetente(String valor) {
    final m = RegExp(r'^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$').firstMatch(valor);
    if (m == null) return Address(valor.trim());
    return Address(m.group(2)!.trim(), m.group(1)!.trim());
  }
}

String corpoHtml(String codigo) => '''
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:420px;margin:0 auto;color:#3a2a1a;">
  <div style="background:#e6bb84;padding:20px 24px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;color:#3a2a1a;">Grão &amp; Cesta</h2>
  </div>
  <div style="background:#fff8f0;padding:24px;border-radius:0 0 8px 8px;border:1px solid #d4b896;">
    <p>Olá! Seu código de verificação é:</p>
    <div style="background:#fdf5e6;border:1px solid #d4b896;border-radius:8px;
                padding:20px;text-align:center;margin:16px 0;">
      <span style="font-size:38px;font-weight:bold;letter-spacing:12px;color:#c59d5f;">
        $codigo
      </span>
    </div>
    <p style="color:#7a6a5a;font-size:13px;">
      Este código expira em <strong>10 minutos</strong>.<br>
      Se você não solicitou este código, ignore este e-mail.
    </p>
  </div>
</div>
''';
