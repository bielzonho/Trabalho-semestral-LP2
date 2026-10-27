import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';

/// Erro de API com mensagem pronta para mostrar ao usuário.
class ApiException implements Exception {
  final String mensagem;
  final int? status;

  const ApiException(this.mensagem, {this.status});

  @override
  String toString() => mensagem;
}

/// Pequeno wrapper do `http`: JSON, timeout e erros em português.
class ApiClient {
  final http.Client _client;

  ApiClient([http.Client? client]) : _client = client ?? http.Client();

  Future<dynamic> get(String url, {String? token}) =>
      _enviar(() => _client.get(Uri.parse(url), headers: _headers(token)));

  Future<dynamic> post(String url, Map<String, dynamic> corpo, {String? token}) =>
      _enviar(() => _client.post(
            Uri.parse(url),
            headers: _headers(token),
            body: jsonEncode(corpo),
          ));

  Map<String, String> _headers(String? token) => {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<dynamic> _enviar(Future<http.Response> Function() requisicao) async {
    final http.Response resposta;
    try {
      resposta = await requisicao().timeout(ApiConfig.timeout);
    } on TimeoutException {
      throw const ApiException('O servidor demorou demais para responder.');
    } catch (_) {
      throw const ApiException(
        'Não foi possível conectar ao servidor. Verifique se o back end está no ar.',
      );
    }

    dynamic corpo;
    try {
      corpo = resposta.body.isEmpty ? null : jsonDecode(utf8.decode(resposta.bodyBytes));
    } on FormatException {
      corpo = null;
    }

    if (resposta.statusCode >= 200 && resposta.statusCode < 300) return corpo;

    final mensagem = corpo is Map && corpo['mensagem'] is String
        ? corpo['mensagem'] as String
        : 'Erro inesperado (${resposta.statusCode}).';
    throw ApiException(mensagem, status: resposta.statusCode);
  }
}
