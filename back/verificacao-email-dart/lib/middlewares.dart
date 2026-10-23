import 'dart:convert';

import 'package:shelf/shelf.dart';

/// Origens permitidas (iguais às do serviço Node).
const origensPermitidas = {
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'null',
};

const limiteCorpoBytes = 100 * 1024;

Response jsonResposta(int status, Object corpo) => Response(
      status,
      body: jsonEncode(corpo),
      headers: {'content-type': 'application/json; charset=utf-8'},
    );

/// CORS com whitelist; responde preflight (OPTIONS).
Middleware cors() => (Handler interno) => (Request req) async {
      final origem = req.headers['origin'];
      final permitida = origem != null && origensPermitidas.contains(origem);
      final headersCors = <String, String>{
        if (permitida) 'access-control-allow-origin': origem,
        if (permitida) 'vary': 'Origin',
        'access-control-allow-methods': 'GET, POST',
        'access-control-allow-headers': 'Content-Type, Authorization',
      };

      if (req.method == 'OPTIONS') {
        return Response(204, headers: headersCors);
      }
      final resposta = await interno(req);
      return resposta.change(headers: headersCors);
    };

/// Cabeçalhos de segurança básicos (equivalente enxuto ao helmet).
Middleware cabecalhosSeguranca() => (Handler interno) => (Request req) async {
      final resposta = await interno(req);
      return resposta.change(headers: {
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'SAMEORIGIN',
        'referrer-policy': 'no-referrer',
        'cross-origin-resource-policy': 'same-origin',
        'strict-transport-security': 'max-age=15552000; includeSubDomains',
        'x-dns-prefetch-control': 'off',
      });
    };

/// Rejeita corpos acima de 100kb com 413.
Middleware limitarCorpo() => (Handler interno) => (Request req) {
      final tamanho = req.contentLength;
      if (tamanho != null && tamanho > limiteCorpoBytes) {
        return jsonResposta(413, {'mensagem': 'Corpo da requisição muito grande.'});
      }
      return interno(req);
    };

/// Converte exceções não tratadas em 500 JSON, sem vazar detalhes.
Middleware tratarErros() => (Handler interno) => (Request req) async {
      try {
        return await interno(req);
      } catch (e, st) {
        print('[Erro] ${req.method} ${req.url}: $e\n$st');
        return jsonResposta(500, {'mensagem': 'Erro interno do servidor.'});
      }
    };
