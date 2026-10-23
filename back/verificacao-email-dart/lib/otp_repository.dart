import 'dart:convert';

import 'package:http/http.dart' as http;

/// Acesso aos códigos OTP (tabela `verificacoes_email`).
abstract class OtpRepository {
  /// Marca como usados todos os códigos ainda válidos do e-mail.
  Future<void> invalidarAnteriores(String email);

  /// Grava um novo código. Lança exceção se falhar.
  Future<void> inserir({
    required String email,
    required String codigo,
    required DateTime expiraEm,
  });

  /// Devolve o id do código mais recente, não usado e não expirado (ou null).
  Future<String?> buscarValido(String email, String codigo);

  Future<void> marcarUsado(String id);
}

/// Implementação via REST do Supabase (PostgREST), sem SDK.
class SupabaseOtpRepository implements OtpRepository {
  final Uri _base;
  final Map<String, String> _headers;
  final http.Client _client;

  SupabaseOtpRepository({
    required String url,
    required String key,
    http.Client? client,
  })  : _base = Uri.parse('$url/rest/v1/verificacoes_email'),
        _client = client ?? http.Client(),
        _headers = {
          'apikey': key,
          'Authorization': 'Bearer $key',
          'Content-Type': 'application/json',
        };

  Uri _uri(Map<String, String> query) => _base.replace(queryParameters: query);

  void _checar(http.Response r, String operacao) {
    if (r.statusCode < 200 || r.statusCode >= 300) {
      throw Exception('Supabase ($operacao) falhou: ${r.statusCode} ${r.body}');
    }
  }

  @override
  Future<void> invalidarAnteriores(String email) async {
    final r = await _client.patch(
      _uri({'email': 'eq.$email', 'usado': 'eq.false'}),
      headers: _headers,
      body: jsonEncode({'usado': true}),
    );
    _checar(r, 'invalidar');
  }

  @override
  Future<void> inserir({
    required String email,
    required String codigo,
    required DateTime expiraEm,
  }) async {
    final r = await _client.post(
      _base,
      headers: _headers,
      body: jsonEncode({
        'email': email,
        'codigo': codigo,
        'expira_em': expiraEm.toUtc().toIso8601String(),
      }),
    );
    _checar(r, 'inserir');
  }

  @override
  Future<String?> buscarValido(String email, String codigo) async {
    final r = await _client.get(
      _uri({
        'select': 'id',
        'email': 'eq.$email',
        'codigo': 'eq.$codigo',
        'usado': 'eq.false',
        'expira_em': 'gte.${DateTime.now().toUtc().toIso8601String()}',
        'order': 'criado_em.desc',
        'limit': '1',
      }),
      headers: _headers,
    );
    _checar(r, 'buscar');
    final lista = jsonDecode(r.body) as List<dynamic>;
    if (lista.isEmpty) return null;
    return (lista.first as Map<String, dynamic>)['id'].toString();
  }

  @override
  Future<void> marcarUsado(String id) async {
    final r = await _client.patch(
      _uri({'id': 'eq.$id'}),
      headers: _headers,
      body: jsonEncode({'usado': true}),
    );
    _checar(r, 'marcar usado');
  }
}
