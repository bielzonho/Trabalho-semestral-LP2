import '../config/api_config.dart';
import 'api_client.dart';

/// Criação de conta (POST /auth/registrar, microsserviço auth :3013).
class CadastroService {
  final ApiClient _api;

  CadastroService([ApiClient? api]) : _api = api ?? ApiClient();

  Future<void> registrar(String nome, String email, String senha) async {
    await _api.post('${ApiConfig.auth}/auth/registrar', {
      'nome': nome.trim(),
      'email': email.trim().toLowerCase(),
      'senha': senha,
    });
  }
}
