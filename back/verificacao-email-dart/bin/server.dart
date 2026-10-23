import 'dart:io';

import 'package:shelf/shelf_io.dart' as io;
import 'package:verificacao_email_dart/config.dart';
import 'package:verificacao_email_dart/email_service.dart';
import 'package:verificacao_email_dart/otp_repository.dart';
import 'package:verificacao_email_dart/rotas.dart';

Future<void> main() async {
  final config = Config.carregar();

  final rotas = Rotas(
    repositorio: SupabaseOtpRepository(
      url: config.supabaseUrl,
      key: config.supabaseKey,
    ),
    emailService: SmtpEmailService(config),
    porta: config.porta,
  );

  final servidor = await io.serve(
    rotas.handler,
    InternetAddress.anyIPv4,
    config.porta,
  );
  print('Verificação de e-mail (Dart) rodando em http://localhost:${servidor.port}');
}
