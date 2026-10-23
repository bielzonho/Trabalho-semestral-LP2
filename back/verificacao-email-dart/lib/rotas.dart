import 'dart:convert';
import 'dart:math';

import 'package:shelf/shelf.dart';
import 'package:shelf_router/shelf_router.dart';

import 'email_service.dart';
import 'middlewares.dart';
import 'otp_repository.dart';

const validadeOtp = Duration(minutes: 10);

/// Código de 6 dígitos (100000–999999).
String gerarCodigo([Random? random]) =>
    (100000 + (random ?? Random.secure()).nextInt(900000)).toString();

/// Lê o corpo como JSON-objeto respeitando o limite de 100kb.
/// Devolve `{}` se o corpo for vazio, inválido ou não for um objeto.
Future<Map<String, dynamic>> _lerJson(Request req) async {
  final bytes = <int>[];
  await for (final pedaco in req.read()) {
    bytes.addAll(pedaco);
    if (bytes.length > limiteCorpoBytes) {
      throw const _CorpoGrande();
    }
  }
  if (bytes.isEmpty) return {};
  try {
    final decodificado = jsonDecode(utf8.decode(bytes));
    return decodificado is Map<String, dynamic> ? decodificado : {};
  } on FormatException {
    return {};
  }
}

class _CorpoGrande implements Exception {
  const _CorpoGrande();
}

class Rotas {
  final OtpRepository repositorio;
  final EmailService emailService;
  final int porta;
  final DateTime Function() agora;

  Rotas({
    required this.repositorio,
    required this.emailService,
    this.porta = 3016,
    DateTime Function()? agora,
  }) : agora = agora ?? DateTime.now;

  Handler get handler {
    final router = Router()
      ..get('/', _raiz)
      ..post('/verificacao/enviar', _enviar)
      ..post('/verificacao/confirmar', _confirmar)
      ..post('/eventos', _eventos);

    return const Pipeline()
        .addMiddleware(tratarErros())
        .addMiddleware(cabecalhosSeguranca())
        .addMiddleware(cors())
        .addMiddleware(limitarCorpo())
        .addHandler(router.call);
  }

  Response _raiz(Request req) => jsonResposta(200, {
        'servico': 'Microserviço de verificação de e-mail (OTP) — Dart',
        'status': 'online',
        'porta': porta,
      });

  Future<Response> _enviar(Request req) async {
    final Map<String, dynamic> corpo;
    try {
      corpo = await _lerJson(req);
    } on _CorpoGrande {
      return jsonResposta(413, {'mensagem': 'Corpo da requisição muito grande.'});
    }

    final email = corpo['email'];
    if (email is! String || email.trim().isEmpty) {
      return jsonResposta(400, {'mensagem': 'E-mail é obrigatório.'});
    }

    final emailNorm = email.trim().toLowerCase();
    final codigo = gerarCodigo();
    final expiraEm = agora().add(validadeOtp);

    try {
      await repositorio.invalidarAnteriores(emailNorm);
      await repositorio.inserir(
        email: emailNorm,
        codigo: codigo,
        expiraEm: expiraEm,
      );
    } catch (e) {
      print('Erro ao salvar código: $e');
      return jsonResposta(500, {
        'mensagem': 'Erro interno ao gerar código de verificação.',
      });
    }

    try {
      await emailService.enviarCodigo(emailNorm, codigo);
      return jsonResposta(200, {'mensagem': 'Código enviado para o e-mail.'});
    } catch (e) {
      // O código já está salvo; mostramos no console e respondemos 200
      // (mesmo comportamento do serviço Node).
      print('\n[SMTP] Falha ao enviar e-mail: $e');
      print('╔══════════════════════════════════════╗');
      print('║   CÓDIGO OTP (SMTP falhou — use este) ║');
      print('║   E-mail : ${emailNorm.padRight(26).substring(0, 26)} ║');
      print('║   Código : ${codigo.padRight(26)} ║');
      print('╚══════════════════════════════════════╝\n');
      return jsonResposta(200, {
        'mensagem': 'Código gerado. Verifique o terminal do serviço 3016 '
            '(e-mail indisponível).',
      });
    }
  }

  Future<Response> _confirmar(Request req) async {
    final Map<String, dynamic> corpo;
    try {
      corpo = await _lerJson(req);
    } on _CorpoGrande {
      return jsonResposta(413, {'mensagem': 'Corpo da requisição muito grande.'});
    }

    final email = corpo['email'];
    final codigo = corpo['codigo'];
    if (email is! String ||
        email.trim().isEmpty ||
        codigo == null ||
        codigo.toString().isEmpty) {
      return jsonResposta(400, {'mensagem': 'E-mail e código são obrigatórios.'});
    }

    final emailNorm = email.trim().toLowerCase();

    String? id;
    try {
      id = await repositorio.buscarValido(emailNorm, codigo.toString());
    } catch (e) {
      print('Erro ao validar código: $e');
    }
    if (id == null) {
      return jsonResposta(400, {'mensagem': 'Código inválido ou expirado.'});
    }

    await repositorio.marcarUsado(id);
    return jsonResposta(200, {
      'verificado': true,
      'mensagem': 'E-mail verificado com sucesso.',
    });
  }

  /// Recebe o broadcast do barramento; tipos desconhecidos são descartados.
  Future<Response> _eventos(Request req) async {
    try {
      final corpo = await _lerJson(req);
      final tipo = corpo['tipo'];
      if (tipo is String) {
        print('[VerificacaoEmail] Evento recebido e ignorado: $tipo');
      }
    } on _CorpoGrande {
      // descartado
    }
    return jsonResposta(200, {'msg': 'ok'});
  }
}
