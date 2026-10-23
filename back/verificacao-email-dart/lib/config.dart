import 'dart:io';

import 'package:dotenv/dotenv.dart';

/// Configuração lida do ambiente (mesmas chaves do `.env` do projeto).
class Config {
  final int porta;
  final String supabaseUrl;
  final String supabaseKey;
  final String smtpHost;
  final int smtpPort;
  final String? smtpUser;
  final String? smtpPass;
  final String? emailFrom;

  const Config({
    required this.porta,
    required this.supabaseUrl,
    required this.supabaseKey,
    required this.smtpHost,
    required this.smtpPort,
    this.smtpUser,
    this.smtpPass,
    this.emailFrom,
  });

  bool get smtpConfigurado =>
      (smtpUser?.isNotEmpty ?? false) && (smtpPass?.isNotEmpty ?? false);

  /// Carrega o `.env` (diretório atual, depois pastas acima) e o ambiente do processo.
  factory Config.carregar() {
    final env = DotEnv(includePlatformEnvironment: true, quiet: true);
    for (final caminho in const ['.env', '../.env', '../../.env']) {
      if (File(caminho).existsSync()) {
        env.load([caminho]);
        break;
      }
    }

    String? ler(List<String> chaves) {
      for (final k in chaves) {
        final v = env[k];
        if (v != null && v.trim().isNotEmpty) return v.trim();
      }
      return null;
    }

    final url = ler(['DB_URL', 'SUPABASE_URL']);
    final key = ler([
      'SUPABASE_SERVICE_ROLE_KEY',
      'SERVICE_ROLE_KEY',
      'API_KEY',
      'SUPABASE_KEY',
    ]);
    if (url == null || key == null) {
      throw StateError(
        'Faltam variáveis de ambiente: DB_URL / SUPABASE_SERVICE_ROLE_KEY',
      );
    }

    return Config(
      porta: int.tryParse(ler(['PORT']) ?? '') ?? 3016,
      supabaseUrl: url.replaceAll(RegExp(r'/+$'), ''),
      supabaseKey: key,
      smtpHost: ler(['SMTP_HOST']) ?? 'smtp.gmail.com',
      smtpPort: int.tryParse(ler(['SMTP_PORT']) ?? '') ?? 587,
      smtpUser: ler(['SMTP_USER']),
      smtpPass: ler(['SMTP_PASS']),
      emailFrom: ler(['EMAIL_FROM']),
    );
  }
}
