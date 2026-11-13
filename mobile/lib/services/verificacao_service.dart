import '../config/api_config.dart';
import 'api_client.dart';

/// Verificação de e-mail por código OTP — microsserviço em Dart (:3016).
abstract class VerificacaoService {
  /// Gera e envia o código; devolve a mensagem do servidor.
  Future<String> enviar(String email);

  /// Lança [ApiException] se o código for inválido ou expirado.
  Future<void> confirmar(String email, String codigo);
}

class HttpVerificacaoService implements VerificacaoService {
  final ApiClient _api;

  HttpVerificacaoService([ApiClient? api]) : _api = api ?? ApiClient();

  @override
  Future<String> enviar(String email) async {
    final dados = await _api.post(
      '${ApiConfig.verificacao}/verificacao/enviar',
      {'email': email.trim().toLowerCase()},
    );
    return dados is Map && dados['mensagem'] is String
        ? dados['mensagem'] as String
        : 'Código enviado para o e-mail.';
  }

  @override
  Future<void> confirmar(String email, String codigo) async {
    await _api.post(
      '${ApiConfig.verificacao}/verificacao/confirmar',
      {'email': email.trim().toLowerCase(), 'codigo': codigo.trim()},
    );
  }
}
